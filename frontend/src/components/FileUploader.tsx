'use client';

import React, { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react';

interface UploadResponse {
  chunks?: number;
  logs?: string[];
  message?: string;
  error?: string;
}

export default function FileUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/health');
        setBackendOnline(res.ok);
      } catch (e) {
        setBackendOnline(false);
      }
    };
    checkHealth();
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setStatus(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      // Using localhost instead of 127.0.0.1 for better Windows compatibility
      const response = await fetch('http://localhost:8000/api/ingest/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // Fallback to statusText if JSON parsing fails
        }
        throw new Error(`Upload failed: ${errorMessage}`);
      }

      const data: UploadResponse = await response.json();
      setStatus(data);
      setFiles([]); // Clear files on success
    } catch (error: any) {
      console.error('Upload Error:', error);
      setStatus({ error: error.message || 'An unexpected error occurred' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <header className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-light tracking-tight text-zinc-100 mb-2">
                Document Ingestion Vault
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                SYS_INIT: layout_parsing_active // v2.0.5
              </p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <span className={`h-1.5 w-1.5 rounded-full ${backendOnline === true ? 'bg-emerald-500 animate-pulse' : backendOnline === false ? 'bg-red-500' : 'bg-zinc-600'}`}></span>
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-tighter">
                  Backend: {backendOnline === true ? 'Online' : backendOnline === false ? 'Offline' : 'Checking...'}
                </span>
              </div>
              {backendOnline === false && (
                <span className="text-[8px] text-red-400/60 font-mono mt-1 uppercase">Run: python main.py</span>
              )}
            </div>
          </header>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative group cursor-pointer transition-all duration-500 ease-out
              border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center
              ${isDragging 
                ? 'border-indigo-500 bg-zinc-800/40 scale-[1.02] shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            
            <div className={`
              w-12 h-12 mb-4 rounded-lg flex items-center justify-center transition-colors duration-300
              ${isDragging ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'}
            `}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            
            <span className="text-zinc-300 font-medium">Drop files to ingest</span>
            <span className="text-zinc-500 text-sm mt-1">or click to browse local storage</span>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/30 border border-zinc-800/50 rounded-lg group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <svg className="shrink-0 text-zinc-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14.5 2 14.5 7.5 20 7.5"/></svg>
                    <span className="text-sm text-zinc-300 truncate">{file.name}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{(file.size / 1024).toFixed(1)}KB</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={uploadFiles}
              disabled={files.length === 0 || isUploading || backendOnline === false}
              className={`
                w-full py-4 rounded-full font-bold text-white tracking-wide transition-all duration-300
                ${files.length > 0 && !isUploading && backendOnline !== false
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] active:scale-[0.98]'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}
              `}
            >
              {isUploading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Infiltrating Backend...</span>
                </span>
              ) : backendOnline === false ? "Backend Offline" : "Upload Files"}
            </button>
          </div>

          {(status || isUploading) && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <div className="bg-black/40 rounded-xl p-4 border border-zinc-800/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Transmission Status</span>
                  {isUploading && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>}
                </div>
                <div className="font-mono text-xs space-y-1 text-zinc-400">
                  {isUploading && <p className="text-indigo-400"> {'>'} Establishing secure link...</p>}
                  {status?.error && (
                    <div className="space-y-1">
                      <p className="text-red-400"> {'>'} ERROR: {status.error}</p>
                      {status.error.includes('fetch') && (
                        <p className="text-[10px] text-zinc-500 italic ml-4">Tip: Ensure the FastAPI server is running on port 8000 and check for CORS block in browser console.</p>
                      )}
                    </div>
                  )}
                  {status?.message && <p className="text-emerald-400"> {'>'} SUCCESS: {status.message}</p>}
                  {status?.chunks !== undefined && <p className="text-zinc-300"> {'>'} TOTAL_CHUNKS: {status.chunks}</p>}
                  {status?.logs?.map((log, i) => (
                    <p key={i} className="text-zinc-500 opacity-80"> {'>'} {log}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
