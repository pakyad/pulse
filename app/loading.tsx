export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-white font-sans antialiased flex flex-col items-center justify-center gap-5">
      {/* Animated loading ring */}
      <div className="w-12 h-12 border-[3px] border-slate-100 border-t-[slate-900] rounded-full animate-spin" />
      <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-300">
        Loading
      </p>
    </main>
  );
}
