import { GoogleGenAI } from "@google/genai";
import type { DocumentChunk } from "../types";

/**
 * Initialize the Google GenAI Client.
 * Handles environment variable detection for both standard Node.js (production/preview)
 * and Vite (local development) environments.
 */
const getAIClient = () => {
    // Support both Node.js process.env (for cloud/preview) and Vite import.meta.env (for local)
    // @ts-ignore - Handle potentially undefined process/import.meta in different envs
    const apiKey = (typeof process !== 'undefined' ? process.env.API_KEY : undefined) || 
                   (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_API_KEY : undefined);

    if (!apiKey) {
        throw new Error("API Key not found in environment. For local dev, set VITE_API_KEY in .env");
    }
    return new GoogleGenAI({ apiKey });
}

/**
 * Phase 2 - Step 5: Two-Stage Query Modification.
 * 
 * WHY THIS MATTERS:
 * Raw error logs contain noise (dates, IPs, stack trace hashes) that confuse retrieval systems.
 * We use an LLM first to "clean" the log into a semantic search query.
 * 
 * Example:
 * Input: "[2023-10-10 10:00:00] Error: Connection refused at 192.168.1.1 port 8080"
 * Output: "Connection refused port 8080"
 */
export const cleanLogToQuery = async (rawLog: string): Promise<string> => {
  const ai = getAIClient();
  const model = "gemini-2.5-flash"; // Flash is faster and cheaper for simple tasks

  const prompt = `
    You are a DevOps expert assistant. 
    Your task is to analyze the following RAW ERROR LOG and extract the core technical issue to form a concise search query.
    Remove timestamps, IP addresses, and generic noise.
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

/**
 * Phase 2 - Step 8: Final Generation.
 * 
 * This is the "Generation" part of RAG.
 * It takes the retrieved context and the query, then instructs the LLM
 * to answer based ONLY on that context.
 */
export const generateRAGSolution = async (
  query: string, 
  chunks: DocumentChunk[]
): Promise<string> => {
  const ai = getAIClient();
  const model = "gemini-2.5-flash"; // Capable model for reasoning

  // Format retrieved chunks into a context block for the LLM
  const contextText = chunks.map((c) => `[Source ID: ${c.sourceId}]: ${c.content}`).join("\n\n");

  // System Prompt: Defines role, constraints (Strict Grounding), and output format
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