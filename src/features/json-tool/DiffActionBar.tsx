import type { JsonDiffReport } from './utils';

type DiffActionBarProps = {
  diffReport: JsonDiffReport | null;
  diffParseError: string | null;
};

export function DiffActionBar({ diffReport, diffParseError }: DiffActionBarProps) {
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
      <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Original Source</div>
      <div className={`text-[10px] font-mono tracking-wider ${statusClassName}`}>{statusText}</div>
      <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Modified Target</div>
    </div>
  );
}
