# ⚙️ DevOps Infrastructure Troubleshooting RAG Agent MVP

## Technical Deep Dive: Intelligent Infrastructure Assistant

This project implements a production-ready **Retrieval-Augmented Generation (RAG) system** designed to serve as an intelligent assistant for DevOps and Platform Engineering teams. The primary goal is to provide immediate, verifiable, and grounded solutions to complex infrastructure errors (specifically focusing on Docker and Kubernetes logs) by referencing an internal knowledge base of technical documentation.

The architecture solves two core RAG challenges: handling **noisy input** (raw error logs) and ensuring **semantic accuracy** during retrieval from dense technical texts.

## 🌟 Core Features & Architecture

This MVP implementation adheres to a strict 10-point plan, focusing on modularity, performance, and grounding.

### 1\. Advanced Data Engineering & Indexing

  * **Custom Chunking Strategy:** Implemented a `RecursiveCharacterTextSplitter` with specialized separators (`\n\n`, section headers) to preserve the semantic context of technical documentation (e.g., keeping code blocks near explanations).
  * **Local Vector Store:** Utilizes **ChromaDB** (embedded) for low-latency indexing and retrieval of documentation vectors.
  * **Embedding Model Placeholder:** Ready for integration with a high-quality embedding model.

### 2\. Two-Stage Retrieval Pipeline

  * **Stage 1: Query Modification:** An initial LLM call (placeholder) cleans and simplifies messy, verbose raw error logs (the "noisy input") into a concise, high-quality search query for better vector retrieval.
  * **Stage 2: Retrieval & Context Aggregation:** The modified query retrieves the top N relevant document chunks from the ChromaDB index.
  * **Grounded Generation:** The final generation LLM is fed the user's *original* error log and the retrieved context chunks.

### 3\. Verification & Deployment

  * **Senior DevOps Persona:** A specialized **System Prompt Template** instructs the LLM to act as a Senior DevOps Engineer, providing clear diagnoses and actionable solutions.
  * **Mandatory Citation:** The agent is required to **cite the exact source document and chunk** used to generate the answer, ensuring high trust and verifiability (anti-hallucination guardrail).
  * **Streamlit Interface:** A simple, interactive UI built with Streamlit for demonstration, allowing users to paste logs and view the structured, cited output.
  * **Containerized Deployment:** Includes a comprehensive `Dockerfile` and `requirements.txt` for easy, reproducible deployment in any environment.

## 🛠️ Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Orchestration** | Python 3.10+ & LangChain | Core RAG pipeline, chain execution, and modularity. |
| **Vector DB** | ChromaDB (Embedded) | Local storage and efficient semantic search of embeddings. |
| **UI** | Streamlit | Quick, interactive web interface for demonstration. |
| **Environment** | Docker | Containerization for reproducible, portable deployment. |
| **LLM/Embeddings** | *Placeholder API Calls* | Marks integration points for the chosen Gemini models. |

## 🚀 Getting Started

To run this application locally, you need Docker installed.

### 1\. Clone the Repository

```bash
git clone <your-repo-link>
cd devops-rag-agent
````

### 2\. Build and Run the Docker Container

The `Dockerfile` handles installing all dependencies from `requirements.txt`.

```bash
# Build the container image
docker build -t devops-rag-agent:latest .

# Run the container, mapping port 8501 for Streamlit
docker run -p 8501:8501 devops-rag-agent:latest
```

### 3\. Access the Application

Open your web browser and navigate to:

```
http://localhost:8501
```

## 🧪 Example Test Case

Use the following real-world log to test the agent's ability to diagnose memory issues:

### Input Log

```log
[2025-11-24 10:30:22 FATAL] Container my-api-pod-xyz terminated due to external signal. System reported memory usage spiked from 500MB to 1.2GB in the final seconds, hitting the configured 1GB limit. Received Exit Code 137. This needs immediate investigation from the platform team.
```

### Expected Agent Behavior

1.  **Query Modification:** The agent extracts the core intent: "Container terminated Exit Code 137 memory limit exceeded."
2.  **Retrieval:** The agent retrieves documentation on "Docker Exit Codes" and "Kubernetes Resource Limits."
3.  **Generation:** The agent diagnoses the issue as an **Out-of-Memory (OOMKilled)** event, explains that `Exit Code 137` is a `SIGKILL` signal from the OS, and recommends increasing the `limits.memory` in the deployment configuration.
4.  **Grounding:** The response clearly displays the citation to the source document.

## 📁 Project Structure

| File | Description |
| :--- | :--- |
| `data_processor.py` | Handles data loading, custom chunking, embedding, and indexing into ChromaDB (Steps 1-4). |
| `rag_core.py` | Contains the core RAG logic: query modification, retrieval execution, prompt templating, and final generation (Steps 5-8). |
| `streamlit_app.py` | The main user interface, handles input/output display, and orchestrates calls to `rag_core` (Step 9). |
| `requirements.txt` | Lists all necessary Python dependencies (e.g., `streamlit`, `langchain`, `chromadb`). |
| `Dockerfile` | Defines the container image for deployment (Step 10). |
