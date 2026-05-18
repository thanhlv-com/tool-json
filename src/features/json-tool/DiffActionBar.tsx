export function DiffActionBar() {
  return (
    <div className="flex items-center justify-between px-6 py-2 bg-[#1A1A1C] border-b border-[#262626]">
      <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Original Source</div>
      <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Modified Target</div>
    </div>
  );
}
