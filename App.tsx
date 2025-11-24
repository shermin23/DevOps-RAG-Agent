import React, { useState } from 'react';
import { Terminal, Play, AlertCircle } from 'lucide-react';
import DocManager from './components/DocManager';
import AnalysisDisplay from './components/AnalysisDisplay';
import { KnowledgeDoc, AnalysisStep, RAGResult } from './types';
import { cleanLogToQuery, generateRAGSolution } from './services/gemini';
import { retrieveRelevantChunks } from './utils/search';

const INITIAL_DOCS: KnowledgeDoc[] = []; // Start empty or add seed data if needed

const App: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(INITIAL_DOCS);
  const [rawLog, setRawLog] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [result, setResult] = useState<RAGResult | null>(null);
  
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { id: '1', label: 'Ingest Log', status: 'pending' },
    { id: '2', label: 'Refine Query', status: 'pending' },
    { id: '3', label: 'Vector Search', status: 'pending' },
    { id: '4', label: 'Generate', status: 'pending' },
  ]);

  const updateStep = (id: string, status: AnalysisStep['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleRunAnalysis = async () => {
    if (!rawLog.trim()) return;
    if (!process.env.API_KEY) {
        setErrorMsg("Missing API Key. Please ensure the environment variable is set.");
        return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);

    // Reset Steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

    try {
      // Step 1: Ingest
      updateStep('1', 'loading');
      await new Promise(r => setTimeout(r, 600)); // Visual delay
      updateStep('1', 'complete');

      // Step 2: Clean Query
      updateStep('2', 'loading');
      const searchQuery = await cleanLogToQuery(rawLog);
      updateStep('2', 'complete');

      // Step 3: Retrieval
      updateStep('3', 'loading');
      // Flatten all chunks from all docs
      const allChunks = docs.flatMap(d => d.chunks);
      const retrievedChunks = retrieveRelevantChunks(searchQuery, allChunks, 3);
      await new Promise(r => setTimeout(r, 600)); // Visual delay
      updateStep('3', 'complete');

      // Step 4: Generation
      updateStep('4', 'loading');
      const solution = await generateRAGSolution(searchQuery, retrievedChunks);
      updateStep('4', 'complete');

      setResult({
        originalLog: rawLog,
        searchQuery,
        retrievedChunks,
        solution,
        timestamp: new Date()
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      const currentStepIdx = steps.findIndex(s => s.status === 'loading');
      if (currentStepIdx !== -1) {
          updateStep(steps[currentStepIdx].id, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="p-2 bg-emerald-950/30 rounded border border-emerald-500/20">
            <Terminal size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">DevOps RAG Agent</h1>
        </div>
        <div className="ml-auto text-xs text-slate-500 flex gap-4">
           <span>Engine: Gemini 2.5 Flash</span>
           <span>Vector Store: In-Memory (Simulated)</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 max-h-[calc(100vh-4rem)]">
        
        {/* Left Col: Docs (3 cols) */}
        <div className="col-span-12 lg:col-span-3 h-[calc(100vh-7rem)]">
           <DocManager docs={docs} setDocs={setDocs} />
        </div>

        {/* Middle Col: Input (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 h-[calc(100vh-7rem)]">
           <div className="bg-slate-900 rounded-lg border border-slate-800 flex flex-col flex-1 p-4 shadow-sm">
              <label className="text-sm font-semibold text-slate-400 mb-2 block">
                Raw Error Log / Incident Report
              </label>
              <textarea 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-md p-4 font-mono text-sm text-slate-300 resize-none focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-700"
                placeholder="Paste your stack trace, error log, or incident description here..."
                value={rawLog}
                onChange={(e) => setRawLog(e.target.value)}
              />
              
              <div className="mt-4 flex flex-col gap-2">
                 {errorMsg && (
                    <div className="bg-red-950/30 border border-red-500/30 text-red-200 text-xs p-2 rounded flex items-center gap-2">
                        <AlertCircle size={14} />
                        {errorMsg}
                    </div>
                 )}
                 <button
                    onClick={handleRunAnalysis}
                    disabled={isProcessing || !rawLog}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-3 rounded-md transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 border border-transparent disabled:border-slate-800"
                 >
                    {isProcessing ? 'Analyzing...' : (
                        <>
                            <Play size={18} fill="currentColor" />
                            Start RAG Pipeline
                        </>
                    )}
                 </button>
              </div>
           </div>

           {/* Quick Tip */}
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
             <h4 className="text-blue-400 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                Architecture Note
             </h4>
             <p className="text-xs text-slate-400 leading-relaxed">
                This app runs entirely in the browser. Docs are chunked and embedded in memory. 
                The RAG process retrieves relevant chunks via keyword density and sends them to Gemini for context.
             </p>
           </div>
        </div>

        {/* Right Col: Output (5 cols) */}
        <div className="col-span-12 lg:col-span-5 h-[calc(100vh-7rem)]">
           <AnalysisDisplay steps={steps} result={result} />
        </div>

      </main>
    </div>
  );
};

export default App;