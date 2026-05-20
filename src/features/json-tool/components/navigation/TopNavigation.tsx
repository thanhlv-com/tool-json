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
  Moon,
  SearchCode,
  SplitSquareHorizontal,
  Sun,
  Wand2,
} from 'lucide-react';
import type { Mode, ThemeMode } from '../../types';

type TopNavigationProps = {
  mode: Mode;
  onNavigateMode: (mode: Mode) => void;
  syncInputAcrossModes: boolean;
  onSyncInputAcrossModesChange: (value: boolean) => void;
  showArrayHints: boolean;
  onShowArrayHintsChange: (value: boolean) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
};

export function TopNavigation({
  mode,
  onNavigateMode,
  syncInputAcrossModes,
  onSyncInputAcrossModesChange,
  showArrayHints,
  onShowArrayHintsChange,
  theme,
  onToggleTheme,
}: TopNavigationProps) {
  const modeOptions: Array<{ value: Mode; label: string }> = [
    { value: 'format', label: 'Editor' },
    { value: 'diff', label: 'JSON Diff' },
    { value: 'merge', label: 'Merge' },
    { value: 'query', label: 'Path Query' },
    { value: 'pipeline', label: 'Pipeline' },
    { value: 'privacy', label: 'Privacy' },
    { value: 'tree', label: 'Tree' },
    { value: 'convert', label: 'Convert' },
    { value: 'schemaGenerate', label: 'Schema' },
    { value: 'schemaValidate', label: 'Check' },
    { value: 'convertCsv', label: 'CSV' },
    { value: 'escape', label: 'Escape' },
    { value: 'patch', label: 'Patch' },
  ];

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
            {modeOptions.map((modeOption) => (
              <option key={modeOption.value} value={modeOption.value}>
                {modeOption.label}
              </option>
            ))}
          </select>
        </div>

        <nav className="hidden sm:flex gap-1 text-xs font-medium overflow-x-auto whitespace-nowrap pr-2">
          <button
            onClick={() => onNavigateMode('format')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'format' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" /> Editor
          </button>
          <button
            onClick={() => onNavigateMode('diff')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'diff' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" /> JSON Diff
          </button>
          <button
            onClick={() => onNavigateMode('merge')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'merge' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" /> Merge
          </button>
          <button
            onClick={() => onNavigateMode('query')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'query' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <SearchCode className="w-3.5 h-3.5" /> Path Query
          </button>
          <button
            onClick={() => onNavigateMode('pipeline')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'pipeline' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Pipeline
          </button>
          <button
            onClick={() => onNavigateMode('privacy')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'privacy' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Privacy
          </button>
          <button
            onClick={() => onNavigateMode('tree')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'tree' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Tree
          </button>
          <button
            onClick={() => onNavigateMode('convert')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'convert' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" /> Convert
          </button>
          <button
            onClick={() => onNavigateMode('schemaGenerate')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'schemaGenerate' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Schema
          </button>
          <button
            onClick={() => onNavigateMode('schemaValidate')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'schemaValidate' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Check
          </button>
          <button
            onClick={() => onNavigateMode('convertCsv')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'convertCsv' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => onNavigateMode('escape')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'escape' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> Escape
          </button>
          <button
            onClick={() => onNavigateMode('patch')}
            className={`shrink-0 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'patch' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Patch
          </button>
        </nav>
      </div>
    </header>
  );
}
