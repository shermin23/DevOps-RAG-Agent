⚙️ DevOps Infrastructure Troubleshooting RAG Agent MVPTechnical Deep Dive: Intelligent Infrastructure AssistantThis project implements a production-ready Retrieval-Augmented Generation (RAG) system designed to serve as an intelligent assistant for DevOps and Platform Engineering teams. The primary goal is to provide immediate, verifiable, and grounded solutions to complex infrastructure errors (specifically focusing on Docker and Kubernetes logs) by referencing an internal knowledge base of technical documentation.The architecture solves two core RAG challenges: handling noisy input (raw error logs) and ensuring semantic accuracy during retrieval from dense technical texts.🌟 Core Features & ArchitectureThis MVP implementation adheres to a strict 10-point plan, focusing on modularity, performance, and grounding.1. Advanced Data Engineering & IndexingCustom Chunking Strategy: Implemented a RecursiveCharacterTextSplitter with specialized separators (\n\n, section headers) to preserve the semantic context of technical documentation (e.g., keeping code blocks near explanations).Local Vector Store: Utilizes ChromaDB (embedded) for low-latency indexing and retrieval of documentation vectors.Embedding Model Placeholder: Ready for integration with a high-quality embedding model.2. Two-Stage Retrieval PipelineStage 1: Query Modification: An initial LLM call (placeholder) cleans and simplifies messy, verbose raw error logs (the "noisy input") into a concise, high-quality search query for better vector retrieval.Stage 2: Retrieval & Context Aggregation: The modified query retrieves the top N relevant document chunks from the ChromaDB index.Grounded Generation: The final generation LLM is fed the user's original error log and the retrieved context chunks.3. Verification & DeploymentSenior DevOps Persona: A specialized System Prompt Template instructs the LLM to act as a Senior DevOps Engineer, providing clear diagnoses and actionable solutions.Mandatory Citation: The agent is required to cite the exact source document and chunk used to generate the answer, ensuring high trust and verifiability (anti-hallucination guardrail).Streamlit Interface: A simple, interactive UI built with Streamlit for demonstration, allowing users to paste logs and view the structured, cited output.Containerized Deployment: Includes a comprehensive Dockerfile and requirements.txt for easy, reproducible deployment in any environment.🛠️ Technology StackComponentTechnologyPurposeOrchestrationPython 3.10+ & LangChainCore RAG pipeline, chain execution, and modularity.Vector DBChromaDB (Embedded)Local storage and efficient semantic search of embeddings.UIStreamlitQuick, interactive web interface for demonstration.EnvironmentDockerContainerization for reproducible, portable deployment.LLM/EmbeddingsPlaceholder API CallsMarks integration points for the chosen Gemini models.🚀 Getting StartedTo run this application locally, you need Docker installed.1. Clone the Repositorygit clone <your-repo-link>
cd devops-rag-agent
2. Build and Run the Docker ContainerThe Dockerfile handles installing all dependencies from requirements.txt.# Build the container image
docker build -t devops-rag-agent:latest .

# Run the container, mapping port 8501 for Streamlit
docker run -p 8501:8501 devops-rag-agent:latest
3. Access the ApplicationOpen your web browser and navigate to:http://localhost:8501
🧪 Example Test CaseUse the following real-world log to test the agent's ability to diagnose memory issues:Input Log[2025-11-24 10:30:22 FATAL] Container my-api-pod-xyz terminated due to external signal. System reported memory usage spiked from 500MB to 1.2GB in the final seconds, hitting the configured 1GB limit. Received Exit Code 137. This needs immediate investigation from the platform team.
Expected Agent BehaviorQuery Modification: The agent extracts the core intent: "Container terminated Exit Code 137 memory limit exceeded."Retrieval: The agent retrieves documentation on "Docker Exit Codes" and "Kubernetes Resource Limits."Generation: The agent diagnoses the issue as an Out-of-Memory (OOMKilled) event, explains that Exit Code 137 is a SIGKILL signal from the OS, and recommends increasing the limits.memory in the deployment configuration.Grounding: The response clearly displays the citation to the source document.📁 Project StructureFileDescriptiondata_processor.pyHandles data loading, custom chunking, embedding, and indexing into ChromaDB (Steps 1-4).rag_core.pyContains the core RAG logic: query modification, retrieval execution, prompt templating, and final generation (Steps 5-8).streamlit_app.pyThe main user interface, handles input/output display, and orchestrates calls to rag_core (Step 9).requirements.txtLists all necessary Python dependencies (e.g., streamlit, langchain, chromadb).DockerfileDefines the container image for deployment (Step 10).

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tCAzjxIbZmmVZn-FhS08DJ3QGv9o0u_Y

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
