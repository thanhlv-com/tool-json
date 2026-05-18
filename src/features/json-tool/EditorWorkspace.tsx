import Editor from '@monaco-editor/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Mode, OutputLanguage, ThemeMode } from './types';

type EditorWorkspaceProps = {
  mode: Exclude<Mode, 'diff'>;
  theme: ThemeMode;
  input: string;
  output: string;
  outputLanguage: OutputLanguage;
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
      : mode === 'convertCsv' || mode === 'escape'
        ? 'plaintext'
        : 'json';
  const outputMonacoLanguage = outputLanguage === 'plaintext' ? 'plaintext' : outputLanguage;

  return (
    <>
      <section className="flex flex-col border-r border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>{leftLabel}</span>
          <span>UTF-8</span>
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
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <div className="flex gap-4">
            <span className="text-blue-400 border-b border-blue-500 pb-1">{rightLabel}</span>
          </div>
          <div className="flex gap-2 text-[#808080]">
            <button onClick={onExpandAll} className="hover:text-[#E0E0E0] transition-colors">
              <ChevronDown className="h-3 w-3" />
            </button>
            <button onClick={onCollapseAll} className="hover:text-[#E0E0E0] transition-colors">
              <ChevronRight className="h-3 w-3" />
            </button>
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
