import FileUploader from "../components/FileUploader";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white selection:bg-white selection:text-black">
      <div className="flex flex-col items-center space-y-8 w-full max-w-4xl px-4">
        {/* Status Pill */}
        <div className="flex items-center space-x-2 rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs font-medium text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Frontend Engine Active</span>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tighter sm:text-7xl bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            ClipBored
          </h1>
          <p className="text-zinc-500 font-mono text-sm tracking-tight">AI Study Assistant // Ingest Module</p>
        </div>

        {/* Uploader Section */}
        <div className="w-full">
          <FileUploader />
        </div>
      </div>
    </main>
  );
}
