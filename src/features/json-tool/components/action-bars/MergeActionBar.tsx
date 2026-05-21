import { useRef } from 'react';
import { AlignLeft, CheckCircle2, Copy, Download, GitMerge, Share2, Upload, XCircle } from 'lucide-react';
import { HelpPopupButton } from '../workspaces/HelpPopupButton';
import type { ErrorStatus } from '../../types';
import { ModeGuideContent, getModeGuideTitle } from './modeGuideContent';

type MergeActionBarProps = {
  output: string;
  errorStatus: ErrorStatus;
  onMerge: () => void;
  onFormat: () => void;
  onShare: () => void;
  onCopy: (text: string) => void;
  onDownload: (content: string, filename: string) => void;
  onImportLeftFile: (file: File) => void;
  onImportRightFile: (file: File) => void;
};

export function MergeActionBar({
  output,
  errorStatus,
  onMerge,
  onFormat,
  onShare,
  onCopy,
  onDownload,
  onImportLeftFile,
  onImportRightFile,
}: MergeActionBarProps) {
  const leftInputRef = useRef<HTMLInputElement | null>(null);
  const rightInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between px-3 sm:px-6 py-2 bg-[#1A1A1C] border-b border-[#262626] gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onMerge}
          className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-blue-500 bg-blue-500/10 text-blue-400 transition-colors"
        >
          <GitMerge className="w-3.5 h-3.5" /> Merge
        </button>
        <button
          onClick={onFormat}
          className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <AlignLeft className="w-3.5 h-3.5" /> Format
        </button>

        <button
          onClick={() => leftInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Open Left
        </button>
        <button
          onClick={() => rightInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Open Right
        </button>

        <input
          ref={leftInputRef}
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportLeftFile(file);
            }
            event.target.value = '';
          }}
        />
        <input
          ref={rightInputRef}
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportRightFile(file);
            }
            event.target.value = '';
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {errorStatus && (
          <div
            className={`flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest min-w-0 ${
              errorStatus.isError ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {errorStatus.isError ? <XCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate max-w-[320px] sm:max-w-[360px]">{errorStatus.message}</span>
          </div>
        )}

        <div className="h-4 w-[1px] bg-[#333]"></div>
        <HelpPopupButton
          title={getModeGuideTitle('merge')}
          buttonLabel="View Guide"
          buttonClassName="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <ModeGuideContent mode="merge" />
        </HelpPopupButton>
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
        <button
          onClick={() => onCopy(output)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button
          onClick={() => onDownload(output, 'merged-result.json')}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Down
        </button>
      </div>
    </div>
  );
}
