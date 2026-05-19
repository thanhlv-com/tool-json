import Editor from '@monaco-editor/react';
import type { ThemeMode } from '../../types';

type MergeWorkspaceProps = {
  theme: ThemeMode;
  mergeLeftInput: string;
  mergeRightInput: string;
  output: string;
  onMergeLeftInputChange: (value: string) => void;
  onMergeRightInputChange: (value: string) => void;
};

export function MergeWorkspace({
  theme,
  mergeLeftInput,
  mergeRightInput,
  output,
  onMergeLeftInputChange,
  onMergeRightInputChange,
}: MergeWorkspaceProps) {
  return (
    <div className="col-span-2 grid grid-cols-3">
      <section className="flex flex-col border-r border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>LEFT_JSON</span>
          <span>BASE</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={mergeLeftInput}
            onChange={(value) => onMergeLeftInputChange(value || '')}
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
          <span>RIGHT_JSON</span>
          <span>INCOMING</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={mergeRightInput}
            onChange={(value) => onMergeRightInputChange(value || '')}
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
          <span className="text-blue-400 border-b border-blue-500 pb-1">MERGED_RESULT</span>
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
