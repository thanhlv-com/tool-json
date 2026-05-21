import { History, Redo2, RotateCcw, Save } from 'lucide-react';

type WorkspaceHistoryBarProps = {
  historyEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  activeSnapshotId: string | null;
  snapshots: Array<{ id: string; label: string; createdAt: string }>;
  onUndo: () => void;
  onRedo: () => void;
  onSaveSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
};

export function WorkspaceHistoryBar({
  historyEnabled,
  canUndo,
  canRedo,
  activeSnapshotId,
  snapshots,
  onUndo,
  onRedo,
  onSaveSnapshot,
  onRestoreSnapshot,
}: WorkspaceHistoryBarProps) {
  const hasSnapshots = snapshots.length > 0;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 px-3 sm:px-6 py-2 border-b border-[#D8DEE6] dark:border-[#262626] bg-[#FCFCFD] dark:bg-[#141416]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9AA0A6]">
          <History className="h-3.5 w-3.5" />
          Workspace History
        </span>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#C7D0DB] dark:border-[#333] hover:border-blue-500 bg-[#FFFFFF] dark:bg-[#1F1F21] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Undo
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#C7D0DB] dark:border-[#333] hover:border-blue-500 bg-[#FFFFFF] dark:bg-[#1F1F21] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Redo2 className="w-3.5 h-3.5" /> Redo
        </button>

        <button
          onClick={onSaveSnapshot}
          disabled={!historyEnabled}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#C7D0DB] dark:border-[#333] hover:border-blue-500 bg-[#FFFFFF] dark:bg-[#1F1F21] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save className="w-3.5 h-3.5" /> Save Snapshot
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-mono text-[#6B7280] dark:text-[#7B7B7D]">
          {hasSnapshots ? `${snapshots.length} snapshots` : 'No snapshots'}
        </div>
        <select
          value={activeSnapshotId ?? ''}
          onChange={(event) => onRestoreSnapshot(event.target.value)}
          disabled={!hasSnapshots}
          className="max-w-full min-w-[220px] bg-[#FFFFFF] dark:bg-[#121214] border border-[#C7D0DB] dark:border-[#333] rounded px-2 py-1 text-xs text-[#1F2937] dark:text-[#E0E0E0] outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {!hasSnapshots && <option value="">No snapshots yet</option>}
          {snapshots.map((snapshot) => (
            <option key={snapshot.id} value={snapshot.id}>
              {snapshot.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
