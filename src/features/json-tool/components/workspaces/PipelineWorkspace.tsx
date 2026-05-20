import Editor from '@monaco-editor/react';
import type { OutputLanguage, ThemeMode } from '../../types';

type PipelineWorkspaceProps = {
  theme: ThemeMode;
  input: string;
  pipelineStepsInput: string;
  output: string;
  outputLanguage: OutputLanguage;
  onInputChange: (value: string) => void;
  onPipelineStepsInputChange: (value: string) => void;
  onInputValidate: (markers: any[]) => void;
  onPipelineStepsValidate: (markers: any[]) => void;
  onInputEditorMount: (editor: any) => void;
  onPipelineStepsEditorMount: (editor: any) => void;
  onOutputEditorMount: (editor: any) => void;
};

export function PipelineWorkspace({
  theme,
  input,
  pipelineStepsInput,
  output,
  outputLanguage,
  onInputChange,
  onPipelineStepsInputChange,
  onInputValidate,
  onPipelineStepsValidate,
  onInputEditorMount,
  onPipelineStepsEditorMount,
  onOutputEditorMount,
}: PipelineWorkspaceProps) {
  return (
    <div className="col-span-1 md:col-span-2 grid grid-cols-1 xl:grid-cols-3 min-h-0">
      <section className="flex min-h-[240px] xl:min-h-0 flex-col border-b border-[#262626] xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>PIPELINE_INPUT</span>
          <span>JSON</span>
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

      <section className="flex min-h-[240px] xl:min-h-0 flex-col border-b border-[#262626] xl:border-b-0 xl:border-r">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>PIPELINE_STEPS</span>
          <span>JSON ARRAY</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={pipelineStepsInput}
            onChange={(value) => onPipelineStepsInputChange(value || '')}
            onValidate={onPipelineStepsValidate}
            onMount={onPipelineStepsEditorMount}
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
        <div className="border-t border-[#262626] bg-[#121214] px-3 py-2 text-[10px] font-mono text-[#8D95A3] space-y-1">
          <div className="uppercase tracking-wide text-[#A2AAB8]">Supported step types</div>
          <div>`query`: {`{ "type": "query", "path": "$.items[*]" }`}</div>
          <div>`set`: {`{ "type": "set", "path": "/meta/version", "value": "2.0.0" }`}</div>
          <div>`remove`: {`{ "type": "remove", "path": "/secret" }`}</div>
          <div>`pick`: {`{ "type": "pick", "paths": ["/id", "/profile/name"] }`}</div>
          <div>`mask`: {`{ "type": "mask", "rules": { "keys": ["token"] } }`}</div>
          <div>`convert`: {`{ "type": "convert", "target": "json|yaml|xml|properties" }`}</div>
        </div>
      </section>

      <section className="flex min-h-[240px] xl:min-h-0 flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span className="text-blue-400 border-b border-blue-500 pb-1">PIPELINE_RESULT</span>
          <span>{outputLanguage.toUpperCase()}</span>
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
