import { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { JSONPath } from 'jsonpath-plus';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ThemeMode } from '../../types';

type JsonPathSegment = string | number;

type TreeExplorerWorkspaceProps = {
  theme: ThemeMode;
  input: string;
  onInputChange: (value: string) => void;
  onInputValidate: (markers: any[]) => void;
  onInputEditorMount: (editor: any) => void;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function escapePointerToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

function unescapePointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function toJsonPointer(segments: JsonPathSegment[]): string {
  if (segments.length === 0) return '';
  return `/${segments.map((segment) => escapePointerToken(String(segment))).join('/')}`;
}

function toJsonPath(segments: JsonPathSegment[]): string {
  if (segments.length === 0) return '$';

  return segments.reduce<string>((path, segment) => {
    if (typeof segment === 'number') {
      return `${path}[${segment}]`;
    }

    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment)) {
      return `${path}.${segment}`;
    }

    return `${path}[${JSON.stringify(segment)}]`;
  }, '$');
}

function getNodeAtSegments(root: unknown, segments: JsonPathSegment[]): unknown {
  let current = root;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      if (typeof segment !== 'number' || segment < 0 || segment >= current.length) {
        return undefined;
      }
      current = current[segment];
      continue;
    }

    if (!isObjectRecord(current) || typeof segment !== 'string' || !(segment in current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function parsePointerSegments(root: unknown, pointer: string): JsonPathSegment[] | null {
  if (pointer === '') {
    return [];
  }

  if (!pointer.startsWith('/')) {
    return null;
  }

  const tokens = pointer
    .split('/')
    .slice(1)
    .map((token) => unescapePointerToken(token));

  let current = root;
  const segments: JsonPathSegment[] = [];

  for (const token of tokens) {
    if (Array.isArray(current)) {
      if (!/^\d+$/.test(token)) {
        return null;
      }

      const index = Number(token);
      if (index < 0 || index >= current.length) {
        return null;
      }

      segments.push(index);
      current = current[index];
      continue;
    }

    if (!isObjectRecord(current) || !(token in current)) {
      return null;
    }

    segments.push(token);
    current = current[token];
  }

  return segments;
}

function resolvePathInput(root: unknown, rawPathInput: string): JsonPathSegment[] | null {
  const trimmed = rawPathInput.trim();
  if (!trimmed || trimmed === '$') {
    return [];
  }

  if (trimmed.startsWith('/')) {
    return parsePointerSegments(root, trimmed);
  }

  if (trimmed.startsWith('$')) {
    try {
      const pointers = JSONPath({
        path: trimmed,
        json: root as any,
        resultType: 'pointer',
        wrap: true,
      }) as unknown;

      if (!Array.isArray(pointers)) {
        return null;
      }

      const firstPointer = pointers[0];

      if (typeof firstPointer !== 'string') {
        return null;
      }

      return parsePointerSegments(root, firstPointer);
    } catch {
      return null;
    }
  }

  return null;
}

function getPreviewText(value: unknown): string {
  if (value === null) return 'null';

  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }

  if (isObjectRecord(value)) {
    return `Object(${Object.keys(value).length})`;
  }

  if (typeof value === 'string') {
    const compact = JSON.stringify(value);
    return compact.length > 70 ? `${compact.slice(0, 70)}...` : compact;
  }

  return String(value);
}

function stringifyForInspector(value: unknown): string {
  try {
    const serialized = JSON.stringify(value, null, 2);
    if (!serialized) return String(value);
    return serialized.length > 4_000 ? `${serialized.slice(0, 4_000)}\n...` : serialized;
  } catch {
    return String(value);
  }
}

function collectContainerPointers(
  value: unknown,
  currentSegments: JsonPathSegment[] = [],
  result: string[] = [],
): string[] {
  if (!Array.isArray(value) && !isObjectRecord(value)) {
    return result;
  }

  result.push(toJsonPointer(currentSegments));

  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      collectContainerPointers(child, [...currentSegments, index], result);
    });
    return result;
  }

  Object.entries(value).forEach(([key, child]) => {
    collectContainerPointers(child, [...currentSegments, key], result);
  });
  return result;
}

function getSegmentLabel(segment: JsonPathSegment): string {
  return typeof segment === 'number' ? `[${segment}]` : segment;
}

export function TreeExplorerWorkspace({
  theme,
  input,
  onInputChange,
  onInputValidate,
  onInputEditorMount,
}: TreeExplorerWorkspaceProps) {
  const parsed = useMemo(() => {
    try {
      if (!input.trim()) {
        return {
          value: undefined as unknown,
          error: null as string | null,
          isEmpty: true,
        };
      }

      return {
        value: JSON.parse(input) as unknown,
        error: null as string | null,
        isEmpty: false,
      };
    } catch (error: any) {
      return {
        value: undefined as unknown,
        error: error.message as string,
        isEmpty: false,
      };
    }
  }, [input]);

  const [selectedSegments, setSelectedSegments] = useState<JsonPathSegment[]>([]);
  const [expandedPointers, setExpandedPointers] = useState<Set<string>>(() => new Set(['']));
  const [pathInput, setPathInput] = useState<string>('$');
  const [pathError, setPathError] = useState<string | null>(null);

  const selectedValue = useMemo(() => {
    if (parsed.error || parsed.isEmpty) return undefined;
    return getNodeAtSegments(parsed.value, selectedSegments);
  }, [parsed.error, parsed.isEmpty, parsed.value, selectedSegments]);

  const selectedPointer = toJsonPointer(selectedSegments);
  const selectedJsonPath = toJsonPath(selectedSegments);
  const selectedType = selectedValue === undefined ? '-' : getValueType(selectedValue);

  const selectedSizeLabel = useMemo(() => {
    if (Array.isArray(selectedValue)) {
      return `${selectedValue.length} items`;
    }

    if (isObjectRecord(selectedValue)) {
      return `${Object.keys(selectedValue).length} keys`;
    }

    return '-';
  }, [selectedValue]);

  const allContainerPointers = useMemo(() => {
    if (parsed.error || parsed.isEmpty) {
      return [''];
    }
    return collectContainerPointers(parsed.value);
  }, [parsed.error, parsed.isEmpty, parsed.value]);

  useEffect(() => {
    if (parsed.error || parsed.isEmpty) {
      return;
    }

    const node = getNodeAtSegments(parsed.value, selectedSegments);
    if (node === undefined) {
      setSelectedSegments([]);
      return;
    }

    setExpandedPointers((previous) => {
      const nextExpanded = new Set(previous);
      nextExpanded.add('');
      for (let depth = 1; depth <= selectedSegments.length; depth += 1) {
        nextExpanded.add(toJsonPointer(selectedSegments.slice(0, depth)));
      }

      if (nextExpanded.size === previous.size) {
        let unchanged = true;
        for (const pointer of nextExpanded) {
          if (!previous.has(pointer)) {
            unchanged = false;
            break;
          }
        }
        if (unchanged) {
          return previous;
        }
      }

      return nextExpanded;
    });
  }, [parsed.error, parsed.isEmpty, parsed.value, selectedSegments]);

  useEffect(() => {
    setPathInput(selectedPointer || '$');
  }, [selectedPointer]);

  const handleSelectByPathInput = useCallback(() => {
    if (parsed.error || parsed.isEmpty) {
      setPathError('Input JSON chưa hợp lệ.');
      return;
    }

    const resolvedSegments = resolvePathInput(parsed.value, pathInput);
    if (!resolvedSegments) {
      setPathError('Path không hợp lệ hoặc không tìm thấy node.');
      return;
    }

    setPathError(null);
    setSelectedSegments(resolvedSegments);
  }, [parsed.error, parsed.isEmpty, parsed.value, pathInput]);

  const renderTreeNode = useCallback(
    (value: unknown, segments: JsonPathSegment[], depth: number) => {
      const pointer = toJsonPointer(segments);
      const nodeType = getValueType(value);
      const isContainer = Array.isArray(value) || isObjectRecord(value);
      const isExpanded = expandedPointers.has(pointer);
      const isSelected = pointer === selectedPointer;
      const nodeLabel = segments.length === 0 ? '$' : getSegmentLabel(segments[segments.length - 1]);

      const children = Array.isArray(value)
        ? value.map((child, index) => ({
            key: index,
            child,
            nextSegments: [...segments, index] as JsonPathSegment[],
          }))
        : isObjectRecord(value)
          ? Object.entries(value).map(([key, child]) => ({
              key,
              child,
              nextSegments: [...segments, key] as JsonPathSegment[],
            }))
          : [];

      return (
        <div key={pointer || '$'} className="text-xs">
          <div
            className={`flex items-center gap-1.5 rounded px-2 py-1 cursor-pointer ${
              isSelected
                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-200'
                : 'text-[#334155] dark:text-[#D0D0D0] hover:bg-[#EEF2F7] dark:hover:bg-[#1D1D20]'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            onClick={() => {
              setPathError(null);
              setSelectedSegments(segments);
            }}
          >
            {isContainer ? (
              <button
                type="button"
                className="flex h-4 w-4 items-center justify-center text-[#64748B] dark:text-[#7F8792] hover:text-[#334155] dark:hover:text-[#D0D0D0]"
                onClick={(event) => {
                  event.stopPropagation();
                  setExpandedPointers((previous) => {
                    const next = new Set(previous);
                    if (next.has(pointer)) {
                      next.delete(pointer);
                    } else {
                      next.add(pointer);
                    }
                    return next;
                  });
                }}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            ) : (
              <span className="block h-4 w-4" />
            )}

            <span className="font-mono text-[11px] text-[#6B7280] dark:text-[#9AA0A6]">{nodeLabel}</span>
            <span className="text-[10px] uppercase tracking-wide text-[#6B7280] dark:text-[#6F7780]">{nodeType}</span>
            <span className="truncate text-[11px] text-[#B8BDC7]">{getPreviewText(value)}</span>
          </div>

          {isContainer && isExpanded && (
            <div>
              {children.map(({ key, child, nextSegments }) => (
                <div key={String(key)}>{renderTreeNode(child, nextSegments, depth + 1)}</div>
              ))}
            </div>
          )}
        </div>
      );
    },
    [expandedPointers, selectedPointer],
  );

  return (
    <>
      <section className="flex min-h-[260px] md:min-h-0 flex-col border-b border-[#D8DEE6] dark:border-[#262626] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
          <span>JSON_INPUT</span>
          <span>UTF-8</span>
        </div>
        <div className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11]">
          <Editor
            height="100%"
            language="json"
            theme={theme}
            value={input}
            onChange={(value) => onInputChange(value || '')}
            onValidate={onInputValidate}
            onMount={onInputEditorMount}
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

      <section className="flex min-h-[260px] md:min-h-0 flex-col bg-[#F7F8FA] dark:bg-[#0F0F11]">
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-[#FFFFFF] dark:bg-[#121214] text-[10px] font-mono text-[#6B7280] dark:text-[#606060] border-b border-[#D8DEE6] dark:border-[#262626]">
          <span className="text-blue-400 border-b border-blue-500 pb-1">TREE_EXPLORER + PATH_INSPECTOR</span>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded border border-[#C7D0DB] dark:border-[#333] hover:border-blue-500 text-[#6B7280] dark:text-[#9AA0A6]"
              onClick={() => setExpandedPointers(new Set(allContainerPointers))}
            >
              Expand All
            </button>
            <button
              className="px-2 py-1 rounded border border-[#C7D0DB] dark:border-[#333] hover:border-blue-500 text-[#6B7280] dark:text-[#9AA0A6]"
              onClick={() => setExpandedPointers(new Set(['']))}
            >
              Collapse
            </button>
          </div>
        </div>

        {parsed.error ? (
          <div className="p-4 text-xs text-red-400 font-mono">Parse Error: {parsed.error}</div>
        ) : parsed.isEmpty ? (
          <div className="p-4 text-xs text-[#6B7280] dark:text-[#808080]">Nhập JSON để xem tree explorer.</div>
        ) : (
          <>
            <div className="flex-1 min-h-[180px] overflow-auto p-2">{renderTreeNode(parsed.value, [], 0)}</div>
            <aside className="border-t border-[#D8DEE6] dark:border-[#262626] bg-[#FFFFFF] dark:bg-[#121214] p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={pathInput}
                  onChange={(event) => setPathInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSelectByPathInput();
                    }
                  }}
                  className="flex-1 bg-[#F7F8FA] dark:bg-[#0F0F11] border border-[#C7D0DB] dark:border-[#333] rounded px-2.5 py-1.5 text-xs font-mono text-[#1F2937] dark:text-[#E0E0E0] outline-none focus:border-blue-500"
                  placeholder="Nhập JSON Pointer (/a/0/b) hoặc JSONPath ($.a[0].b)"
                />
                <button
                  onClick={handleSelectByPathInput}
                  className="px-3 py-1.5 text-xs rounded border border-blue-500 bg-blue-500/10 text-blue-300"
                >
                  Go
                </button>
              </div>

              {pathError && <div className="text-[11px] text-red-400">{pathError}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="rounded border border-[#D0D7E2] dark:border-[#2F2F31] bg-[#F5F6F8] dark:bg-[#17171A] px-2 py-1.5">
                  <div className="text-[#64748B] dark:text-[#7F8792] mb-0.5">JSONPath</div>
                  <div className="font-mono text-[#334155] dark:text-[#D0D0D0] break-all">{selectedJsonPath}</div>
                </div>
                <div className="rounded border border-[#D0D7E2] dark:border-[#2F2F31] bg-[#F5F6F8] dark:bg-[#17171A] px-2 py-1.5">
                  <div className="text-[#64748B] dark:text-[#7F8792] mb-0.5">JSON Pointer</div>
                  <div className="font-mono text-[#334155] dark:text-[#D0D0D0] break-all">{selectedPointer || '/'}</div>
                </div>
                <div className="rounded border border-[#D0D7E2] dark:border-[#2F2F31] bg-[#F5F6F8] dark:bg-[#17171A] px-2 py-1.5">
                  <div className="text-[#64748B] dark:text-[#7F8792] mb-0.5">Type</div>
                  <div className="font-mono text-[#334155] dark:text-[#D0D0D0]">{selectedType}</div>
                </div>
                <div className="rounded border border-[#D0D7E2] dark:border-[#2F2F31] bg-[#F5F6F8] dark:bg-[#17171A] px-2 py-1.5">
                  <div className="text-[#64748B] dark:text-[#7F8792] mb-0.5">Depth / Size</div>
                  <div className="font-mono text-[#334155] dark:text-[#D0D0D0]">
                    {selectedSegments.length} / {selectedSizeLabel}
                  </div>
                </div>
              </div>

              <div className="rounded border border-[#D0D7E2] dark:border-[#2F2F31] bg-[#F5F6F8] dark:bg-[#17171A] p-2">
                <div className="text-[#64748B] dark:text-[#7F8792] text-[11px] mb-1">Node Value</div>
                <pre className="text-[11px] text-[#334155] dark:text-[#D0D0D0] font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">
                  {stringifyForInspector(selectedValue)}
                </pre>
              </div>
            </aside>
          </>
        )}
      </section>
    </>
  );
}
