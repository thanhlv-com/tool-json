import Editor from '@monaco-editor/react';
import type { OutputLanguage, ThemeMode } from './types';

type SchemaValidateWorkspaceProps = {
  theme: ThemeMode;
  input: string;
  schemaInput: string;
  output: string;
  outputLanguage: OutputLanguage;
  onInputChange: (value: string) => void;
  onSchemaInputChange: (value: string) => void;
  onInputValidate: (markers: any[]) => void;
  onSchemaValidate: (markers: any[]) => void;
  onInputEditorMount: (editor: any) => void;
  onSchemaEditorMount: (editor: any) => void;
  onOutputEditorMount: (editor: any) => void;
};

export function SchemaValidateWorkspace({
  theme,
  input,
  schemaInput,
  output,
  outputLanguage,
  onInputChange,
  onSchemaInputChange,
  onInputValidate,
  onSchemaValidate,
  onInputEditorMount,
  onSchemaEditorMount,
  onOutputEditorMount,
}: SchemaValidateWorkspaceProps) {
  return (
    <div className="col-span-2 grid grid-cols-2 grid-rows-[1fr_220px]">
      <section className="flex flex-col border-r border-b border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>JSON_DATA</span>
          <span>UTF-8</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={input}
            onChange={(value) => onInputChange(value || '')}
            onValidate={onInputValidate}
            onMount={onInputEditorMount}
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

      <section className="flex flex-col border-b border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>JSON_SCHEMA</span>
          <span>UTF-8</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={schemaInput}
            onChange={(value) => onSchemaInputChange(value || '')}
            onValidate={onSchemaValidate}
            onMount={onSchemaEditorMount}
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

      <section className="col-span-2 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span className="text-blue-400 border-b border-blue-500 pb-1">VALIDATION_RESULT</span>
          <span>READ ONLY</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language={outputLanguage === 'plaintext' ? 'plaintext' : outputLanguage}
            theme={theme}
            value={output}
            onMount={onOutputEditorMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 12 },
            }}
          />
        </div>
      </section>
    </div>
  );
}
