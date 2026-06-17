"use client";
import React, { useState, useRef } from "react";

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMessage(`Selected: ${e.target.files[0].name}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatusMessage(`Dropped: ${e.dataTransfer.files[0].name}`);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setStatusMessage("Uploading and slicing document locally...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ingest/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(
          `Success! Local parser split "${file.name}" into ${data.total_chunks} structured chunks.`
        );
        console.log("Structured Markdown Chunks:", data.chunks);
      } else {
        setStatusMessage(`Error: ${data.detail || "Processing failed"}`);
      }
    } catch (error) {
      setStatusMessage("Failed to reach FastAPI backend. Verify server is running.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl text-zinc-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Study Material Ingestion</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Upload PDFs, Word docs, or Text sheets to build your local knowledge index.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-white bg-zinc-800/50"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.docx,.xlsx,.pptx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <span className="text-3xl">📁</span>
            <p className="text-sm font-medium text-zinc-200">
              Drag & drop your study file here, or <span className="text-white underline">browse</span>
            </p>
            <p className="text-xs text-zinc-500">Supports PDF, DOCX, XLSX, PPTX, TXT</p>
          </div>
        </div>

        {file && (
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400 truncate max-w-[80%] font-mono">{file.name}</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-white text-black font-semibold py-2.5 px-4 rounded-lg hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all duration-200 shadow-sm text-sm"
        >
          {uploading ? "Slicing Text..." : "Process Document"}
        </button>
      </form>

      {statusMessage && (
        <div className="mt-6 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
          <p className="text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {statusMessage}
          </p>
        </div>
      )}
    </div>
  );
}