import { GoogleGenAI } from "@google/genai";
import { DocumentChunk } from "../types";

const getAIClient = () => {
    // Note: In a real production app, never expose keys on client.
    // This is for the requested demo architecture running in browser.
    if (!process.env.API_KEY) {
        throw new Error("API Key not found in environment");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

/**
 * Phase 2 - Step 5: Two-Stage Query Modification
 * Uses LLM to clean messy logs into a search query.
 */
export const cleanLogToQuery = async (rawLog: string): Promise<string> => {
  const ai = getAIClient();
  const model = "gemini-2.5-flash"; // Fast model for tool use

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
 * Phase 2 - Step 8: Final Generation
 * Uses the retrieved context to solve the problem.
 */
export const generateRAGSolution = async (
  query: string, 
  chunks: DocumentChunk[]
): Promise<string> => {
  const ai = getAIClient();
  const model = "gemini-2.5-flash"; // Capable model for reasoning

  // Context preparation
  const contextText = chunks.map((c, i) => `[Source ID: ${c.sourceId}]: ${c.content}`).join("\n\n");

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