export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white selection:bg-white selection:text-black">
      <div className="flex flex-col items-center space-y-8">
        {/* Status Pill */}
        <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-black px-3 py-1 text-xs font-medium text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>Frontend Engine Active</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold tracking-tighter sm:text-7xl">
          ClipBored Workspace
        </h1>

        {/* Placeholder Container for Handshake */}
        <div className="mt-12 flex w-full max-w-md flex-col items-center rounded-xl border border-slate-800 bg-zinc-950/50 p-8 text-center backdrop-blur-sm">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Handshake Module
          </p>
          <div className="mt-4 flex h-24 w-full items-center justify-center rounded-lg border border-dashed border-slate-700 text-slate-600">
            <span className="text-xs italic">Waiting for FastAPI Handshake...</span>
          </div>
        </div>
      </div>
    </main>
  );
}
