import Editor from '@monaco-editor/react';
import type { ThemeMode } from './types';

type PatchWorkspaceProps = {
  theme: ThemeMode;
  patchBaseInput: string;
  patchTargetInput: string;
  patchOperationsInput: string;
  output: string;
  onPatchBaseInputChange: (value: string) => void;
  onPatchTargetInputChange: (value: string) => void;
  onPatchOperationsInputChange: (value: string) => void;
};

export function PatchWorkspace({
  theme,
  patchBaseInput,
  patchTargetInput,
  patchOperationsInput,
  output,
  onPatchBaseInputChange,
  onPatchTargetInputChange,
  onPatchOperationsInputChange,
}: PatchWorkspaceProps) {
  return (
    <div className="col-span-2 grid grid-cols-2 grid-rows-2">
      <section className="flex flex-col border-r border-b border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>BASE_JSON</span>
          <span>FOR APPLY</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={patchBaseInput}
            onChange={(value) => onPatchBaseInputChange(value || '')}
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
          <span>TARGET_JSON</span>
          <span>FOR GENERATE</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={patchTargetInput}
            onChange={(value) => onPatchTargetInputChange(value || '')}
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

      <section className="flex flex-col border-r border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>PATCH_OPERATIONS</span>
          <span>RFC 6902</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={patchOperationsInput}
            onChange={(value) => onPatchOperationsInputChange(value || '')}
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
          <span className="text-blue-400 border-b border-blue-500 pb-1">PATCH_RESULT</span>
          <span>READ ONLY</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={output}
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
