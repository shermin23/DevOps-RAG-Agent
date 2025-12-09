# API Reference

Complete documentation of the DevOps RAG Agent service layer.

---

## Core Services

### `gemini.ts` - LLM Interface

Handles all interactions with Google Gemini API.

#### `getAIClient()`

Initializes the GenAI client with proper environment detection.

```typescript
const getAIClient = () => {
    const apiKey = (typeof process !== 'undefined' ? process.env.API_KEY : undefined) || 
                   (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_KEY : undefined);
    
    if (!apiKey) {
        throw new Error("API Key not found in environment.");
    }
    return new GoogleGenAI({ apiKey });
}
```

**Returns:** `GoogleGenAI` client instance  
**Throws:** `Error` if API key not found  
**Environment:** Works in both Node.js and Vite/browser environments

---

#### `cleanLogToQuery(rawLog: string): Promise<string>`

**Purpose:** Remove noise from error logs and extract semantic search query.

**Input:**
```typescript
const rawLog = `
[2023-10-10 10:00:45.892] [WARN] Database connection timeout
  PID: 45821
  Thread: main-worker-7
  Exception: java.sql.SQLTimeoutException: Connection timeout (30000ms)
  at com.mysql.jdbc.SQLError.createSQLException(SQLError.java:1073)
`;
```

**Output:**
```typescript
"Database connection timeout SQLTimeoutException 30000ms MySQL"
```

**Code:**
```typescript
export const cleanLogToQuery = async (rawLog: string): Promise<string> => {
  const ai = getAIClient();
  const model = "gemini-2.5-flash";

  const prompt = `
    You are a DevOps expert assistant. 
    Analyze the raw error log and extract the core technical issue.
    Remove timestamps, IP addresses, PID, and generic noise.
    Focus on error codes, exception names, and specific failure messages.
    
    RAW LOG:
    "${rawLog}"

    OUTPUT (Just the clean query, nothing else):
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "Error parsing log";
  } catch (error) {
    console.error("Gemini Query Clean Error:", error);
    throw error;
  }
};
```

**Parameters:**
- `rawLog` (string): Raw error log (any length, any format)

**Returns:** Promise<string> - Cleaned, semantic search query  
**Error Handling:** Throws on API failure  
**Latency:** 2-3 seconds (network-bound)

**Example:**
```typescript
const rawLog = "[ERROR] Connection refused 192.168.1.1:8080";
const cleanQuery = await cleanLogToQuery(rawLog);
console.log(cleanQuery);  // "Connection refused port 8080"
```

---

#### `generateRAGSolution(query: string, chunks: DocumentChunk[]): Promise<string>`

**Purpose:** Generate AI solution grounded in retrieved documents with citations.

**Input:**
```typescript
const query = "Database connection timeout SQLTimeoutException";
const chunks = [
  {
    sourceId: "mysql-config",
    content: "Set max_connections = 1000 in /etc/mysql/my.cnf"
  },
  {
    sourceId: "pool-sizing",
    content: "Connection pool timeout should be 30s for high-load apps"
  }
];
```

**Output:**
```typescript
`
**Root Cause:**
Your application cannot establish a connection to MySQL within 30 seconds.
[Source ID: pool-sizing]

**Steps to Resolve:**
1. Verify MySQL is running
   Command: systemctl status mysql
   [Source ID: mysql-config]

2. Check connection pool settings
   ...
`
```

**Code:**
```typescript
export const generateRAGSolution = async (
  query: string, 
  chunks: DocumentChunk[]
): Promise<string> => {
  const ai = getAIClient();
  const model = "gemini-2.5-flash";

  const contextText = chunks.map((c) => 
    `[Source ID: ${c.sourceId}]: ${c.content}`
  ).join("\n\n");

  const prompt = `
    You are a SENIOR DEVOPS ENGINEER.
    
    Task: Diagnose the issue and provide a step-by-step solution based STRICTLY on the provided context.
    
    CONTEXT (Technical Documentation):
    ${contextText}
    
    USER QUERY / ERROR:
    ${query}
    
    INSTRUCTIONS:
    1. Analyze the error in relation to the context.
    2. Provide a Root Cause Analysis.
    3. Provide a numbered Solution plan.
    4. You MUST cite the Source ID for every claim you make (e.g., "Check config X [Source ID: doc-1]").
    5. If the context does not contain the answer, state that clearly and offer general DevOps best practices instead.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Unable to generate solution.";
  } catch (error) {
    console.error("Gemini Solution Gen Error:", error);
    throw error;
  }
};
```

**Parameters:**
- `query` (string): Clean search query from `cleanLogToQuery()`
- `chunks` (DocumentChunk[]): Retrieved documents (top K results)

**Returns:** Promise<string> - Markdown solution with citations  
**Error Handling:** Throws on API failure  
**Latency:** 2-3 seconds (network-bound)  
**Important:** Always includes [Source ID: X] citations

**Example:**
```typescript
const solution = await generateRAGSolution(
  "Connection refused port 8080",
  retrievedChunks
);
console.log(solution);
// Output: **Root Cause:** ... [Source ID: doc-1]
```

---

## Search Service

### `search.ts` - Vector/Keyword Search

Local retrieval from knowledge base (no API calls).

#### `calculateRelevance(query: string, content: string): number`

**Purpose:** Score how relevant a document is to a search query.

**Algorithm:**
1. Extract query terms (lowercase, split by whitespace)
2. Count matching terms in document content
3. Return match count as relevance score

**Code:**
```typescript
export const calculateRelevance = (query: string, content: string): number => {
  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0);
  
  const contentLower = content.toLowerCase();
  
  return queryTerms.filter(term => 
    contentLower.includes(term)
  ).length;
};
```

**Parameters:**
- `query` (string): Search query ("connection timeout")
- `content` (string): Document content

**Returns:** number - Match count (higher = more relevant)  
**Latency:** <1ms  
**Limitation:** Keyword matching only, no semantic understanding

**Example:**
```typescript
const score1 = calculateRelevance(
  "database connection",
  "MySQL connection pooling strategies"
);
console.log(score1);  // 2 (matches "connection")

const score2 = calculateRelevance(
  "database connection",
  "Network latency troubleshooting"
);
console.log(score2);  // 0 (no matches)
```

---

#### `retrieveRelevantChunks(query: string, chunks: DocumentChunk[], topK: number): DocumentChunk[]`

**Purpose:** Find the K most relevant documents for a query.

**Algorithm:**
1. Score each chunk using `calculateRelevance()`
2. Sort by score (descending)
3. Return top K chunks

**Code:**
```typescript
export const retrieveRelevantChunks = (
  query: string,
  chunks: DocumentChunk[],
  topK: number = 3
): DocumentChunk[] => {
  const scored = chunks.map(chunk => ({
    chunk,
    score: calculateRelevance(query, chunk.content)
  }));
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk }) => chunk);
};
```

**Parameters:**
- `query` (string): Search query
- `chunks` (DocumentChunk[]): All documents to search
- `topK` (number, default 3): Number of results to return

**Returns:** DocumentChunk[] - Top K most relevant documents  
**Latency:** <100ms (O(n log n) due to sorting)  
**Scalability:** Linear with document count

**Example:**
```typescript
const allChunks = [
  { sourceId: "doc-1", content: "MySQL configuration..." },
  { sourceId: "doc-2", content: "Network troubleshooting..." },
  { sourceId: "doc-3", content: "Connection pooling..." }
];

const results = retrieveRelevantChunks(
  "database connection timeout",
  allChunks,
  topK = 2
);

// Returns [doc-3, doc-1] (highest scores first)
```

---

## Text Processing

### `textProcessor.ts` - Document Chunking

Prepare documents for indexing.

#### `createChunksFromDoc(docId: string, content: string): DocumentChunk[]`

**Purpose:** Split large documents into searchable chunks.

**Algorithm:**
1. Divide content into chunks of `CHUNK_SIZE` characters
2. Add overlap (e.g., 50 characters) to preserve context
3. Create metadata: `sourceId`, `content`

**Code (Example):**
```typescript
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

export const createChunksFromDoc = (
  docId: string, 
  content: string
): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  let position = 0;
  
  while (position < content.length) {
    const end = Math.min(position + CHUNK_SIZE, content.length);
    const chunkContent = content.substring(position, end);
    
    chunks.push({
      sourceId: docId,
      content: chunkContent
    });
    
    position += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  
  return chunks;
};
```

**Parameters:**
- `docId` (string): Document identifier (e.g., "mysql-guide")
- `content` (string): Full document text

**Returns:** DocumentChunk[] - Array of chunks  
**Default Chunk Size:** 500 characters  
**Default Overlap:** 50 characters (prevents splitting mid-sentence)

**Example:**
```typescript
const doc = "MySQL Configuration Guide\n\n1. Install MySQL...\n\n2. Configure...";
const chunks = createChunksFromDoc("mysql-guide", doc);

console.log(chunks[0]);
// {
//   sourceId: "mysql-guide",
//   content: "MySQL Configuration Guide\n\n1. Install MySQL...\n\n2. Configure"
// }
```

---

## Type Definitions

### `DocumentChunk`
```typescript
interface DocumentChunk {
  sourceId: string;      // Document identifier (e.g., "doc-1")
  content: string;       // Chunk text
}
```

### `KnowledgeDoc`
```typescript
interface KnowledgeDoc {
  id: string;                    // Unique doc ID
  title: string;                 // User-friendly name
  content: string;               // Full document text
  chunks: DocumentChunk[];       // Chunked content
  uploadDate: Date;              // When uploaded
}
```

### `RAGResult`
```typescript
interface RAGResult {
  originalLog: string;           // User's input
  searchQuery: string;           // Cleaned query
  retrievedChunks: DocumentChunk[];  // Retrieved docs
  solution: string;              // AI-generated answer
  timestamp: Date;               // When generated
}
```

### `AnalysisStep`
```typescript
interface AnalysisStep {
  id: string;                           // "1", "2", "3", "4"
  label: string;                        // "Ingest Log", "Refine Query", etc.
  status: 'pending' | 'loading' | 'complete' | 'error';
}
```

---

## Error Handling

### Common Errors

#### API Key Missing
```typescript
try {
  const ai = getAIClient();
} catch (error) {
  console.error(error.message);
  // "API Key not found in environment. For local dev, set VITE_API_KEY in .env"
}
```

**Fix:**
```bash
# Development
echo "VITE_API_KEY=sk-..." > .env.local

# Production
export API_KEY=sk-...
```

#### API Rate Limit
```typescript
try {
  const result = await cleanLogToQuery(rawLog);
} catch (error) {
  // "Rate limit exceeded"
}
```

**Fix:** Implement retry with exponential backoff
```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000;  // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

#### Network Timeout
```typescript
// Default timeout: 30 seconds
// Increase if needed in production

const response = await ai.models.generateContent({
  model,
  contents: prompt,
  // timeout: 60000  // 60 seconds (if SDK supports)
});
```

---

## Performance Tuning

### Optimize `cleanLogToQuery()` Speed

**Current:** 2-3 seconds  
**Target:** <2 seconds

**Options:**
1. Use faster model: `gemini-1.5-flash-8b`
2. Add caching: Skip cleaning for duplicate logs
3. Batch requests: Clean multiple logs in one API call

```typescript
// Caching example
const queryCache = new Map<string, string>();

export const cleanLogToQueryWithCache = async (rawLog: string) => {
  const hash = hashString(rawLog);
  if (queryCache.has(hash)) {
    return queryCache.get(hash)!;
  }
  
  const result = await cleanLogToQuery(rawLog);
  queryCache.set(hash, result);
  return result;
};
```

### Optimize `retrieveRelevantChunks()` Speed

**Current:** <100ms for 100 chunks  
**Target:** <50ms

**Options:**
1. Build inverted index (pre-process)
2. Use BM25 ranking (better than keyword matching)
3. Add filtering (exclude chunks below score threshold)

```typescript
// Inverted index example
class SearchIndex {
  private index: Map<string, DocumentChunk[]> = new Map();
  
  build(chunks: DocumentChunk[]) {
    for (const chunk of chunks) {
      const terms = chunk.content.toLowerCase().split(/\s+/);
      for (const term of terms) {
        if (!this.index.has(term)) {
          this.index.set(term, []);
        }
        this.index.get(term)!.push(chunk);
      }
    }
  }
  
  search(query: string, topK: number = 3) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const matches = new Map<DocumentChunk, number>();
    
    for (const term of queryTerms) {
      const docs = this.index.get(term) || [];
      for (const doc of docs) {
        matches.set(doc, (matches.get(doc) || 0) + 1);
      }
    }
    
    return Array.from(matches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([chunk]) => chunk);
  }
}
```

---

## Examples

### Complete Pipeline
```typescript
// 1. User uploads documentation
const doc = new KnowledgeDoc({
  id: "k8s-guide",
  title: "Kubernetes Troubleshooting",
  content: "..."
});
const chunks = createChunksFromDoc(doc.id, doc.content);

// 2. User pastes error log
const rawLog = "[ERROR] Pod CrashLoopBackOff: OOM killed at 12:34";

// 3. Clean the query
const searchQuery = await cleanLogToQuery(rawLog);
// "Pod CrashLoopBackOff OOM memory"

// 4. Retrieve relevant docs
const retrieved = retrieveRelevantChunks(searchQuery, chunks, topK=3);
// [chunk1, chunk2, chunk3]

// 5. Generate solution
const solution = await generateRAGSolution(searchQuery, retrieved);
// "**Root Cause:** Pod out of memory... [Source ID: k8s-guide]"

// 6. Return to user
const result: RAGResult = {
  originalLog: rawLog,
  searchQuery,
  retrievedChunks: retrieved,
  solution,
  timestamp: new Date()
};
```

---

## Migration Guide (Extending API)

### Add Support for Different LLMs

```typescript
// Extend to support Claude, GPT-4, Llama, etc.

interface LLMConfig {
  provider: 'google' | 'openai' | 'anthropic' | 'ollama';
  model: string;
  apiKey: string;
}

export const createLLMClient = (config: LLMConfig) => {
  switch (config.provider) {
    case 'google':
      return new GoogleGenAI({ apiKey: config.apiKey });
    case 'openai':
      return new OpenAI({ apiKey: config.apiKey });
    case 'anthropic':
      return new Anthropic({ apiKey: config.apiKey });
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
};
```

### Switch to Vector Embeddings

```typescript
// Replace keyword matching with real vectors

import { OpenAI } from 'openai';

export const getEmbedding = async (text: string) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  
  return response.data[0].embedding;
};

export const retrieveRelevantChunksWithVectors = async (
  query: string,
  chunks: DocumentChunk[],
  topK: number = 3
) => {
  const queryEmbedding = await getEmbedding(query);
  
  const scored = chunks.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ chunk }) => chunk);
};
```

---

## Support

Need help? Check:
- **Main Docs:** [README.md](../README.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **GitHub Issues:** [shermin23/DevOps-RAG-Agent](https://github.com/shermin23/DevOps-RAG-Agent/issues)
