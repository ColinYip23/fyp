export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/50 bg-white/40 px-8 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-black/40">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <h1 className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-2xl font-black tracking-tight text-transparent">
          MaterialAIze
        </h1>
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">MCS 18 FYP</div>
      </div>
    </header>
  );
}
