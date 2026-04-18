export const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pk-bg-primary transition-opacity duration-500">
      <div className="flex flex-col items-center">
        {/* Pulsing logo icon */}
        <div className="animate-pulse shadow-[0_0_15px_rgba(30,144,255,0.4)] rounded-xl overflow-hidden bg-white/5 p-2">
          <img src="/logo.png" alt="Popular Kitchen Logo" className="w-16 h-16 object-contain" onError={(e) => e.target.style.display='none'} />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-pk-text-main tracking-widest uppercase">Popular Kitchen</h1>
        <p className="mt-2 text-xs text-pk-text-muted">Loading your experience...</p>
      </div>
    </div>
  );
};
