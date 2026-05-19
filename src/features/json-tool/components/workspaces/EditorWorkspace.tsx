import { useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import YAML from 'yaml';
import type { Mode, OutputLanguage, ThemeMode } from '../../types';

type StructuredLanguage = 'json' | 'yaml' | 'xml' | 'plaintext';

type MonacoEditor = any;

type ValueHint = {
  offset: number;
  path: string;
  typeLabel: string;
  detail?: string;
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

function inferScalarType(node: any): string {
  const value = node?.toJSON?.() ?? node?.value;

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return 'string';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  return 'unknown';
}

function inferNodeType(node: any): string {
  if (!node) {
    return 'unknown';
  }

  if (YAML.isSeq(node)) {
    return 'array';
  }

  if (YAML.isMap(node)) {
    return 'object';
  }

  return inferScalarType(node);
}

function inferArrayElementType(items: any[]): string {
  if (items.length === 0) {
    return 'empty';
  }

  const uniqueTypes = Array.from(new Set(items.map((item) => inferNodeType(item)))).sort();

  if (uniqueTypes.length === 1) {
    return uniqueTypes[0];
  }

  return `mixed:${uniqueTypes.join('|')}`;
}

function collectValueHints(content: string, language: StructuredLanguage): ValueHint[] {
  if (language === 'plaintext' || language === 'xml' || !content.trim()) {
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

    const hints: ValueHint[] = [];

    const visit = (node: any, path: string) => {
      if (!node) {
        return;
      }

      if (YAML.isSeq(node)) {
        const elementType = inferArrayElementType(node.items);
        hints.push({
          offset: Array.isArray(node.range) ? node.range[0] : 0,
          path,
          typeLabel: `array<${elementType}>`,
          detail: `items: ${node.items.length}`,
        });

        node.items.forEach((item: any, index: number) => {
          visit(item, `${path}[${index}]`);
        });
        return;
      }

      if (YAML.isMap(node)) {
        hints.push({
          offset: Array.isArray(node.range) ? node.range[0] : 0,
          path,
          typeLabel: 'object',
          detail: `keys: ${node.items.length}`,
        });

        node.items.forEach((pair: any) => {
          const key = getPairKey(pair?.key);
          visit(pair?.value, appendPath(path, key));
        });
        return;
      }

      hints.push({
        offset: Array.isArray(node.range) ? node.range[0] : 0,
        path,
        typeLabel: inferScalarType(node),
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

  const hints = collectValueHints(model.getValue(), language);
  const widgets: ArrayHintWidget[] = hints.map((hint, index) => {
    const lineNumber = model.getPositionAt(Math.max(0, hint.offset)).lineNumber;
    const maxColumn = model.getLineMaxColumn(lineNumber);
    const id = `array-hint-${language}-${lineNumber}-${index}`;
    const domNode = document.createElement('span');
    domNode.className = 'json-array-count-widget';
    domNode.textContent = ` ${hint.path} type: ${hint.typeLabel}${hint.detail ? ` ${hint.detail}` : ''}`;

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
  mode: Exclude<Mode, 'diff' | 'patch' | 'merge'>;
  theme: ThemeMode;
  input: string;
  output: string;
  outputLanguage: OutputLanguage;
  csvInputLooksLikeJson: boolean;
  showArrayHints: boolean;
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
  showArrayHints,
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
      ? 'INPUT_SOURCE.json'
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
      ? 'json'
      : mode === 'convertCsv'
        ? csvInputLooksLikeJson
          ? 'json'
          : 'plaintext'
        : mode === 'escape'
          ? 'plaintext'
          : 'json';
  const outputMonacoLanguage: StructuredLanguage = outputLanguage === 'plaintext' ? 'plaintext' : outputLanguage;

  const refreshInputDecorations = useCallback(() => {
    if (!showArrayHints) {
      removeArrayHintWidgets(inputEditorRef.current, inputWidgetsRef.current);
      inputWidgetsRef.current = [];
      return;
    }

    inputWidgetsRef.current = applyArrayCountWidgets(
      inputEditorRef.current,
      inputWidgetsRef.current,
      inputLanguage,
    );
  }, [inputLanguage, showArrayHints]);

  const refreshOutputDecorations = useCallback(() => {
    if (!showArrayHints) {
      removeArrayHintWidgets(outputEditorRef.current, outputWidgetsRef.current);
      outputWidgetsRef.current = [];
      return;
    }

    outputWidgetsRef.current = applyArrayCountWidgets(
      outputEditorRef.current,
      outputWidgetsRef.current,
      outputMonacoLanguage,
    );
  }, [outputMonacoLanguage, showArrayHints]);

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
      <section className="flex min-h-[240px] md:min-h-0 flex-col border-b border-[#262626] md:border-b-0 md:border-r">
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

      <section className="flex min-h-[240px] md:min-h-0 flex-col">
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
