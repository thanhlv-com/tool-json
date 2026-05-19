import { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import YAML from 'yaml';
import type { Mode, OutputLanguage, ThemeMode } from './types';

type StructuredLanguage = 'json' | 'yaml' | 'plaintext';

type EditorInsight = {
  status: 'empty' | 'valid' | 'invalid' | 'plaintext';
  rootType?: string;
  primaryCountLabel?: string;
  primaryCountValue?: number;
  nodeCount?: number;
  maxDepth?: number;
  lineCount: number;
  charCount: number;
  errorMessage?: string;
};

function getLineCount(content: string): number {
  if (!content.length) {
    return 0;
  }

  return content.split(/\r\n|\r|\n/).length;
}

function getRootType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function summarizeTree(value: unknown, depth = 1): { nodeCount: number; maxDepth: number } {
  if (value === null || typeof value !== 'object') {
    return { nodeCount: 1, maxDepth: depth };
  }

  let nodeCount = 1;
  let maxDepth = depth;

  if (Array.isArray(value)) {
    for (const item of value) {
      const childSummary = summarizeTree(item, depth + 1);
      nodeCount += childSummary.nodeCount;
      maxDepth = Math.max(maxDepth, childSummary.maxDepth);
    }
    return { nodeCount, maxDepth };
  }

  for (const childValue of Object.values(value as Record<string, unknown>)) {
    const childSummary = summarizeTree(childValue, depth + 1);
    nodeCount += childSummary.nodeCount;
    maxDepth = Math.max(maxDepth, childSummary.maxDepth);
  }

  return { nodeCount, maxDepth };
}

function getPrimaryCount(value: unknown): { label: string; value: number } | null {
  if (Array.isArray(value)) {
    return { label: 'items', value: value.length };
  }

  if (value && typeof value === 'object') {
    return { label: 'keys', value: Object.keys(value as Record<string, unknown>).length };
  }

  if (typeof value === 'string') {
    return { label: 'chars', value: value.length };
  }

  return null;
}

function analyzeEditorContent(content: string, language: StructuredLanguage): EditorInsight {
  const lineCount = getLineCount(content);
  const charCount = content.length;

  if (!content.trim()) {
    return { status: 'empty', lineCount, charCount };
  }

  if (language === 'plaintext') {
    return { status: 'plaintext', rootType: 'text', lineCount, charCount };
  }

  try {
    const parsed = language === 'yaml' ? YAML.parse(content) : JSON.parse(content);
    const rootType = getRootType(parsed);
    const primaryCount = getPrimaryCount(parsed);
    const treeSummary = summarizeTree(parsed);

    return {
      status: 'valid',
      rootType,
      primaryCountLabel: primaryCount?.label,
      primaryCountValue: primaryCount?.value,
      nodeCount: treeSummary.nodeCount,
      maxDepth: treeSummary.maxDepth,
      lineCount,
      charCount,
    };
  } catch (error: any) {
    return {
      status: 'invalid',
      errorMessage: error.message,
      lineCount,
      charCount,
    };
  }
}

function InsightBadges({ insight }: { insight: EditorInsight }) {
  const baseBadgeClassName =
    'rounded border border-[#2E2E30] bg-[#161618] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#9B9B9D] whitespace-nowrap';

  if (insight.status === 'invalid') {
    return (
      <div className="flex items-center gap-2">
        <span className={`${baseBadgeClassName} border-red-500/35 text-red-300`}>Invalid JSON/YAML</span>
        <span className="text-[10px] font-mono text-red-300 truncate max-w-[280px]" title={insight.errorMessage}>
          {insight.errorMessage}
        </span>
      </div>
    );
  }

  if (insight.status === 'empty') {
    return (
      <div className="flex items-center gap-2">
        <span className={baseBadgeClassName}>Empty</span>
        <span className={baseBadgeClassName}>Lines: {insight.lineCount}</span>
        <span className={baseBadgeClassName}>Chars: {insight.charCount}</span>
      </div>
    );
  }

  const badges = [
    `Root: ${insight.rootType}`,
    insight.primaryCountLabel && insight.primaryCountValue !== undefined
      ? `${insight.primaryCountLabel}: ${insight.primaryCountValue}`
      : null,
    insight.nodeCount !== undefined ? `Nodes: ${insight.nodeCount}` : null,
    insight.maxDepth !== undefined ? `Depth: ${insight.maxDepth}` : null,
    `Lines: ${insight.lineCount}`,
    `Chars: ${insight.charCount}`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex items-center gap-2">
      {badges.map((badge) => (
        <span key={badge} className={baseBadgeClassName}>
          {badge}
        </span>
      ))}
    </div>
  );
}

type EditorWorkspaceProps = {
  mode: Exclude<Mode, 'diff'>;
  theme: ThemeMode;
  input: string;
  output: string;
  outputLanguage: OutputLanguage;
  csvInputLooksLikeJson: boolean;
  onInputChange: (value: string) => void;
  onInputValidate: (markers: any[]) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onInputEditorMount: (editor: any) => void;
  onOutputEditorMount: (editor: any) => void;
};

export function EditorWorkspace({
  mode,
  theme,
  input,
  output,
  outputLanguage,
  csvInputLooksLikeJson,
  onInputChange,
  onInputValidate,
  onExpandAll,
  onCollapseAll,
  onInputEditorMount,
  onOutputEditorMount,
}: EditorWorkspaceProps) {
  const leftLabel =
    mode === 'convert'
      ? 'INPUT_SOURCE.yml/json'
      : mode === 'schemaGenerate'
        ? 'SAMPLE_JSON'
        : mode === 'convertCsv'
          ? 'INPUT.json/csv'
          : mode === 'escape'
            ? 'RAW_TEXT_OR_JSON_STRING'
            : 'INPUT_SOURCE.json';
  const rightLabel =
    mode === 'query'
      ? 'QUERY RESULT'
      : mode === 'schemaGenerate'
        ? 'GENERATED_SCHEMA'
        : mode === 'convertCsv'
          ? 'CONVERT_RESULT'
          : mode === 'escape'
            ? 'ESCAPE_RESULT'
            : 'PRETTY VIEW';
  const inputLanguage =
    mode === 'convert'
      ? 'yaml'
      : mode === 'convertCsv'
        ? csvInputLooksLikeJson
          ? 'json'
          : 'plaintext'
        : mode === 'escape'
        ? 'plaintext'
        : 'json';
  const outputMonacoLanguage = outputLanguage === 'plaintext' ? 'plaintext' : outputLanguage;
  const inputInsight = useMemo(
    () => analyzeEditorContent(input, inputLanguage === 'plaintext' ? 'plaintext' : inputLanguage),
    [input, inputLanguage],
  );
  const outputInsight = useMemo(() => analyzeEditorContent(output, outputMonacoLanguage), [output, outputMonacoLanguage]);

  return (
    <>
      <section className="flex flex-col border-r border-[#262626]">
        <div className="px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <div className="flex items-center justify-between">
            <span>{leftLabel}</span>
            <span>UTF-8</span>
          </div>
          <div className="mt-2 overflow-x-auto pb-1">
            <InsightBadges insight={inputInsight} />
          </div>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language={inputLanguage}
            theme={theme}
            value={input}
            onChange={(value) => onInputChange(value || '')}
            onMount={onInputEditorMount}
            onValidate={onInputValidate}
            options={{
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      </section>

      <section className="flex flex-col">
        <div className="px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <div className="flex gap-4">
            <span className="text-blue-400 border-b border-blue-500 pb-1">{rightLabel}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="overflow-x-auto pb-1">
              <InsightBadges insight={outputInsight} />
            </div>
            <div className="flex gap-2 text-[#808080] shrink-0">
              <button onClick={onExpandAll} className="hover:text-[#E0E0E0] transition-colors">
                <ChevronDown className="h-3 w-3" />
              </button>
              <button onClick={onCollapseAll} className="hover:text-[#E0E0E0] transition-colors">
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language={outputMonacoLanguage}
            theme={theme}
            value={output}
            onMount={onOutputEditorMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13,
              folding: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      </section>
    </>
  );
}
