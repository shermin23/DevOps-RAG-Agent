export interface DocumentChunk {
  id: string;
  sourceId: string;
  content: string;
  metadata: {
    startIndex: number;
    endIndex: number;
  };
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  chunks: DocumentChunk[];
  uploadDate: Date;
}

export interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  detail?: string;
}

export interface RAGResult {
  originalLog: string;
  searchQuery: string;
  retrievedChunks: DocumentChunk[];
  solution: string;
  timestamp: Date;
}
