import { Share2 } from 'lucide-react';
import type { ErrorStatus } from '../../types';
import type { JsonDiffReport } from '../../utils';

type DiffActionBarProps = {
  diffReport: JsonDiffReport | null;
  diffParseError: string | null;
  errorStatus: ErrorStatus;
  onFormat: () => void;
  onShare: () => void;
};

export function DiffActionBar({ diffReport, diffParseError, errorStatus, onFormat, onShare }: DiffActionBarProps) {
  const statusText = errorStatus
    ? errorStatus.message
    : diffParseError
      ? diffParseError
      : diffReport
      ? diffReport.equal
        ? 'No differences detected'
        : `Ops: ${diffReport.operationCount} | +${diffReport.summary.added} -${diffReport.summary.removed} ~${diffReport.summary.changed}`
      : 'Provide valid JSON in both panes to analyze diff details';

  const statusClassName = errorStatus
    ? errorStatus.isError
      ? 'text-red-400'
      : 'text-emerald-400'
    : diffParseError
      ? 'text-red-400'
      : diffReport?.equal
      ? 'text-emerald-400'
      : 'text-[#808080]';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-6 py-2 bg-[#1A1A1C] border-b border-[#262626] gap-2">
      <div className="flex items-center gap-3">
        <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Original Source</div>
        <button
          onClick={onFormat}
          className="rounded border border-[#2E2E30] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A8A8AA] transition-colors hover:border-[#4A4A4D] hover:text-[#E0E0E0]"
        >
          Format
        </button>
        <button
          onClick={onShare}
          className="rounded border border-[#2E2E30] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#A8A8AA] transition-colors hover:border-[#4A4A4D] hover:text-[#E0E0E0]"
        >
          <span className="flex items-center gap-1">
            <Share2 className="h-3 w-3" />
            Share
          </span>
        </button>
      </div>
      <div className={`text-[10px] font-mono tracking-wider break-words ${statusClassName}`}>{statusText}</div>
      <div className="hidden sm:block text-[10px] font-mono text-[#606060] uppercase tracking-wider">Modified Target</div>
    </div>
  );
}
