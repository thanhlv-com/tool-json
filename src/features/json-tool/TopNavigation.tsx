import {
  AlignLeft,
  Braces,
  Link2,
  FileCode2,
  ShieldCheck,
  Sparkles,
  Table2,
  Moon,
  SearchCode,
  SplitSquareHorizontal,
  Sun,
  Wand2,
} from 'lucide-react';
import type { Mode, ThemeMode } from './types';

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
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[#262626] bg-[#161618] shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-xs">
            <Braces className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold tracking-tight text-white">JSON Dev Tool</span>
        </div>

        <nav className="flex gap-1 text-xs font-medium">
          <button
            onClick={() => onNavigateMode('format')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'format' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" /> Editor
          </button>
          <button
            onClick={() => onNavigateMode('diff')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'diff' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <SplitSquareHorizontal className="w-3.5 h-3.5" /> JSON Diff
          </button>
          <button
            onClick={() => onNavigateMode('query')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'query' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <SearchCode className="w-3.5 h-3.5" /> Path Query
          </button>
          <button
            onClick={() => onNavigateMode('convert')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'convert' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" /> YAML
          </button>
          <button
            onClick={() => onNavigateMode('schemaGenerate')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'schemaGenerate' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Schema
          </button>
          <button
            onClick={() => onNavigateMode('schemaValidate')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'schemaValidate' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Check
          </button>
          <button
            onClick={() => onNavigateMode('convertCsv')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'convertCsv' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => onNavigateMode('escape')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'escape' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> Escape
          </button>
          <button
            onClick={() => onNavigateMode('patch')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              mode === 'patch' ? 'bg-[#262626] text-white' : 'hover:bg-[#202022] text-[#808080]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Patch
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <label className="hidden sm:flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
          <input
            type="checkbox"
            checked={syncInputAcrossModes}
            onChange={(event) => onSyncInputAcrossModesChange(event.target.checked)}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          Sync Input
        </label>
        <label className="hidden sm:flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
          <input
            type="checkbox"
            checked={showArrayHints}
            onChange={(event) => onShowArrayHintsChange(event.target.checked)}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          Type Hints
        </label>
        <div className="h-4 w-[1px] bg-[#333] hidden sm:block"></div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#808080] font-mono">
          <span className="px-1.5 py-0.5 border border-[#333] rounded">⌘/Ctrl + F</span> <span className="mr-2">Format</span>
          <span className="px-1.5 py-0.5 border border-[#333] rounded">⌘/Ctrl + ↵</span> <span>Run</span>
        </div>
        <div className="h-4 w-[1px] bg-[#333] hidden sm:block"></div>
        <button className="p-1.5 rounded-full hover:bg-[#262626] text-[#808080] transition-colors" onClick={onToggleTheme}>
          {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
