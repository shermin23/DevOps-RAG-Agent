import { DocumentChunk } from '../types';

// Simulating RecursiveCharacterTextSplitter optimized for technical docs
export const recursiveCharacterSplit = (
  text: string,
  chunkSize: number = 500,
  chunkOverlap: number = 50
): string[] => {
  const separators = ["\n\n", "\n", " ", ""];
  let finalChunks: string[] = [];

  const splitText = (currentText: string, separatorIndex: number): string[] => {
    if (currentText.length <= chunkSize) {
      return [currentText];
    }

    if (separatorIndex >= separators.length) {
      // If we run out of separators, we must hard split
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

    let goodSplits: string[] = [];
    let currentChunk = "";

    for (const split of splits) {
      const potentialChunk = currentChunk.length > 0 
        ? currentChunk + separator + split 
        : split;

      if (potentialChunk.length < chunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          goodSplits.push(currentChunk);
        }
        currentChunk = split;
      }
    }
    if (currentChunk) {
      goodSplits.push(currentChunk);
    }

    // Recursively process chunks that are still too big
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

export const createChunksFromDoc = (docId: string, content: string): DocumentChunk[] => {
  const rawChunks = recursiveCharacterSplit(content);
  return rawChunks.map((text, idx) => ({
    id: `${docId}-chunk-${idx}`,
    sourceId: docId,
    content: text.trim(),
    metadata: {
      startIndex: idx, // Simplified
      endIndex: idx + 1
    }
  }));
};