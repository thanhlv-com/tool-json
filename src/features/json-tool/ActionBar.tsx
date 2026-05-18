import {
  AlignLeft,
  CheckCircle2,
  Copy,
  Download,
  Minimize2,
  XCircle,
} from 'lucide-react';
import type { ConvertSourceFormat, ErrorStatus, Mode, OutputLanguage } from './types';

type ActionBarProps = {
  mode: Exclude<Mode, 'diff'>;
  convertSourceFormat: ConvertSourceFormat;
  errorStatus: ErrorStatus;
  jsonPath: string;
  output: string;
  outputLanguage: OutputLanguage;
  onJsonPathChange: (value: string) => void;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onCopy: (text: string) => void;
  onDownload: (content: string, filename: string) => void;
};

export function ActionBar({
  mode,
  convertSourceFormat,
  errorStatus,
  jsonPath,
  output,
  outputLanguage,
  onJsonPathChange,
  onFormat,
  onMinify,
  onValidate,
  onCopy,
  onDownload,
}: ActionBarProps) {
  const hideFormatMinify = mode === 'query' || (mode === 'convert' && convertSourceFormat === 'json');

  return (
    <div className="flex items-center justify-between px-6 py-2 bg-[#1A1A1C] border-b border-[#262626]">
      <div className="flex gap-2">
        {!hideFormatMinify && (
          <button
            onClick={onFormat}
            className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" /> Format
          </button>
        )}
        {!hideFormatMinify && (
          <button
            onClick={onMinify}
            className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" /> Minify
          </button>
        )}
        <button
          onClick={onValidate}
          className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-blue-500 bg-blue-500/10 text-blue-400 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Validate
        </button>
      </div>

      <div className="flex items-center gap-4">
        {errorStatus && (
          <div
            className={`flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest ${
              errorStatus.isError ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {errorStatus.isError ? <XCircle className="w-3.5 h-3.5 shrink-0" /> : <span className="text-green-500">●</span>}
            <span className="truncate">{errorStatus.message}</span>
          </div>
        )}

        {mode === 'query' && (
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-[#262626] rounded text-[10px] font-bold text-blue-400 border border-[#333]">JSONPath</div>
            <input
              type="text"
              value={jsonPath}
              onChange={(event) => onJsonPathChange(event.target.value)}
              className="bg-[#121214] border border-[#333] text-xs text-[#A0A0A0] outline-none rounded px-3 py-1 w-64 font-mono focus:border-blue-500 transition-colors hover:border-[#555]"
              placeholder="$.features"
            />
          </div>
        )}

        <div className="h-4 w-[1px] bg-[#333] hidden sm:block"></div>
        <button
          onClick={() => onCopy(output)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button
          onClick={() => onDownload(output, mode === 'convert' && outputLanguage === 'yaml' ? 'result.yaml' : 'result.json')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Down
        </button>
      </div>
    </div>
  );
}
