import {
  AlignLeft,
  Braces,
  ChevronRight,
  Link2,
  FileCode2,
  GitBranch,
  GitMerge,
  Lock,
  ShieldCheck,
  Sparkles,
  Table2,
  TestTube2,
  Moon,
  SearchCode,
  SplitSquareHorizontal,
  Sun,
  Wand2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODE_PATHS } from '../../modeRoutes';
import type { Mode, ThemeMode } from '../../types';

type TopNavigationProps = {
  mode: Mode;
  onNavigateMode: (mode: Mode) => void;
  syncInputAcrossModes: boolean;
  onSyncInputAcrossModesChange: (value: boolean) => void;
  showArrayHints: boolean;
  onShowArrayHintsChange: (value: boolean) => void;
  historyEnabled: boolean;
  onHistoryEnabledChange: (value: boolean) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

type ModeOption = {
  value: Mode;
  label: string;
  icon: LucideIcon;
};

const MODE_OPTIONS: ModeOption[] = [
  { value: 'format', label: 'Editor', icon: AlignLeft },
  { value: 'diff', label: 'JSON Diff', icon: SplitSquareHorizontal },
  { value: 'merge', label: 'Merge', icon: GitMerge },
  { value: 'query', label: 'Path Query', icon: SearchCode },
  { value: 'pipeline', label: 'Pipeline', icon: Wand2 },
  { value: 'privacy', label: 'Privacy', icon: Lock },
  { value: 'tree', label: 'Tree', icon: GitBranch },
  { value: 'convert', label: 'Convert', icon: FileCode2 },
  { value: 'schemaGenerate', label: 'Schema', icon: Sparkles },
  { value: 'schemaMock', label: 'Mock', icon: TestTube2 },
  { value: 'schemaValidate', label: 'Check', icon: ShieldCheck },
  { value: 'convertCsv', label: 'CSV', icon: Table2 },
  { value: 'escape', label: 'Escape', icon: Link2 },
  { value: 'patch', label: 'Patch', icon: Wand2 },
];

export function TopNavigation({
  mode,
  onNavigateMode,
  syncInputAcrossModes,
  onSyncInputAcrossModesChange,
  showArrayHints,
  onShowArrayHintsChange,
  historyEnabled,
  onHistoryEnabledChange,
  theme,
  onToggleTheme,
}: TopNavigationProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeModeOption = useMemo(
    () => MODE_OPTIONS.find((modeOption) => modeOption.value === mode) ?? MODE_OPTIONS[0],
    [mode],
  );

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [mode]);

  const ActiveModeIcon = activeModeOption.icon;

  return (
    <header className="border-b border-[#D8DEE6] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#161618] shrink-0">
      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-xs shrink-0">
            <Braces className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold tracking-tight text-[#111827] dark:text-white truncate">JSON Dev Tool</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9AA0A6]">
            <input
              type="checkbox"
              checked={syncInputAcrossModes}
              onChange={(event) => onSyncInputAcrossModesChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span className="hidden sm:inline">Sync Input</span>
            <span className="sm:hidden">Sync</span>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9AA0A6]">
            <input
              type="checkbox"
              checked={showArrayHints}
              onChange={(event) => onShowArrayHintsChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span className="hidden sm:inline">Type Hints</span>
            <span className="sm:hidden">Hints</span>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9AA0A6]">
            <input
              type="checkbox"
              checked={historyEnabled}
              onChange={(event) => onHistoryEnabledChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span className="hidden sm:inline">Workspace History</span>
            <span className="sm:hidden">History</span>
          </label>
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-[#6B7280] dark:text-[#808080] font-mono">
            <span className="px-1.5 py-0.5 border border-[#C7D0DB] dark:border-[#333] rounded">⌘/Ctrl + F</span> <span className="mr-2">Format</span>
            <span className="px-1.5 py-0.5 border border-[#C7D0DB] dark:border-[#333] rounded">⌘/Ctrl + ↵</span> <span>Run</span>
          </div>
          <button className="p-1.5 rounded-full hover:bg-[#E6EBF1] dark:hover:bg-[#262626] text-[#6B7280] dark:text-[#808080] transition-colors" onClick={onToggleTheme}>
            {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-3 pb-3 sm:px-6">
        <div className="sm:hidden mb-2">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="w-full flex items-center justify-between gap-2 rounded border border-[#C7D0DB] dark:border-[#333] bg-[#FFFFFF] dark:bg-[#121214] px-3 py-2 text-left"
            aria-label="Open mode sidebar"
            aria-expanded={isMobileSidebarOpen}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ActiveModeIcon className="w-4 h-4 text-[#4B5563] dark:text-[#A1A1AA] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9AA0A6]">Mode</div>
                <div className="text-xs font-medium text-[#111827] dark:text-[#E0E0E0] truncate">{activeModeOption.label}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6B7280] dark:text-[#9AA0A6] shrink-0" />
          </button>
        </div>

        <nav className="hidden sm:flex gap-1 text-xs font-medium overflow-x-auto whitespace-nowrap pr-2">
          {MODE_OPTIONS.map((modeOption) => {
            const Icon = modeOption.icon;
            const isActive = mode === modeOption.value;

            return (
              <Link
                key={modeOption.value}
                to={MODE_PATHS[modeOption.value]}
                className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  isActive ? 'bg-[#E6EBF1] dark:bg-[#262626] text-[#111827] dark:text-white' : 'hover:bg-[#EDF1F5] dark:hover:bg-[#202022] text-[#6B7280] dark:text-[#808080]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {modeOption.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {isMobileSidebarOpen && (
        <div className="sm:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close mode sidebar"
          />
          <aside className="absolute left-0 top-0 h-full w-[85%] max-w-[320px] border-r border-[#D8DEE6] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#161618] p-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#111827] dark:text-white">Select Mode</h2>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#E6EBF1] dark:hover:bg-[#262626] text-[#6B7280] dark:text-[#9AA0A6]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100dvh-90px)] pr-1">
              {MODE_OPTIONS.map((modeOption) => {
                const Icon = modeOption.icon;
                const isActive = mode === modeOption.value;

                return (
                  <button
                    key={modeOption.value}
                    type="button"
                    onClick={() => onNavigateMode(modeOption.value)}
                    className={`w-full flex items-center justify-between gap-2 rounded px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-[#E6EBF1] dark:bg-[#262626] text-[#111827] dark:text-white'
                        : 'text-[#4B5563] dark:text-[#A1A1AA] hover:bg-[#EDF1F5] dark:hover:bg-[#202022]'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{modeOption.label}</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
