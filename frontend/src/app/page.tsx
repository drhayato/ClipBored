import FileUploader from "../components/FileUploader";

export default function Home() {
  return (
    <main className="bg-black text-white min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* BACKGROUND ANIMATION PANELS (MESH GRADIENTS) */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {/* Top-Left: Indigo to Purple */}
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-600 to-purple-800 opacity-40 mix-blend-screen blur-[130px] animate-pulse" 
          style={{ animationDuration: '8s' }}
        ></div>
        
        {/* Bottom-Right: Pink to Rose */}
        <div 
          className="absolute bottom-[-15%] right-[-5%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-pink-600 to-rose-900 opacity-40 mix-blend-screen blur-[130px] animate-pulse" 
          style={{ animationDuration: '11s' }}
        ></div>
        
        {/* Center-Right: Cyan to Emerald Accent */}
        <div 
          className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-l from-cyan-500 to-emerald-600 opacity-30 mix-blend-screen blur-[130px] animate-pulse" 
          style={{ animationDuration: '6s' }}
        ></div>
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        <header className="text-center mb-12 space-y-4">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter bg-gradient-to-b from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent select-none">
            ClipBored
          </h1>
          <div className="flex items-center justify-center space-x-3">
            <div className="h-[1px] w-8 bg-zinc-800"></div>
            <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.3em] text-zinc-400">
              Workspace Ingestion Dashboard
            </p>
            <div className="h-[1px] w-8 bg-zinc-800"></div>
          </div>
        </header>

        {/* INGESTION VAULT MOUNT POINT */}
        <div className="w-full flex justify-center">
          <FileUploader />
        </div>
        
        <footer className="mt-16 opacity-20 hover:opacity-50 transition-opacity duration-700">
          <p className="font-mono text-[10px] tracking-widest uppercase">
            Encrypted Session // Protocol v4.0.9
          </p>
        </footer>
      </div>

      {/* NOISE OVERLAY FOR TEXTURE */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </main>
  );
}
