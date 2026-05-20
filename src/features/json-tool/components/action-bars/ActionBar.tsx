import { useRef } from 'react';
import {
  AlignLeft,
  CheckCircle2,
  Copy,
  Download,
  Minimize2,
  Share2,
  Upload,
  XCircle,
} from 'lucide-react';
import type {
  ConvertSourceFormat,
  ConvertTargetFormat,
  CsvOptions,
  ErrorStatus,
  Mode,
  OutputLanguage,
  SchemaDraft,
} from '../../types';

type ActionBarProps = {
  mode: Exclude<Mode, 'diff' | 'patch' | 'merge'>;
  convertSourceFormat: ConvertSourceFormat;
  convertTargetFormat: ConvertTargetFormat;
  errorStatus: ErrorStatus;
  jsonPath: string;
  output: string;
  outputLanguage: OutputLanguage;
  csvOptions: CsvOptions;
  schemaDraft: SchemaDraft;
  schemaCustomKeywordsInput: string;
  privacyPreviewMaskedOnly: boolean;
  onJsonPathChange: (value: string) => void;
  onConvertTargetFormatChange: (value: ConvertTargetFormat) => void;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onShare: () => void;
  onCopy: (text: string) => void;
  onDownload: (content: string, filename: string) => void;
  onImportInputFile: (file: File) => void;
  onCsvDelimiterChange: (value: CsvOptions['delimiter']) => void;
  onCsvHeaderRowChange: (value: boolean) => void;
  onCsvQuoteStrategyChange: (value: CsvOptions['quoteStrategy']) => void;
  onCsvEscapeStrategyChange: (value: CsvOptions['escapeStrategy']) => void;
  onSchemaDraftChange: (value: SchemaDraft) => void;
  onSchemaCustomKeywordsInputChange: (value: string) => void;
  onPrivacyPreviewMaskedOnlyChange: (value: boolean) => void;
};

function getInputAccept(mode: Exclude<Mode, 'diff' | 'patch' | 'merge'>): string {
  if (mode === 'convertCsv') return '.json,.csv,.tsv,.txt';
  if (mode === 'convert') return '.json';
  if (mode === 'pipeline' || mode === 'privacy') return '.json';
  if (mode === 'tree') return '.json';
  if (mode === 'escape') return '.txt,.json';
  return '.json,.txt';
}

export function ActionBar({
  mode,
  convertSourceFormat,
  convertTargetFormat,
  errorStatus,
  jsonPath,
  output,
  outputLanguage,
  csvOptions,
  schemaDraft,
  schemaCustomKeywordsInput,
  privacyPreviewMaskedOnly,
  onJsonPathChange,
  onConvertTargetFormatChange,
  onFormat,
  onMinify,
  onValidate,
  onShare,
  onCopy,
  onDownload,
  onImportInputFile,
  onCsvDelimiterChange,
  onCsvHeaderRowChange,
  onCsvQuoteStrategyChange,
  onCsvEscapeStrategyChange,
  onSchemaDraftChange,
  onSchemaCustomKeywordsInputChange,
  onPrivacyPreviewMaskedOnlyChange,
}: ActionBarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hideFormat =
    mode === 'query' ||
    mode === 'schemaGenerate' ||
    mode === 'schemaValidate' ||
    mode === 'convertCsv' ||
    mode === 'escape' ||
    mode === 'pipeline' ||
    mode === 'privacy';
  const hideMinify = hideFormat || mode === 'tree';

  const actionLabel =
    mode === 'schemaGenerate'
      ? 'Generate'
      : mode === 'schemaValidate'
        ? 'Validate Schema'
        : mode === 'pipeline'
          ? 'Run Pipeline'
          : mode === 'privacy'
            ? 'Mask Data'
        : mode === 'convertCsv'
          ? 'Convert'
          : mode === 'escape'
            ? 'Escape/Unescape'
            : 'Validate';
  const downloadFilename =
    mode === 'convert'
      ? convertTargetFormat === 'yaml'
        ? 'result.yaml'
        : convertTargetFormat === 'xml'
          ? 'result.xml'
          : 'result.properties'
      : mode === 'convertCsv' && outputLanguage === 'plaintext'
        ? csvOptions.delimiter === '\t'
          ? 'result.tsv'
          : 'result.csv'
        : mode === 'pipeline'
          ? outputLanguage === 'yaml'
            ? 'pipeline-result.yaml'
            : outputLanguage === 'xml'
              ? 'pipeline-result.xml'
              : outputLanguage === 'plaintext'
                ? 'pipeline-result.txt'
                : 'pipeline-result.json'
          : mode === 'privacy'
            ? 'masked-result.json'
        : mode === 'escape' && outputLanguage === 'plaintext'
          ? 'result.txt'
          : 'result.json';

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between px-3 sm:px-6 py-2 bg-[#1A1A1C] border-b border-[#262626] gap-2">
      <div className="flex flex-wrap gap-2">
        {!hideFormat && (
          <button
            onClick={onFormat}
            className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" /> Format
          </button>
        )}
        {!hideMinify && (
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
          <CheckCircle2 className="w-3.5 h-3.5" /> {actionLabel}
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Open
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={getInputAccept(mode)}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImportInputFile(file);
            }
            event.target.value = '';
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {mode === 'query' && (
          <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
            <div className="px-2 py-1 bg-[#262626] rounded text-[10px] font-bold text-blue-400 border border-[#333]">JSONPath</div>
            <input
              type="text"
              value={jsonPath}
              onChange={(event) => onJsonPathChange(event.target.value)}
              className="bg-[#121214] border border-[#333] text-xs text-[#A0A0A0] outline-none rounded px-3 py-1 w-full sm:w-64 font-mono focus:border-blue-500 transition-colors hover:border-[#555]"
              placeholder="$.features"
            />
          </div>
        )}

        {mode === 'convert' && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A0A0A0] shrink-0">
            <span className="text-[#808080]">Target</span>
            <select
              value={convertTargetFormat}
              onChange={(event) => onConvertTargetFormatChange(event.target.value as ConvertTargetFormat)}
              className="bg-[#121214] border border-[#333] rounded px-2 py-1 focus:border-blue-500 outline-none"
            >
              <option value="yaml">YAML</option>
              <option value="xml">XML</option>
              <option value="properties">Properties</option>
            </select>
            {convertSourceFormat && <span className="text-[#6F7780]">from {convertSourceFormat.toUpperCase()}</span>}
          </div>
        )}

        {mode === 'convertCsv' && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A0A0A0]">
            <label className="flex items-center gap-1.5">
              <span className="text-[#808080]">Delimiter</span>
              <select
                value={csvOptions.delimiter}
                onChange={(event) => onCsvDelimiterChange(event.target.value as CsvOptions['delimiter'])}
                className="bg-[#121214] border border-[#333] rounded px-2 py-1 focus:border-blue-500 outline-none"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab (TSV)</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={csvOptions.hasHeaderRow}
                onChange={(event) => onCsvHeaderRowChange(event.target.checked)}
                className="h-3.5 w-3.5 accent-blue-500"
              />
              Header
            </label>

            <label className="flex items-center gap-1.5">
              <span className="text-[#808080]">Quote</span>
              <select
                value={csvOptions.quoteStrategy}
                onChange={(event) => onCsvQuoteStrategyChange(event.target.value as CsvOptions['quoteStrategy'])}
                className="bg-[#121214] border border-[#333] rounded px-2 py-1 focus:border-blue-500 outline-none"
              >
                <option value="auto">Auto</option>
                <option value="always">Always</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="text-[#808080]">Escape</span>
              <select
                value={csvOptions.escapeStrategy}
                onChange={(event) => onCsvEscapeStrategyChange(event.target.value as CsvOptions['escapeStrategy'])}
                className="bg-[#121214] border border-[#333] rounded px-2 py-1 focus:border-blue-500 outline-none"
              >
                <option value="double">Double quote</option>
                <option value="backslash">Backslash</option>
              </select>
            </label>
          </div>
        )}

        {mode === 'schemaValidate' && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A0A0A0]">
            <label className="flex items-center gap-1.5">
              <span className="text-[#808080]">Draft</span>
              <select
                value={schemaDraft}
                onChange={(event) => onSchemaDraftChange(event.target.value as SchemaDraft)}
                className="bg-[#121214] border border-[#333] rounded px-2 py-1 focus:border-blue-500 outline-none"
              >
                <option value="draft-07">Draft-07</option>
                <option value="2019-09">2019-09</option>
                <option value="2020-12">2020-12</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-[#808080]">Keywords</span>
              <input
                type="text"
                value={schemaCustomKeywordsInput}
                onChange={(event) => onSchemaCustomKeywordsInputChange(event.target.value)}
                placeholder="x-team-rule,x-data-scope"
                className="bg-[#121214] border border-[#333] text-xs text-[#A0A0A0] outline-none rounded px-2 py-1 w-56 font-mono focus:border-blue-500 transition-colors"
              />
            </label>
          </div>
        )}

        {mode === 'privacy' && (
          <label className="flex items-center gap-2 text-[11px] text-[#A0A0A0]">
            <input
              type="checkbox"
              checked={privacyPreviewMaskedOnly}
              onChange={(event) => onPrivacyPreviewMaskedOnlyChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span>Masked-only preview</span>
          </label>
        )}

        {errorStatus && (
          <div
            className={`flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest min-w-0 ${
              errorStatus.isError ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {errorStatus.isError ? <XCircle className="w-3.5 h-3.5 shrink-0" /> : <span className="text-green-500">●</span>}
            <span className="truncate max-w-[320px] sm:max-w-[360px]">{errorStatus.message}</span>
          </div>
        )}

        <div className="h-4 w-[1px] bg-[#333]"></div>
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
          onClick={() => onDownload(output, downloadFilename)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Down
        </button>
      </div>
    </div>
  );
}
