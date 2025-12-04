import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { RAGResult, AnalysisStep } from '../types';
import { CheckCircle2, Circle, Loader2, Search, BookOpen, AlertTriangle } from 'lucide-react';

interface AnalysisDisplayProps {
  steps: AnalysisStep[];
  result: RAGResult | null;
}

/**
 * Visualizes the output of the RAG pipeline.
 * Displays progress steps (Ingest -> Query -> Search -> Gen)
 * and renders the final markdown solution with citations.
 */
const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ steps, result }) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 
        Pipeline Steps Visualization 
        Shows a stepper UI to indicate what part of the RAG process is happening.
      */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Pipeline Execution</h3>
        <div className="flex items-center justify-between relative">
          {/* Progress Bar Background Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10" />
          
          {steps.map((step, _idx) => (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-900 px-2 z-10">
              {/* Step Icon Indicator */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500
                ${step.status === 'complete' ? 'bg-emerald-950 border-emerald-500 text-emerald-500' : 
                  step.status === 'loading' ? 'bg-blue-950 border-blue-500 text-blue-500' : 
                  step.status === 'error' ? 'bg-red-950 border-red-500 text-red-500' :
                  'bg-slate-900 border-slate-700 text-slate-700'
                }`}>
                {step.status === 'complete' ? <CheckCircle2 size={16} /> :
                 step.status === 'loading' ? <Loader2 size={16} className="animate-spin" /> :
                 step.status === 'error' ? <AlertTriangle size={16} /> :
                 <Circle size={16} />}
              </div>
              {/* Step Label */}
              <span className={`text-[10px] uppercase font-bold tracking-tight ${
                 step.status === 'complete' ? 'text-emerald-500' : 
                 step.status === 'loading' ? 'text-blue-500' : 
                 'text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Result Area */}
      {result ? (
        <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-sm">
          {/* Section: Refined Query Display */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/30">
             <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <Search size={12} />
                <span>Generated Query</span>
             </div>
             <div className="font-mono text-emerald-400 text-sm bg-slate-950 px-3 py-2 rounded border border-slate-800/50">
               {result.searchQuery}
             </div>
          </div>

          {/* Section: Solution & Citations */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* Markdown Rendered Solution */}
            <div className="prose prose-invert prose-sm prose-emerald max-w-none">
                <h3 className="text-white flex items-center gap-2 font-semibold">
                    Solution
                </h3>
                <ReactMarkdown>{result.solution}</ReactMarkdown>
            </div>

            {/* Citations / Context Used */}
            <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen size={14} />
                    Retrieved Context
                </h4>
                <div className="space-y-3">
                    {result.retrievedChunks.length > 0 ? (
                        result.retrievedChunks.map((chunk, i) => (
                            <div key={i} className="bg-slate-950/50 border border-slate-800 rounded p-3 text-xs hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-mono text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded text-[10px] border border-emerald-900/50">
                                        {chunk.sourceId}
                                    </span>
                                    <span className="text-slate-600 text-[10px] uppercase font-semibold">Match Score: High</span>
                                </div>
                                <p className="text-slate-400 font-mono line-clamp-2 leading-relaxed">
                                    "{chunk.content}"
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-600 text-sm italic">No relevant documents found in knowledge base. Solution generated based on LLM general knowledge.</p>
                    )}
                </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Placeholder */
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-slate-900 rounded-lg border border-slate-800 border-dashed">
            <div className="bg-slate-800/50 p-4 rounded-full mb-4 ring-1 ring-slate-700/50">
                <Search size={32} className="text-slate-700" />
            </div>
            <p className="font-medium">Ready to analyze.</p>
            <p className="text-sm opacity-70">Paste a log on the left to begin.</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;