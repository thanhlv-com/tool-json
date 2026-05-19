import { useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import YAML from 'yaml';
import type { Mode, OutputLanguage, ThemeMode } from './types';

type StructuredLanguage = 'json' | 'yaml' | 'plaintext';

type MonacoEditor = any;

type ArrayHint = {
  offset: number;
  path: string;
  length: number;
};

type ArrayHintWidget = {
  id: string;
  getId: () => string;
  getDomNode: () => HTMLElement;
  getPosition: () => {
    position: {
      lineNumber: number;
      column: number;
    };
    preference: number[];
  };
};

function isIdentifierSegment(segment: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment);
}

function appendPath(path: string, segment: string): string {
  if (isIdentifierSegment(segment)) {
    return `${path}.${segment}`;
  }
  return `${path}[${JSON.stringify(segment)}]`;
}

function getPairKey(pairKey: any): string {
  const keyValue = pairKey?.toJSON?.() ?? pairKey?.value;
  if (typeof keyValue === 'string' || typeof keyValue === 'number' || typeof keyValue === 'boolean') {
    return String(keyValue);
  }
  return String(pairKey?.value ?? pairKey?.toString?.() ?? 'unknown');
}

function collectArrayHints(content: string, language: StructuredLanguage): ArrayHint[] {
  if (language === 'plaintext' || !content.trim()) {
    return [];
  }

  try {
    const document = YAML.parseDocument(content, {
      uniqueKeys: false,
      prettyErrors: false,
    });

    if (document.errors.length > 0) {
      return [];
    }

    const hints: ArrayHint[] = [];

    const visit = (node: any, path: string) => {
      if (!node) {
        return;
      }

      if (YAML.isSeq(node)) {
        hints.push({
          offset: Array.isArray(node.range) ? node.range[0] : 0,
          path,
          length: node.items.length,
        });

        node.items.forEach((item: any, index: number) => {
          visit(item, `${path}[${index}]`);
        });
        return;
      }

      if (!YAML.isMap(node)) {
        return;
      }

      node.items.forEach((pair: any) => {
        const key = getPairKey(pair?.key);
        visit(pair?.value, appendPath(path, key));
      });
    };

    visit(document.contents, '$');
    return hints;
  } catch {
    return [];
  }
}

function removeArrayHintWidgets(editor: MonacoEditor | null, widgets: ArrayHintWidget[]): void {
  if (!editor) {
    return;
  }

  widgets.forEach((widget) => {
    editor.removeContentWidget(widget);
  });
}

function applyArrayCountWidgets(
  editor: MonacoEditor | null,
  previousWidgets: ArrayHintWidget[],
  language: StructuredLanguage,
): ArrayHintWidget[] {
  if (!editor) {
    return previousWidgets;
  }

  const model = editor.getModel();
  if (!model) {
    return previousWidgets;
  }

  removeArrayHintWidgets(editor, previousWidgets);

  const hints = collectArrayHints(model.getValue(), language);
  const widgets: ArrayHintWidget[] = hints.map((hint, index) => {
    const lineNumber = model.getPositionAt(Math.max(0, hint.offset)).lineNumber;
    const maxColumn = model.getLineMaxColumn(lineNumber);
    const id = `array-hint-${language}-${lineNumber}-${index}`;
    const domNode = document.createElement('span');
    domNode.className = 'json-array-count-widget';
    domNode.textContent = ` ${hint.path} items: ${hint.length}`;

    const widget: ArrayHintWidget = {
      id,
      getId: () => id,
      getDomNode: () => domNode,
      getPosition: () => ({
        position: {
          lineNumber,
          column: maxColumn,
        },
        // EXACT = 0 in Monaco ContentWidgetPositionPreference
        preference: [0],
      }),
    };

    editor.addContentWidget(widget);
    return widget;
  });

  return widgets;
}

type EditorWorkspaceProps = {
  mode: Exclude<Mode, 'diff'>;
  theme: ThemeMode;
  input: string;
  output: string;
  outputLanguage: OutputLanguage;
  csvInputLooksLikeJson: boolean;
  onInputChange: (value: string) => void;
  onInputValidate: (markers: any[]) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onInputEditorMount: (editor: any) => void;
  onOutputEditorMount: (editor: any) => void;
};

export function EditorWorkspace({
  mode,
  theme,
  input,
  output,
  outputLanguage,
  csvInputLooksLikeJson,
  onInputChange,
  onInputValidate,
  onExpandAll,
  onCollapseAll,
  onInputEditorMount,
  onOutputEditorMount,
}: EditorWorkspaceProps) {
  const inputEditorRef = useRef<MonacoEditor | null>(null);
  const outputEditorRef = useRef<MonacoEditor | null>(null);
  const inputWidgetsRef = useRef<ArrayHintWidget[]>([]);
  const outputWidgetsRef = useRef<ArrayHintWidget[]>([]);

  const leftLabel =
    mode === 'convert'
      ? 'INPUT_SOURCE.yml/json'
      : mode === 'schemaGenerate'
        ? 'SAMPLE_JSON'
        : mode === 'convertCsv'
          ? 'INPUT.json/csv'
          : mode === 'escape'
            ? 'RAW_TEXT_OR_JSON_STRING'
            : 'INPUT_SOURCE.json';
  const rightLabel =
    mode === 'query'
      ? 'QUERY RESULT'
      : mode === 'schemaGenerate'
        ? 'GENERATED_SCHEMA'
        : mode === 'convertCsv'
          ? 'CONVERT_RESULT'
          : mode === 'escape'
            ? 'ESCAPE_RESULT'
            : 'PRETTY VIEW';
  const inputLanguage: StructuredLanguage =
    mode === 'convert'
      ? 'yaml'
      : mode === 'convertCsv'
        ? csvInputLooksLikeJson
          ? 'json'
          : 'plaintext'
        : mode === 'escape'
          ? 'plaintext'
          : 'json';
  const outputMonacoLanguage: StructuredLanguage = outputLanguage === 'plaintext' ? 'plaintext' : outputLanguage;

  const refreshInputDecorations = useCallback(() => {
    inputWidgetsRef.current = applyArrayCountWidgets(
      inputEditorRef.current,
      inputWidgetsRef.current,
      inputLanguage,
    );
  }, [inputLanguage]);

  const refreshOutputDecorations = useCallback(() => {
    outputWidgetsRef.current = applyArrayCountWidgets(
      outputEditorRef.current,
      outputWidgetsRef.current,
      outputMonacoLanguage,
    );
  }, [outputMonacoLanguage]);

  useEffect(() => {
    refreshInputDecorations();
  }, [input, refreshInputDecorations]);

  useEffect(() => {
    refreshOutputDecorations();
  }, [output, refreshOutputDecorations]);

  useEffect(
    () => () => {
      removeArrayHintWidgets(inputEditorRef.current, inputWidgetsRef.current);
      removeArrayHintWidgets(outputEditorRef.current, outputWidgetsRef.current);
    },
    [],
  );

  return (
    <>
      <section className="flex flex-col border-r border-[#262626]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#121214] text-[10px] font-mono text-[#606060] border-b border-[#262626]">
          <span>{leftLabel}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language={inputLanguage}
            theme={theme}
            value={input}
            onChange={(value) => onInputChange(value || '')}
            onMount={(editor) => {
              inputEditorRef.current = editor;
              onInputEditorMount(editor);
              refreshInputDecorations();
              setTimeout(refreshInputDecorations, 0);
              setTimeout(refreshInputDecorations, 80);
            }}
            onValidate={onInputValidate}
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
          <div className="flex gap-4">
            <span className="text-blue-400 border-b border-blue-500 pb-1">{rightLabel}</span>
          </div>
          <div className="flex gap-2 text-[#808080]">
            <button onClick={onExpandAll} className="hover:text-[#E0E0E0] transition-colors">
              <ChevronDown className="h-3 w-3" />
            </button>
            <button onClick={onCollapseAll} className="hover:text-[#E0E0E0] transition-colors">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#0F0F11]">
          <Editor
            height="100%"
            language={outputMonacoLanguage}
            theme={theme}
            value={output}
            onMount={(editor) => {
              outputEditorRef.current = editor;
              onOutputEditorMount(editor);
              refreshOutputDecorations();
              setTimeout(refreshOutputDecorations, 0);
              setTimeout(refreshOutputDecorations, 80);
            }}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13,
              folding: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      </section>
    </>
  );
}
