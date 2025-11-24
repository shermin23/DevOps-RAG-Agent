import React, { useState } from 'react';
import { KnowledgeDoc, DocumentChunk } from '../types';
import { createChunksFromDoc } from '../utils/textProcessor';
import { Plus, FileText, Trash2, Database } from 'lucide-react';

interface DocManagerProps {
  docs: KnowledgeDoc[];
  setDocs: React.Dispatch<React.SetStateAction<KnowledgeDoc[]>>;
}

const DocManager: React.FC<DocManagerProps> = ({ docs, setDocs }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleAddDoc = () => {
    if (!newTitle || !newContent) return;

    const docId = `doc-${Date.now()}`;
    const chunks = createChunksFromDoc(docId, newContent);

    const newDoc: KnowledgeDoc = {
      id: docId,
      title: newTitle,
      content: newContent,
      chunks,
      uploadDate: new Date(),
    };

    setDocs(prev => [...prev, newDoc]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const deleteDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 h-full flex flex-col shadow-sm">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/30 rounded-t-lg">
        <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
          <Database size={18} />
          Knowledge Base
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isAdding && (
          <div className="bg-slate-800/50 p-3 rounded-md border border-slate-700/50 mb-4 animate-in fade-in slide-in-from-top-2">
            <input
              type="text"
              placeholder="Doc Title (e.g., 'K8s Deployment Guide')"
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 mb-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <textarea
              placeholder="Paste documentation content here..."
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 mb-2 text-sm text-white font-mono h-32 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddDoc}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 rounded font-medium transition-colors"
              >
                Ingest & Index
              </button>
            </div>
          </div>
        )}

        {docs.length === 0 && !isAdding && (
          <div className="text-center text-slate-600 py-10">
            <p className="text-sm">No documents indexed.</p>
            <p className="text-xs mt-1">Add text to build your RAG context.</p>
          </div>
        )}

        {docs.map(doc => (
          <div key={doc.id} className="group bg-slate-800/40 border border-slate-700/50 rounded-md p-3 hover:bg-slate-800 hover:border-slate-600 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-slate-900 rounded text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <FileText size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{doc.title}</h3>
                  <p className="text-xs text-slate-500">
                    {doc.chunks.length} chunks • {doc.content.length} chars
                  </p>
                </div>
              </div>
              <button 
                onClick={() => deleteDoc(doc.id)}
                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-slate-950/30 border-t border-slate-800 text-center rounded-b-lg">
        <p className="text-xs text-slate-500 font-mono">
          Total Chunks: {docs.reduce((acc, doc) => acc + doc.chunks.length, 0)}
        </p>
      </div>
    </div>
  );
};

export default DocManager;