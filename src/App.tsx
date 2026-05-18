import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { DiffEditor, useMonaco } from '@monaco-editor/react';
import { JSONPath } from 'jsonpath-plus';
import YAML from 'yaml';
import { 
  FileJson, 
  SplitSquareHorizontal, 
  SearchCode, 
  FileCode2, 
  Copy, 
  Download, 
  Sun, 
  Moon,
  Braces,
  AlignLeft,
  Minimize2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  WrapText
} from 'lucide-react';
import { cn } from './lib/utils';

type Mode = 'format' | 'diff' | 'query' | 'convert';

export default function App() {
  const [mode, setMode] = useState<Mode>('format');
  const [input, setInput] = useState<string>('{\n  "tool": "JSON Dev Tool",\n  "version": 1.0,\n  "features": [\n    "Format",\n    "Validate",\n    "Diff",\n    "Query",\n    "YAML"\n  ],\n  "is_awesome": true\n}');
  const [output, setOutput] = useState<string>('');
  
  // States for Diff mode
  const [diffOriginal, setDiffOriginal] = useState<string>('{\n  "status": "ok",\n  "code": 200\n}');
  const [diffModified, setDiffModified] = useState<string>('{\n  "status": "error",\n  "code": 500,\n  "message": "Failed"\n}');
  
  // State for Query mode
  const [jsonPath, setJsonPath] = useState<string>('$.features');
  
  // Global States
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [errorStatus, setErrorStatus] = useState<{message: string, isError: boolean} | null>(null);
  
  const inputEditorRef = useRef<any>(null);
  const outputEditorRef = useRef<any>(null);
  const monaco = useMonaco();

  // Handle dark mode class
  useEffect(() => {
    if (theme === 'vs-dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle general mode output generation
  const processJson = useCallback((action = 'format', customInput = input) => {
    setErrorStatus(null);
    if (!customInput.trim()) {
      setOutput('');
      return;
    }

    try {
      if (mode === 'convert') {
        // Auto detect if it's YAML or JSON
        if (customInput.trim().startsWith('{') || customInput.trim().startsWith('[')) {
          // JSON to YAML
          const parsed = JSON.parse(customInput);
          setOutput(YAML.stringify(parsed));
          setErrorStatus({ message: 'Converted JSON to YAML', isError: false });
        } else {
          // YAML to JSON
          const parsed = YAML.parse(customInput);
          setOutput(JSON.stringify(parsed, null, 2));
          setErrorStatus({ message: 'Converted YAML to JSON', isError: false });
        }
      } else if (mode === 'query') {
        const parsed = JSON.parse(customInput);
        let result;
        try {
          result = JSONPath({ path: jsonPath, json: parsed });
          setOutput(JSON.stringify(result, null, 2));
          setErrorStatus({ message: `Query matched ${result?.length || 0} items`, isError: false });
        } catch (e: any) {
          setErrorStatus({ message: `Invalid JSONPath: ${e.message}`, isError: true });
        }
      } else {
        // Format, Minify or Validate
        const parsed = JSON.parse(customInput);
        if (action === 'minify') {
          setOutput(JSON.stringify(parsed));
          setErrorStatus({ message: 'Valid JSON (Minified)', isError: false });
        } else if (action === 'validate') {
          setErrorStatus({ message: 'Valid JSON', isError: false });
          setOutput(JSON.stringify(parsed, null, 2));
        } else {
          setOutput(JSON.stringify(parsed, null, 2));
          setErrorStatus({ message: 'Valid JSON (Formatted)', isError: false });
        }
      }
    } catch (e: any) {
      // Basic fallback error handling (Monaco onValidate provides better details)
      setErrorStatus({ message: `Parse Error: ${e.message}`, isError: true });
    }
  }, [input, mode, jsonPath]);

  // Run processing when mode or input changes (except diff)
  useEffect(() => {
    if (mode !== 'diff') {
      processJson();
    }
  }, [mode, processJson, jsonPath]);

  // Handlers for Toolbar
  const handleFormat = () => processJson('format');
  const handleMinify = () => processJson('minify');
  
  const handleExpandAll = () => {
    if (outputEditorRef.current) {
      outputEditorRef.current.trigger('fold', 'editor.unfoldAll');
    }
  };

  const handleCollapseAll = () => {
    if (outputEditorRef.current) {
      outputEditorRef.current.trigger('fold', 'editor.foldAll');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter -> Process/Validate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processJson('format');
      }
      // Ctrl/Cmd + Shift + F -> Format
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        processJson('format');
      }
      // Ctrl/Cmd + Shift + M -> Minify
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        processJson('minify');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [processJson]);

  // Get Validation errors directly from Monaco
  const handleEditorValidation = (markers: any[]) => {
    if (mode === 'diff' || mode === 'convert') return; // Don't show JSON errors for YAML/Diff
    const errors = markers.filter(m => m.severity === 8); // 8 is Error
    if (errors.length > 0) {
      const err = errors[0];
      setErrorStatus({ 
        message: `Line ${err.startLineNumber}, Col ${err.startColumn}: ${err.message}`, 
        isError: true 
      });
    } else if (input.trim()) {
      // If monaco says it's ok, but our process JSON failed, Monaco is still parsing.
      // We rely on our `processJson` to set Valid state.
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#0F0F11] text-[#E0E0E0] font-sans overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#262626] bg-[#161618] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-xs"><Braces className="w-3.5 h-3.5" /></div>
            <span className="font-semibold tracking-tight text-white">JSON Dev Tool</span>
          </div>
          
          {/* Mode Selector */}
          <nav className="flex gap-1 text-xs font-medium">
            <button 
              onClick={() => setMode('format')}
              className={cn("px-3 py-1.5 rounded transition-colors flex items-center gap-1.5", mode === 'format' ? "bg-[#262626] text-white" : "hover:bg-[#202022] text-[#808080]")}
            >
              <AlignLeft className="w-3.5 h-3.5" /> Editor
            </button>
            <button 
              onClick={() => setMode('diff')}
              className={cn("px-3 py-1.5 rounded transition-colors flex items-center gap-1.5", mode === 'diff' ? "bg-[#262626] text-white" : "hover:bg-[#202022] text-[#808080]")}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" /> JSON Diff
            </button>
            <button 
              onClick={() => setMode('query')}
              className={cn("px-3 py-1.5 rounded transition-colors flex items-center gap-1.5", mode === 'query' ? "bg-[#262626] text-white" : "hover:bg-[#202022] text-[#808080]")}
            >
              <SearchCode className="w-3.5 h-3.5" /> Path Query
            </button>
            <button 
              onClick={() => setMode('convert')}
              className={cn("px-3 py-1.5 rounded transition-colors flex items-center gap-1.5", mode === 'convert' ? "bg-[#262626] text-white" : "hover:bg-[#202022] text-[#808080]")}
            >
              <FileCode2 className="w-3.5 h-3.5" /> YAML
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[#808080] font-mono">
            <span className="px-1.5 py-0.5 border border-[#333] rounded">⌘/Ctrl + F</span> <span className="mr-2">Format</span>
            <span className="px-1.5 py-0.5 border border-[#333] rounded">⌘/Ctrl + ↵</span> <span>Run</span>
          </div>
          <div className="h-4 w-[1px] bg-[#333] hidden sm:block"></div>
          <button 
            className="p-1.5 rounded-full hover:bg-[#262626] text-[#808080] transition-colors"
            onClick={() => setTheme(t => t === 'vs-dark' ? 'light' : 'vs-dark')}
          >
            {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4"/>}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Main Action Bar */}
        {mode !== 'diff' && (
          <div className="flex items-center justify-between px-6 py-2 bg-[#1A1A1C] border-b border-[#262626]">
            <div className="flex gap-2">
              <button onClick={handleFormat} className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors">
                <AlignLeft className="w-3.5 h-3.5" /> Format
              </button>
              <button onClick={handleMinify} className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors">
                <Minimize2 className="w-3.5 h-3.5" /> Minify
              </button>
              {mode === 'convert' && (
                <button onClick={() => processJson('convert')} className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors">
                  <FileCode2 className="w-3.5 h-3.5" /> Convert
                </button>
              )}
              <button onClick={() => processJson('validate')} className="px-3 py-1 flex items-center gap-1.5 text-xs font-medium rounded border border-blue-500 bg-blue-500/10 text-blue-400 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Validate
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {errorStatus && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold tracking-widest",
                  errorStatus.isError ? "text-red-500" : "text-green-500"
                )}>
                  {errorStatus.isError ? <XCircle className="w-3.5 h-3.5 shrink-0" /> : <span className="text-green-500">●</span>}
                  <span className="truncate">{errorStatus.message}</span>
                </div>
              )}

               {mode === 'query' && (
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-[#262626] rounded text-[10px] font-bold text-blue-400 border border-[#333]">JSONPath</div>
                  <input 
                    type="text" 
                    value={jsonPath}
                    onChange={(e) => setJsonPath(e.target.value)}
                    className="bg-[#121214] border border-[#333] text-xs text-[#A0A0A0] outline-none rounded px-3 py-1 w-64 font-mono focus:border-blue-500 transition-colors hover:border-[#555]"
                    placeholder="$.features"
                  />
                </div>
              )}
              <div className="h-4 w-[1px] bg-[#333] hidden sm:block"></div>
              <button onClick={() => copyToClipboard(output)} className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
              <button onClick={() => downloadFile(output, 'result.json')} className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded border border-[#333] hover:border-blue-500 bg-[#1F1F21] transition-colors">
                <Download className="w-3.5 h-3.5" /> Down
              </button>
            </div>
          </div>
        )}

        {/* Diff Mode Specific Action Bar */}
        {mode === 'diff' && (
          <div className="flex items-center justify-between px-6 py-2 bg-[#1A1A1C] border-b border-[#262626]">
            <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Original Source</div>
            <div className="text-[10px] font-mono text-[#606060] uppercase tracking-wider">Modified Target</div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 grid grid-cols-2 bg-[#0F0F11] overflow-hidden">
          {mode === 'diff' ? (
            <div className="col-span-2 w-full relative">
               <DiffEditor
                  height="100%"
                  language="json"
                  theme={theme}
                  original={diffOriginal}
                  modified={diffModified}
                  onMount={(editor) => {
                    // Update state when editor changes if needed, but diff is often read-to-play
                    const modifiedModel = editor.getModifiedEditor().getModel();
                    const originalModel = editor.getOriginalEditor().getModel();
                    if (modifiedModel) modifiedModel.onDidChangeContent(() => setDiffModified(modifiedModel.getValue()));
                    if (originalModel) originalModel.onDidChangeContent(() => setDiffOriginal(originalModel.getValue()));
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    fontSize: 13,
                    renderSideBySide: true,
                    wordWrap: "on",
                  }}
                />
            </div>
          ) : (
            <>
              {/* Left Pane: Input */}
              <section className="flex flex-col border-r border-[#262626]">
                <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
                  <span>{mode === 'convert' ? 'INPUT_SOURCE.yml/json' : 'INPUT_SOURCE.json'}</span>
                  <span>UTF-8</span>
                </div>
                <div className="flex-1 bg-[#0F0F11]">
                  <Editor
                    height="100%"
                    language={mode === 'convert' ? 'yaml' : 'json'} // Convert allows JSON or YAML input
                    theme={theme}
                    value={input}
                    onChange={(val) => setInput(val || '')}
                    onMount={(editor) => {
                      inputEditorRef.current = editor;
                    }}
                    onValidate={handleEditorValidation}
                    options={{
                      minimap: { enabled: false },
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                      fontSize: 13,
                      lineNumbers: 'on',
                      folding: true,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      padding: { top: 16 }
                    }}
                  />
                </div>
              </section>

              {/* Right Pane: Tree View / Output */}
              <section className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
                  <div className="flex gap-4">
                    <span className="text-blue-400 border-b border-blue-500 pb-1">{mode === 'query' ? 'QUERY RESULT' : 'PRETTY VIEW'}</span>
                  </div>
                  <div className="flex gap-2 text-[#808080]">
                    <button onClick={handleExpandAll} className="hover:text-[#E0E0E0] transition-colors"><ChevronDown className="h-3 w-3" /></button>
                    <button onClick={handleCollapseAll} className="hover:text-[#E0E0E0] transition-colors"><ChevronRight className="h-3 w-3" /></button>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#0F0F11]">
                   <Editor
                    height="100%"
                    language={mode === 'convert' ? (output.startsWith('{') || output.startsWith('[') ? 'json' : 'yaml') : 'json'}
                    theme={theme}
                    value={output}
                    onMount={(editor) => {
                      outputEditorRef.current = editor;
                    }}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                      fontSize: 13,
                      folding: true,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      padding: { top: 16 }
                    }}
                  />
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

