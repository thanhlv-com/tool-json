import { DiffEditor } from '@monaco-editor/react';
import type { ThemeMode } from '../../types';
import type { JsonDiffReport } from '../../utils';

type DiffWorkspaceProps = {
  theme: ThemeMode;
  diffOriginal: string;
  diffModified: string;
  diffReport: JsonDiffReport | null;
  diffParseError: string | null;
  onDiffOriginalChange: (value: string) => void;
  onDiffModifiedChange: (value: string) => void;
};

export function DiffWorkspace({
  theme,
  diffOriginal,
  diffModified,
  diffReport,
  diffParseError,
  onDiffOriginalChange,
  onDiffModifiedChange,
}: DiffWorkspaceProps) {
  const renderDetails = () => {
    if (diffParseError) {
      return <div className="text-xs font-mono text-red-400">{diffParseError}</div>;
    }

    if (!diffReport) {
      return (
        <div className="text-xs font-mono text-[#808080]">
          Provide valid JSON in both panes to get detailed path-by-path diff analysis.
        </div>
      );
    }

    if (diffReport.equal) {
      return <div className="text-xs font-mono text-emerald-400">Both JSON documents are equivalent.</div>;
    }

    return (
      <div className="flex-1 overflow-auto pr-2">
        <ul className="space-y-2">
          {diffReport.details.map((detail) => (
            <li key={detail.id} className="rounded border border-[#2E2E30] bg-[#121214] px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="rounded border border-[#38383A] px-1.5 py-0.5 text-[#A5A5A8] uppercase">{detail.op}</span>
                <span className="text-[#5EA7FF]">{detail.pathLabel}</span>
              </div>
              <div className="mt-1 text-xs text-[#D0D0D0]">{detail.message}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="col-span-2 grid grid-rows-[1fr_220px] w-full min-h-0">
      <div className="relative min-h-0 border-b border-[#262626]">
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

      <section className="flex min-h-0 flex-col bg-[#0F0F11] px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
          <span className="text-[#5EA7FF]">Diff Details</span>
          {diffReport && !diffParseError ? (
            <span className="text-[#808080]">
              Total {diffReport.operationCount} | +{diffReport.summary.added} -{diffReport.summary.removed} ~
              {diffReport.summary.changed}
            </span>
          ) : null}
        </div>
        {renderDetails()}
      </section>
    </div>
  );
}
