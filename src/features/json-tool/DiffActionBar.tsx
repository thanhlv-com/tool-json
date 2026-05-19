import type { JsonDiffReport } from './utils';

type DiffActionBarProps = {
  diffReport: JsonDiffReport | null;
  diffParseError: string | null;
  onFormat: () => void;
};

export function DiffActionBar({ diffReport, diffParseError, onFormat }: DiffActionBarProps) {
  const statusText = diffParseError
    ? diffParseError
    : diffReport
      ? diffReport.equal
        ? 'No differences detected'
        : `Ops: ${diffReport.operationCount} | +${diffReport.summary.added} -${diffReport.summary.removed} ~${diffReport.summary.changed}`
      : 'Provide valid JSON in both panes to analyze diff details';

  const statusClassName = diffParseError
    ? 'text-red-400'
    : diffReport?.equal
      ? 'text-emerald-400'
      : 'text-[#808080]';

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-[#1A1A1C] border-b border-[#262626]">
      <div className="flex items-center gap-3">
        <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Original Source</div>
        <button
          onClick={onFormat}
          className="rounded border border-[#2E2E30] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A8A8AA] transition-colors hover:border-[#4A4A4D] hover:text-[#E0E0E0]"
        >
          Format
        </button>
      </div>
      <div className={`text-[10px] font-mono tracking-wider ${statusClassName}`}>{statusText}</div>
      <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Modified Target</div>
    </div>
  );
}
