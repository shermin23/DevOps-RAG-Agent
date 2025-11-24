import { DocumentChunk } from '../types';

/**
 * A simulated retrieval system since we cannot run ChromaDB in the browser easily without WebAssembly/Embeddings.
 * This uses a "Bag of Words" + Weighted overlap approach to find relevant chunks.
 */
export const retrieveRelevantChunks = (
  query: string,
  allChunks: DocumentChunk[],
  topK: number = 3
): DocumentChunk[] => {
  if (allChunks.length === 0) return [];

  const queryTokens = tokenize(query);
  
  const scoredChunks = allChunks.map(chunk => {
    const chunkTokens = tokenize(chunk.content);
    const score = calculateScore(queryTokens, chunkTokens);
    return { chunk, score };
  });

  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, topK).map(item => item.chunk);
};

const tokenize = (text: string): Set<string> => {
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 2) // Remove short words
  );
};

const calculateScore = (queryTokens: Set<string>, chunkTokens: Set<string>): number => {
  let overlap = 0;
  queryTokens.forEach(qt => {
    if (chunkTokens.has(qt)) {
      overlap += 1;
    }
  });
  // Jaccard similarity-ish
  return overlap / (queryTokens.size + chunkTokens.size - overlap || 1);
};