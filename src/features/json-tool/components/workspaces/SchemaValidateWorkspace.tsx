import Editor from '@monaco-editor/react';
import type { OutputLanguage, SchemaValidationIssue, ThemeMode } from '../../types';

type SchemaValidateWorkspaceProps = {
  theme: ThemeMode;
  input: string;
  schemaInput: string;
  schemaImportsInput: string;
  output: string;
  outputLanguage: OutputLanguage;
  schemaValidationIssues: SchemaValidationIssue[];
  onInputChange: (value: string) => void;
  onSchemaInputChange: (value: string) => void;
  onSchemaImportsInputChange: (value: string) => void;
  onInputValidate: (markers: any[]) => void;
  onSchemaValidate: (markers: any[]) => void;
  onSchemaImportsValidate: (markers: any[]) => void;
  onInputEditorMount: (editor: any) => void;
  onSchemaEditorMount: (editor: any) => void;
  onSchemaImportsEditorMount: (editor: any) => void;
  onOutputEditorMount: (editor: any) => void;
};

export function SchemaValidateWorkspace({
  theme,
  input,
  schemaInput,
  schemaImportsInput,
  output,
  outputLanguage,
  schemaValidationIssues,
  onInputChange,
  onSchemaInputChange,
  onSchemaImportsInputChange,
  onInputValidate,
  onSchemaValidate,
  onSchemaImportsValidate,
  onInputEditorMount,
  onSchemaEditorMount,
  onSchemaImportsEditorMount,
  onOutputEditorMount,
}: SchemaValidateWorkspaceProps) {
  return (
    <div className="col-span-1 md:col-span-2 grid grid-cols-1 xl:grid-cols-3 xl:grid-rows-[1fr_320px] min-h-0">
      <section className="flex min-h-[240px] xl:min-h-0 flex-col border-b border-[#D8DEE6] dark:border-[#262626] xl:border-r">
        <div className="flex items-center justify-between px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
          <span>JSON_DATA</span>
          <span>UTF-8</span>
        </div>
        <div className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11]">
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

      <section className="flex min-h-[240px] xl:min-h-0 flex-col border-b border-[#D8DEE6] dark:border-[#262626] xl:border-r">
        <div className="flex items-center justify-between px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
          <span>JSON_SCHEMA</span>
          <span>UTF-8</span>
        </div>
        <div className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11]">
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

      <section className="flex min-h-[240px] xl:min-h-0 flex-col border-b border-[#D8DEE6] dark:border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
          <span>SCHEMA_IMPORTS</span>
          <span>JSON ARRAY/MAP</span>
        </div>
        <div className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={schemaImportsInput}
            onChange={(value) => onSchemaImportsInputChange(value || '')}
            onValidate={onSchemaImportsValidate}
            onMount={onSchemaImportsEditorMount}
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

      <section className="col-span-1 xl:col-span-3 flex min-h-[360px] xl:min-h-0 flex-col xl:flex-row border-[#D8DEE6] dark:border-[#262626]">
        <div className="flex-1 min-h-[220px] xl:min-h-0 flex flex-col border-b border-[#D8DEE6] dark:border-[#262626] xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
            <span className="text-blue-400 border-b border-blue-500 pb-1">VALIDATION_RESULT</span>
            <span>READ ONLY</span>
          </div>
          <div className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11]">
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
        </div>

        <aside className="w-full xl:w-[34%] xl:min-w-[320px] max-h-[280px] xl:max-h-none flex flex-col bg-[#FFFFFF] dark:bg-[#121214]">
          <div className="flex items-center justify-between px-4 py-2 text-[10px] font-mono text-[#6B7280] dark:text-[#808080] border-b border-[#D8DEE6] dark:border-[#262626]">
            <span>ERROR_PANEL</span>
            <span>{schemaValidationIssues.length} ISSUES</span>
          </div>
          <div className="overflow-auto p-3 space-y-2">
            {schemaValidationIssues.length === 0 ? (
              <div className="text-xs text-[#6B7280] dark:text-[#6F7780]">No validation issues.</div>
            ) : (
              schemaValidationIssues.map((issue, index) => (
                <div key={`${issue.path}-${issue.keyword}-${index}`} className="rounded border border-[#D0D7E2] dark:border-[#2F2F31] bg-[#F5F6F8] dark:bg-[#17171A] p-2">
                  <div className="text-[10px] font-mono text-red-400">{issue.path}</div>
                  <div className="text-xs text-[#334155] dark:text-[#D0D0D0] mt-1">{issue.message}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#7D8590] mt-1">keyword: {issue.keyword}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
