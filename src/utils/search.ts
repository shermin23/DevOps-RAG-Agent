import type { DocumentChunk } from '../types';

/**
 * A simulated retrieval system.
 * 
 * REAL WORLD CONTEXT:
 * In a production RAG app, this would be replaced by a Vector Database (Chroma, Pinecone)
 * and an Embedding Model (OpenAI text-embedding-3, Gecko).
 * 
 * SIMULATION LOGIC:
 * Since we are running purely in the browser without heavy ML models, we use a 
 * "Bag of Words" + Weighted Jaccard Similarity approach. This finds chunks that 
 * share the most significant keywords with the query.
 */
export const retrieveRelevantChunks = (
  query: string,
  allChunks: DocumentChunk[],
  topK: number = 3
): DocumentChunk[] => {
  if (allChunks.length === 0) return [];

  const queryTokens = tokenize(query);
  
  // Score every chunk against the query
  const scoredChunks = allChunks.map(chunk => {
    const chunkTokens = tokenize(chunk.content);
    const score = calculateScore(queryTokens, chunkTokens);
    return { chunk, score };
  });

  // Sort by score descending (highest relevance first)
  scoredChunks.sort((a, b) => b.score - a.score);

  // Return top K results
  return scoredChunks.slice(0, topK).map(item => item.chunk);
};

/**
 * Breaks text into a set of unique, significant words (tokens).
 * Filters out short words and punctuation.
 */
const tokenize = (text: string): Set<string> => {
  return new Set(
    text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(w => w.length > 2) // Remove short words (stopwords approximation)
  );
};

/**
 * Calculates a similarity score between 0 and 1.
 * Uses a variation of Jaccard Index (Intersection over Union).
 */
const calculateScore = (queryTokens: Set<string>, chunkTokens: Set<string>): number => {
  let overlap = 0;
  queryTokens.forEach(qt => {
    if (chunkTokens.has(qt)) {
      overlap += 1;
    }
  });
  
  // Prevent division by zero
  const union = queryTokens.size + chunkTokens.size - overlap;
  return overlap / (union || 1);
};