import {
  AlignLeft,
  Braces,
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
  type LucideIcon,
} from 'lucide-react';
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
  return (
    <header className="border-b border-[#262626] bg-[#161618] shrink-0">
      <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-xs shrink-0">
            <Braces className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold tracking-tight text-white truncate">JSON Dev Tool</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
            <input
              type="checkbox"
              checked={syncInputAcrossModes}
              onChange={(event) => onSyncInputAcrossModesChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span className="hidden sm:inline">Sync Input</span>
            <span className="sm:hidden">Sync</span>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
            <input
              type="checkbox"
              checked={showArrayHints}
              onChange={(event) => onShowArrayHintsChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span className="hidden sm:inline">Type Hints</span>
            <span className="sm:hidden">Hints</span>
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
            <input
              type="checkbox"
              checked={historyEnabled}
              onChange={(event) => onHistoryEnabledChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-blue-500"
            />
            <span className="hidden sm:inline">Workspace History</span>
            <span className="sm:hidden">History</span>
          </label>
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-[#808080] font-mono">
            <span className="px-1.5 py-0.5 border border-[#333] rounded">⌘/Ctrl + F</span> <span className="mr-2">Format</span>
            <span className="px-1.5 py-0.5 border border-[#333] rounded">⌘/Ctrl + ↵</span> <span>Run</span>
          </div>
          <button className="p-1.5 rounded-full hover:bg-[#262626] text-[#808080] transition-colors" onClick={onToggleTheme}>
            {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-3 pb-3 sm:px-6">
        <div className="sm:hidden mb-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#9AA0A6]">Mode</label>
          <select
            value={mode}
            onChange={(event) => onNavigateMode(event.target.value as Mode)}
            className="mt-1 w-full bg-[#121214] border border-[#333] rounded px-3 py-2 text-xs text-[#E0E0E0] outline-none focus:border-blue-500"
          >
            {MODE_OPTIONS.map((modeOption) => (
              <option key={modeOption.value} value={modeOption.value}>
                {modeOption.label}
              </option>
            ))}
          </select>
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
                  isActive ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {modeOption.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
