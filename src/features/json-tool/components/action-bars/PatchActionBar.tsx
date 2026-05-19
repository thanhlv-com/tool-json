import { useRef } from 'react';
import { CheckCircle2, Copy, Download, GitCompareArrows, Upload, Wand2, XCircle } from 'lucide-react';
import type { ErrorStatus } from '../../types';

type PatchActionBarProps = {
  output: string;
  errorStatus: ErrorStatus;
  onGeneratePatch: () => void;
  onApplyPatch: () => void;
  onCopy: (text: string) => void;
  onDownload: (content: string, filename: string) => void;
  onImportBaseFile: (file: File) => void;
  onImportTargetFile: (file: File) => void;
  onImportPatchFile: (file: File) => void;
};

export function PatchActionBar({
  output,
  errorStatus,
  onGeneratePatch,
  onApplyPatch,
  onCopy,
  onDownload,
  onImportBaseFile,
  onImportTargetFile,
  onImportPatchFile,
}: PatchActionBarProps) {
  const baseInputRef = useRef<HTMLInputElement | null>(null);
  const targetInputRef = useRef<HTMLInputElement | null>(null);
  const patchInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between px-3 sm:px-6 py-2 bg-[#1A1A1C] border-b border-[#262626] gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onGeneratePatch}
          className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-blue-500 bg-blue-500/10 text-blue-400 transition-colors"
        >
          <GitCompareArrows className="w-3.5 h-3.5" /> Generate Patch
        </button>
        <button
          onClick={onApplyPatch}
          className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" /> Apply Patch
        </button>

        <button
          onClick={() => baseInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Open Base
        </button>
        <button
          onClick={() => targetInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Open Target
        </button>
        <button
          onClick={() => patchInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Open Patch
        </button>

        <input
          ref={baseInputRef}
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportBaseFile(file);
            }
            event.target.value = '';
          }}
        />
        <input
          ref={targetInputRef}
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportTargetFile(file);
            }
            event.target.value = '';
          }}
        />
        <input
          ref={patchInputRef}
          type="file"
          accept=".json,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportPatchFile(file);
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
        <button
          onClick={() => onCopy(output)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button
          onClick={() => onDownload(output, 'patch-result.json')}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Down
        </button>
      </div>
    </div>
  );
}
