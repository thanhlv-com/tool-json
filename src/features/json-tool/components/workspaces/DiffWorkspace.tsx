import Editor, { DiffEditor } from '@monaco-editor/react';
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
        <div className="text-xs font-mono text-[#6B7280] dark:text-[#808080]">
          Provide valid JSON in both panes to get detailed path-by-path diff analysis.
        </div>
      );
    }

    if (diffReport.equal) {
      return <div className="text-xs font-mono text-emerald-400">Both JSON documents are equivalent.</div>;
    }

    return (
      <div className="flex-1 overflow-auto pr-2">
        {diffReport.detailsTruncated && (
          <div className="mb-2 rounded border border-[#3A2F1A] bg-[#20180F] px-3 py-2 text-[11px] text-amber-300">
            Showing first {diffReport.detailLimit} diff details out of {diffReport.operationCount} changes to keep the UI responsive.
          </div>
        )}
        <ul className="space-y-2">
          {diffReport.details.map((detail) => (
            <li key={detail.id} className="rounded border border-[#D0D7E2] dark:border-[#2E2E30] bg-[#FFFFFF] dark:bg-[#121214] px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="rounded border border-[#38383A] px-1.5 py-0.5 text-[#A5A5A8] uppercase">{detail.op}</span>
                <span className="text-[#5EA7FF]">{detail.pathLabel}</span>
              </div>
              <div className="mt-1 text-xs text-[#334155] dark:text-[#D0D0D0] break-words">{detail.message}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="col-span-1 md:col-span-2 grid grid-rows-[minmax(260px,1fr)_minmax(180px,42dvh)] md:grid-rows-[1fr_220px] w-full min-h-0">
      <div className="relative min-h-0 border-b border-[#D8DEE6] dark:border-[#262626]">
        <div className="grid grid-rows-2 h-full md:hidden">
          <section className="flex flex-col border-b border-[#D8DEE6] dark:border-[#262626]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
              <span>ORIGINAL_JSON</span>
            </div>
            <div className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11]">
              <Editor
                height="100%"
                language="json"
                theme={theme}
                value={diffOriginal}
                onChange={(value) => onDiffOriginalChange(value || '')}
                options={{
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

          <section className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
              <span>MODIFIED_JSON</span>
            </div>
            <div className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11]">
              <Editor
                height="100%"
                language="json"
                theme={theme}
                value={diffModified}
                onChange={(value) => onDiffModifiedChange(value || '')}
                options={{
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

        <div className="hidden md:block h-full">
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
              renderSideBySideInlineBreakpoint: 900,
              renderMarginRevertIcon: true,
              originalEditable: true,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>

      <section className="flex min-h-0 flex-col bg-[#F7F8FA] dark:bg-[#0F0F11] px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
          <span className="text-[#5EA7FF]">Diff Details</span>
          {diffReport && !diffParseError ? (
            <span className="text-[#6B7280] dark:text-[#808080]">
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
