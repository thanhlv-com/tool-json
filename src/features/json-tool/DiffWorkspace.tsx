import { DiffEditor } from '@monaco-editor/react';
import type { ThemeMode } from './types';

type DiffWorkspaceProps = {
  theme: ThemeMode;
  diffOriginal: string;
  diffModified: string;
  onDiffOriginalChange: (value: string) => void;
  onDiffModifiedChange: (value: string) => void;
};

export function DiffWorkspace({
  theme,
  diffOriginal,
  diffModified,
  onDiffOriginalChange,
  onDiffModifiedChange,
}: DiffWorkspaceProps) {
  return (
    <div className="col-span-2 w-full relative">
      <DiffEditor
        height="100%"
        language="json"
        theme={theme}
        original={diffOriginal}
        modified={diffModified}
        onMount={(editor) => {
          const modifiedModel = editor.getModifiedEditor().getModel();
          const originalModel = editor.getOriginalEditor().getModel();

          if (modifiedModel) {
            modifiedModel.onDidChangeContent(() => onDiffModifiedChange(modifiedModel.getValue()));
          }

          if (originalModel) {
            originalModel.onDidChangeContent(() => onDiffOriginalChange(originalModel.getValue()));
          }
        }}
        options={{
          minimap: { enabled: false },
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: 13,
          renderSideBySide: true,
          originalEditable: true,
          wordWrap: 'on',
        }}
      />
    </div>
  );
}
