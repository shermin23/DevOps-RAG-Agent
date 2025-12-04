import type { DocumentChunk } from '../types';

/**
 * Simulates a RecursiveCharacterTextSplitter.
 * 
 * In a real RAG system (like LangChain), this strategy is critical for keeping related text together.
 * It tries to split by paragraphs first, then newlines, then spaces, to preserve semantic meaning.
 * 
 * @param text The raw text content to split.
 * @param chunkSize Target size of each chunk.
 * @param chunkOverlap Overlap between chunks to maintain context across boundaries.
 */
export const recursiveCharacterSplit = (
  text: string,
  chunkSize: number = 500,
  chunkOverlap: number = 50
): string[] => {
  const separators = ["\n\n", "\n", " ", ""];
  let finalChunks: string[] = [];

  // Recursive function to split text based on hierarchy of separators
  const splitText = (currentText: string, separatorIndex: number): string[] => {
    // Base case: If text fits in a chunk, return it
    if (currentText.length <= chunkSize) {
      return [currentText];
    }

    // Fallback: If no separators left, hard split by character count
    if (separatorIndex >= separators.length) {
      const hardChunks: string[] = [];
      for (let i = 0; i < currentText.length; i += chunkSize - chunkOverlap) {
        hardChunks.push(currentText.slice(i, i + chunkSize));
      }
      return hardChunks;
    }

    const separator = separators[separatorIndex];
    let splits: string[] = [];
    
    if (separator === "") {
        splits = Array.from(currentText); 
    } else {
        splits = currentText.split(separator);
    }

    // Recombine splits into chunks that fit within chunkSize
    let goodSplits: string[] = [];
    let currentChunk = "";

    for (const split of splits) {
      const potentialChunk = currentChunk.length > 0 
        ? currentChunk + separator + split 
        : split;

      if (potentialChunk.length < chunkSize) {
        currentChunk = potentialChunk;
      } else {
        // Current chunk is full, push it and start a new one
        if (currentChunk) {
          goodSplits.push(currentChunk);
        }
        currentChunk = split;
      }
    }
    // Push the remainder
    if (currentChunk) {
      goodSplits.push(currentChunk);
    }

    // Recursively process chunks that are still too big (unlikely but possible if a single section is huge)
    let processedSplits: string[] = [];
    for (const chunk of goodSplits) {
        if (chunk.length > chunkSize) {
            processedSplits = processedSplits.concat(splitText(chunk, separatorIndex + 1));
        } else {
            processedSplits.push(chunk);
        }
    }

    return processedSplits;
  };

  finalChunks = splitText(text, 0);
  return finalChunks;
};

/**
 * Helper to turn raw text into structured DocumentChunk objects.
 */
export const createChunksFromDoc = (docId: string, content: string): DocumentChunk[] => {
  const rawChunks = recursiveCharacterSplit(content);
  return rawChunks.map((text, idx) => ({
    id: `${docId}-chunk-${idx}`,
    sourceId: docId,
    content: text.trim(),
    metadata: {
      startIndex: idx, // Simplified indexing for demo
      endIndex: idx + 1
    }
  }));
};