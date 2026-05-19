import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JSONPath } from 'jsonpath-plus';
import YAML from 'yaml';
import type {
  ConvertSourceFormat,
  ConvertTargetFormat,
  CsvOptions,
  ErrorStatus,
  Mode,
  OutputLanguage,
  ProcessAction,
  SchemaDraft,
  SchemaValidationIssue,
  ThemeMode,
} from './types';
import {
  applyJsonPatchOperations,
  convertCsvToJson,
  convertJsonToProperties,
  convertJsonToCsv,
  convertJsonToXml,
  escapeOrUnescapeJsonString,
  generateJsonDiffReport,
  generateJsonPatchOperations,
  generateJsonSchemaFromSample,
  type JsonDiffReport,
  validateJsonBySchema,
} from './utils';

type MonacoMarker = {
  severity: number;
  startLineNumber: number;
  startColumn: number;
  message: string;
};

const STORAGE_KEY = 'json-dev-tool.state.v2';

const DEFAULT_JSON_INPUT =
  '{\n  "tool": "JSON Dev Tool",\n  "version": 1.0,\n  "features": [\n    "Format",\n    "Validate",\n    "Diff",\n    "Query",\n    "YAML"\n  ],\n  "is_awesome": true\n}';
const DEFAULT_SCHEMA_INPUT =
  '{\n  "type": "object",\n  "properties": {\n    "tool": { "type": "string" },\n    "version": { "type": "number" }\n  },\n  "required": ["tool", "version"],\n  "additionalProperties": true\n}';
const DEFAULT_PATCH_BASE_INPUT = '{\n  "status": "ok",\n  "code": 200\n}';
const DEFAULT_PATCH_TARGET_INPUT = '{\n  "status": "error",\n  "code": 500,\n  "message": "Failed"\n}';
const DEFAULT_PATCH_OPERATIONS_INPUT =
  '[\n  {\n    "op": "replace",\n    "path": "/status",\n    "value": "error"\n  },\n  {\n    "op": "replace",\n    "path": "/code",\n    "value": 500\n  }\n]';

const DEFAULT_CSV_OPTIONS: CsvOptions = {
  delimiter: ',',
  hasHeaderRow: true,
  quoteStrategy: 'auto',
  escapeStrategy: 'double',
};

type InputMode = Exclude<Mode, 'diff' | 'patch'>;

const INPUT_MODES: InputMode[] = ['format', 'query', 'convert', 'schemaGenerate', 'schemaValidate', 'convertCsv', 'escape'];
const ALL_MODES: Mode[] = ['format', 'diff', 'query', 'convert', 'schemaGenerate', 'schemaValidate', 'convertCsv', 'escape', 'patch'];

type PersistedState = {
  version: 2;
  sharedInput: string;
  inputByMode: Record<InputMode, string>;
  syncInputAcrossModes: boolean;
  showArrayHints: boolean;
  schemaInput: string;
  output: string;
  outputLanguage: OutputLanguage;
  convertSourceFormat: ConvertSourceFormat;
  convertTargetFormat: ConvertTargetFormat;
  diffOriginal: string;
  diffModified: string;
  jsonPath: string;
  theme: ThemeMode;
  csvOptions: CsvOptions;
  schemaDraft: SchemaDraft;
  schemaCustomKeywordsInput: string;
  patchBaseInput: string;
  patchTargetInput: string;
  patchOperationsInput: string;
  lastMode: Mode;
};

function createDefaultInputByMode(value: string): Record<InputMode, string> {
  return INPUT_MODES.reduce(
    (result, inputMode) => {
      result[inputMode] = value;
      return result;
    },
    {} as Record<InputMode, string>,
  );
}

function createDefaultPersistedState(): PersistedState {
  return {
    version: 2,
    sharedInput: DEFAULT_JSON_INPUT,
    inputByMode: createDefaultInputByMode(DEFAULT_JSON_INPUT),
    syncInputAcrossModes: true,
    showArrayHints: true,
    schemaInput: DEFAULT_SCHEMA_INPUT,
    output: '',
    outputLanguage: 'json',
    convertSourceFormat: null,
    convertTargetFormat: 'yaml',
    diffOriginal: DEFAULT_PATCH_BASE_INPUT,
    diffModified: DEFAULT_PATCH_TARGET_INPUT,
    jsonPath: '$.features',
    theme: 'vs-dark',
    csvOptions: DEFAULT_CSV_OPTIONS,
    schemaDraft: 'draft-07',
    schemaCustomKeywordsInput: '',
    patchBaseInput: DEFAULT_PATCH_BASE_INPUT,
    patchTargetInput: DEFAULT_PATCH_TARGET_INPUT,
    patchOperationsInput: DEFAULT_PATCH_OPERATIONS_INPUT,
    lastMode: 'format',
  };
}

function isLikelyJsonInput(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

function loadPersistedState(): PersistedState {
  const defaults = createDefaultPersistedState();

  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const inputByMode = {
      ...defaults.inputByMode,
      ...(parsed.inputByMode ?? {}),
    };
    const csvOptions = {
      ...defaults.csvOptions,
      ...(parsed.csvOptions ?? {}),
    };

    const lastMode = parsed.lastMode && ALL_MODES.includes(parsed.lastMode) ? parsed.lastMode : 'format';
    const convertTargetFormat =
      parsed.convertTargetFormat &&
      ['json', 'yaml', 'xml', 'properties'].includes(parsed.convertTargetFormat)
        ? (parsed.convertTargetFormat as ConvertTargetFormat)
        : defaults.convertTargetFormat;

    return {
      ...defaults,
      ...parsed,
      inputByMode,
      csvOptions,
      convertTargetFormat,
      version: 2,
      lastMode,
    };
  } catch {
    return defaults;
  }
}

export function getPersistedLastMode(): Mode | null {
  const persisted = loadPersistedState();
  return persisted.lastMode ?? null;
}

export function useJsonToolState(mode: Mode) {
  const initialState = useMemo(() => loadPersistedState(), []);

  const [sharedInput, setSharedInput] = useState<string>(initialState.sharedInput);
  const [inputByMode, setInputByMode] = useState<Record<InputMode, string>>(initialState.inputByMode);
  const [syncInputAcrossModes, setSyncInputAcrossModesState] = useState<boolean>(initialState.syncInputAcrossModes);
  const [showArrayHints, setShowArrayHints] = useState<boolean>(initialState.showArrayHints);
  const [schemaInput, setSchemaInput] = useState<string>(initialState.schemaInput);
  const [output, setOutput] = useState<string>(initialState.output);
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>(initialState.outputLanguage);
  const [convertSourceFormat, setConvertSourceFormat] = useState<ConvertSourceFormat>(initialState.convertSourceFormat);
  const [convertTargetFormat, setConvertTargetFormat] = useState<ConvertTargetFormat>(initialState.convertTargetFormat);
  const [diffOriginal, setDiffOriginal] = useState<string>(initialState.diffOriginal);
  const [diffModified, setDiffModified] = useState<string>(initialState.diffModified);
  const [diffReport, setDiffReport] = useState<JsonDiffReport | null>(null);
  const [diffParseError, setDiffParseError] = useState<string | null>(null);
  const [jsonPath, setJsonPath] = useState<string>(initialState.jsonPath);
  const [theme, setTheme] = useState<ThemeMode>(initialState.theme);
  const [errorStatus, setErrorStatus] = useState<ErrorStatus>(null);
  const [csvOptions, setCsvOptions] = useState<CsvOptions>(initialState.csvOptions);
  const [schemaDraft, setSchemaDraft] = useState<SchemaDraft>(initialState.schemaDraft);
  const [schemaCustomKeywordsInput, setSchemaCustomKeywordsInput] = useState<string>(initialState.schemaCustomKeywordsInput);
  const [schemaValidationIssues, setSchemaValidationIssues] = useState<SchemaValidationIssue[]>([]);

  const [patchBaseInput, setPatchBaseInput] = useState<string>(initialState.patchBaseInput);
  const [patchTargetInput, setPatchTargetInput] = useState<string>(initialState.patchTargetInput);
  const [patchOperationsInput, setPatchOperationsInput] = useState<string>(initialState.patchOperationsInput);

  const inputEditorRef = useRef<any>(null);
  const outputEditorRef = useRef<any>(null);
  const schemaEditorRef = useRef<any>(null);
  const inputMode: InputMode = mode === 'diff' || mode === 'patch' ? 'format' : mode;
  const input = syncInputAcrossModes ? sharedInput : inputByMode[inputMode];
  const csvInputLooksLikeJson = mode === 'convertCsv' && isLikelyJsonInput(input);

  const setInput = useCallback(
    (value: string) => {
      if (syncInputAcrossModes) {
        setSharedInput(value);
      } else {
        setInputByMode((previous) => ({
          ...previous,
          [inputMode]: value,
        }));
      }
    },
    [inputMode, syncInputAcrossModes],
  );

  const setSyncInputAcrossModes = useCallback(
    (nextValue: boolean) => {
      if (nextValue) {
        setSharedInput(inputByMode[inputMode]);
      } else {
        setInputByMode(createDefaultInputByMode(sharedInput));
      }
      setSyncInputAcrossModesState(nextValue);
    },
    [inputByMode, inputMode, sharedInput],
  );

  useEffect(() => {
    if (!syncInputAcrossModes) {
      return;
    }

    setInputByMode((previous) => {
      const allModesAlreadySynced = INPUT_MODES.every((inputModeKey) => previous[inputModeKey] === sharedInput);
      if (allModesAlreadySynced) {
        return previous;
      }

      return createDefaultInputByMode(sharedInput);
    });
  }, [sharedInput, syncInputAcrossModes]);

  const processJson = useCallback(
    (action: ProcessAction = 'format', customInput = input) => {
      setErrorStatus(null);

      if (mode !== 'schemaValidate') {
        setSchemaValidationIssues([]);
      }

      if (!customInput.trim()) {
        setOutput('');
        return;
      }

      try {
        if (mode === 'convert') {
          let parsed: any;
          let sourceFormat: ConvertSourceFormat = null;

          try {
            parsed = JSON.parse(customInput);
            sourceFormat = 'json';
          } catch {
            parsed = YAML.parse(customInput);
            sourceFormat = 'yaml';
          }

          setConvertSourceFormat(sourceFormat);
          const sourceLabel = sourceFormat === 'json' ? 'JSON' : 'YAML';
          let targetLabel = '';

          if (convertTargetFormat === 'json') {
            targetLabel = 'JSON';
            setOutputLanguage('json');
            if (action === 'minify') {
              setOutput(JSON.stringify(parsed));
            } else {
              setOutput(JSON.stringify(parsed, null, 2));
            }
          } else if (convertTargetFormat === 'yaml') {
            targetLabel = 'YAML';
            setOutputLanguage('yaml');
            if (action === 'minify') {
              setOutput(
                YAML.stringify(parsed, {
                  collectionStyle: 'flow',
                  flowCollectionPadding: false,
                  lineWidth: 0,
                  minContentWidth: 0,
                  simpleKeys: true,
                }),
              );
            } else {
              setOutput(YAML.stringify(parsed));
            }
          } else if (convertTargetFormat === 'xml') {
            targetLabel = 'XML';
            setOutputLanguage('xml');
            setOutput(
              convertJsonToXml(parsed, {
                pretty: action !== 'minify',
                rootName: 'root',
              }),
            );
          } else {
            targetLabel = 'Properties';
            setOutputLanguage('plaintext');
            setOutput(convertJsonToProperties(parsed));
          }

          if (action === 'validate') {
            setErrorStatus({ message: `Valid ${sourceLabel} (Converted to ${targetLabel})`, isError: false });
          } else if (action === 'minify') {
            setErrorStatus({ message: `Converted ${sourceLabel} to ${targetLabel} (Minified)`, isError: false });
          } else {
            setErrorStatus({ message: `Converted ${sourceLabel} to ${targetLabel}`, isError: false });
          }
          return;
        }

        if (mode === 'query') {
          setConvertSourceFormat(null);
          setOutputLanguage('json');
          const parsed = JSON.parse(customInput);

          try {
            const result = JSONPath({ path: jsonPath, json: parsed });
            setOutput(JSON.stringify(result, null, 2));
            setErrorStatus({ message: `Query matched ${result?.length || 0} items`, isError: false });
          } catch (error: any) {
            setErrorStatus({ message: `Invalid JSONPath: ${error.message}`, isError: true });
          }

          return;
        }

        if (mode === 'schemaGenerate') {
          setConvertSourceFormat(null);
          setOutputLanguage('json');
          const parsed = JSON.parse(customInput);
          const schema = generateJsonSchemaFromSample(parsed);
          setOutput(JSON.stringify(schema, null, 2));
          setErrorStatus({ message: 'Generated JSON Schema', isError: false });
          return;
        }

        if (mode === 'schemaValidate') {
          setConvertSourceFormat(null);
          setOutputLanguage('json');

          const data = JSON.parse(customInput);
          const schema = JSON.parse(schemaInput);
          const customKeywords = schemaCustomKeywordsInput
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean);

          const result = validateJsonBySchema(data, schema, {
            draft: schemaDraft,
            customKeywords,
          });

          const normalizedErrors = result.errors.map((error) => ({
            path: error.instancePath || '/',
            message: error.message ?? 'Validation error',
            keyword: error.keyword,
          }));

          setSchemaValidationIssues(normalizedErrors);
          setOutput(
            JSON.stringify(
              {
                valid: result.valid,
                draft: schemaDraft,
                customKeywords,
                errorCount: normalizedErrors.length,
                errors: normalizedErrors,
              },
              null,
              2,
            ),
          );

          if (result.valid) {
            setErrorStatus({ message: `JSON is valid for schema (${schemaDraft})`, isError: false });
          } else {
            const firstPath = normalizedErrors[0]?.path ?? '/';
            setErrorStatus({
              message: `JSON is invalid (${normalizedErrors.length} errors, first path: ${firstPath})`,
              isError: true,
            });
          }

          return;
        }

        if (mode === 'convertCsv') {
          setConvertSourceFormat(null);
          const customInputLooksLikeJson = isLikelyJsonInput(customInput);

          if (customInputLooksLikeJson) {
            const parsed = JSON.parse(customInput);
            const csv = convertJsonToCsv(parsed, csvOptions);
            setOutput(csv);
            setOutputLanguage('plaintext');
            setErrorStatus({
              message: action === 'validate' ? 'Valid JSON (Converted to CSV)' : 'Converted JSON to CSV',
              isError: false,
            });
          } else {
            const json = convertCsvToJson(customInput, csvOptions);
            setOutputLanguage('json');

            if (action === 'minify') {
              setOutput(JSON.stringify(json));
            } else {
              setOutput(JSON.stringify(json, null, 2));
            }

            setErrorStatus({ message: 'Converted CSV to JSON', isError: false });
          }

          return;
        }

        if (mode === 'escape') {
          setConvertSourceFormat(null);
          const result = escapeOrUnescapeJsonString(customInput);
          setOutput(result.output);
          setOutputLanguage(result.outputLanguage);
          setErrorStatus({ message: result.message, isError: false });
          return;
        }

        if (mode === 'patch' || mode === 'diff') {
          return;
        }

        setConvertSourceFormat(null);
        setOutputLanguage('json');

        const parsed = JSON.parse(customInput);

        if (action === 'minify') {
          setOutput(JSON.stringify(parsed));
          setErrorStatus({ message: 'Valid JSON (Minified)', isError: false });
          return;
        }

        if (action === 'validate') {
          setErrorStatus({ message: 'Valid JSON', isError: false });
          setOutput(JSON.stringify(parsed, null, 2));
          return;
        }

        setOutput(JSON.stringify(parsed, null, 2));
        setErrorStatus({ message: 'Valid JSON (Formatted)', isError: false });
      } catch (error: any) {
        if (mode === 'schemaValidate') {
          setSchemaValidationIssues([]);
        }
        setErrorStatus({ message: `Parse Error: ${error.message}`, isError: true });
      }
    },
    [convertTargetFormat, csvOptions, input, jsonPath, mode, schemaCustomKeywordsInput, schemaDraft, schemaInput],
  );

  const handleGeneratePatch = useCallback(() => {
    try {
      const original = JSON.parse(patchBaseInput);
      const modified = JSON.parse(patchTargetInput);
      const operations = generateJsonPatchOperations(original, modified);

      setPatchOperationsInput(JSON.stringify(operations, null, 2));
      setOutput(JSON.stringify(operations, null, 2));
      setOutputLanguage('json');
      setErrorStatus({ message: `Generated ${operations.length} patch operations`, isError: false });
    } catch (error: any) {
      setErrorStatus({ message: `Patch generate error: ${error.message}`, isError: true });
    }
  }, [patchBaseInput, patchTargetInput]);

  const handleApplyPatch = useCallback(() => {
    try {
      const original = JSON.parse(patchBaseInput);
      const operations = JSON.parse(patchOperationsInput);

      if (!Array.isArray(operations)) {
        throw new Error('Patch operations must be an array');
      }

      const patched = applyJsonPatchOperations(original, operations as any[]);
      setOutput(JSON.stringify(patched, null, 2));
      setOutputLanguage('json');
      setErrorStatus({ message: `Applied ${operations.length} patch operations`, isError: false });
    } catch (error: any) {
      setErrorStatus({ message: `Patch apply error: ${error.message}`, isError: true });
    }
  }, [patchBaseInput, patchOperationsInput]);

  const handleFormatDiff = useCallback(() => {
    const hasOriginal = diffOriginal.trim().length > 0;
    const hasModified = diffModified.trim().length > 0;

    if (!hasOriginal && !hasModified) {
      return;
    }

    let nextOriginal = diffOriginal;
    let nextModified = diffModified;

    if (hasOriginal) {
      try {
        nextOriginal = JSON.stringify(JSON.parse(diffOriginal), null, 2);
      } catch (error: any) {
        setDiffParseError(`Cannot format original JSON: ${error.message}`);
        return;
      }
    }

    if (hasModified) {
      try {
        nextModified = JSON.stringify(JSON.parse(diffModified), null, 2);
      } catch (error: any) {
        setDiffParseError(`Cannot format modified JSON: ${error.message}`);
        return;
      }
    }

    setDiffOriginal(nextOriginal);
    setDiffModified(nextModified);
    setDiffParseError(null);
  }, [diffModified, diffOriginal]);

  useEffect(() => {
    if (mode !== 'patch') {
      return;
    }

    setOutput(patchOperationsInput);
    setOutputLanguage('json');
    setErrorStatus(null);
  }, [mode, patchOperationsInput]);

  useEffect(() => {
    if (!diffOriginal.trim() && !diffModified.trim()) {
      setDiffReport(null);
      setDiffParseError(null);
      return;
    }

    try {
      let originalParsed: unknown;
      let modifiedParsed: unknown;

      try {
        originalParsed = JSON.parse(diffOriginal);
      } catch (error: any) {
        throw new Error(`Original JSON invalid: ${error.message}`);
      }

      try {
        modifiedParsed = JSON.parse(diffModified);
      } catch (error: any) {
        throw new Error(`Modified JSON invalid: ${error.message}`);
      }

      setDiffReport(generateJsonDiffReport(originalParsed, modifiedParsed));
      setDiffParseError(null);
    } catch (error: any) {
      setDiffReport(null);
      setDiffParseError(error.message);
    }
  }, [diffModified, diffOriginal]);

  useEffect(() => {
    if (mode !== 'diff' && mode !== 'patch') {
      processJson();
    }
  }, [mode, processJson, jsonPath, schemaInput, csvOptions, schemaDraft, schemaCustomKeywordsInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (mode === 'patch') {
          handleGeneratePatch();
        } else {
          processJson('validate');
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (mode !== 'patch') {
          processJson('format');
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        if (mode !== 'patch') {
          processJson('minify');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGeneratePatch, mode, processJson]);

  const handleEditorValidation = useCallback(
    (markers: MonacoMarker[]) => {
      if (
        mode === 'diff' ||
        mode === 'patch' ||
        mode === 'convert' ||
        (mode === 'convertCsv' && !csvInputLooksLikeJson) ||
        mode === 'escape'
      ) {
        return;
      }

      const errors = markers.filter((marker) => marker.severity === 8);
      if (errors.length === 0 || !input.trim()) {
        return;
      }

      const firstError = errors[0];
      setErrorStatus({
        message: `Line ${firstError.startLineNumber}, Col ${firstError.startColumn}: ${firstError.message}`,
        isError: true,
      });
    },
    [csvInputLooksLikeJson, input, mode],
  );

  const handleSchemaEditorValidation = useCallback(
    (markers: MonacoMarker[]) => {
      if (mode !== 'schemaValidate') return;
      const errors = markers.filter((marker) => marker.severity === 8);
      if (errors.length === 0 || !schemaInput.trim()) return;

      const firstError = errors[0];
      setErrorStatus({
        message: `Schema line ${firstError.startLineNumber}, Col ${firstError.startColumn}: ${firstError.message}`,
        isError: true,
      });
    },
    [mode, schemaInput],
  );

  const handleFormat = useCallback(() => processJson('format'), [processJson]);
  const handleMinify = useCallback(() => processJson('minify'), [processJson]);
  const handleValidate = useCallback(() => processJson('validate'), [processJson]);

  const handleExpandAll = useCallback(() => {
    if (outputEditorRef.current) {
      outputEditorRef.current.trigger('fold', 'editor.unfoldAll');
    }
  }, []);

  const handleCollapseAll = useCallback(() => {
    if (outputEditorRef.current) {
      outputEditorRef.current.trigger('fold', 'editor.foldAll');
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setErrorStatus((previous) => {
        if (previous?.isError) {
          return previous;
        }

        return {
          message: 'Copied to clipboard',
          isError: false,
        };
      });
    } catch {
      setErrorStatus({ message: 'Clipboard permission denied', isError: true });
    }
  }, []);

  const downloadFile = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, []);

  const importInputFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        setInput(text);
        setErrorStatus({ message: `Loaded input from ${file.name}`, isError: false });
      } catch {
        setErrorStatus({ message: `Failed to read ${file.name}`, isError: true });
      }
    },
    [setInput],
  );

  const importPatchBaseFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setPatchBaseInput(text);
      setErrorStatus({ message: `Loaded base from ${file.name}`, isError: false });
    } catch {
      setErrorStatus({ message: `Failed to read ${file.name}`, isError: true });
    }
  }, []);

  const importPatchTargetFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setPatchTargetInput(text);
      setErrorStatus({ message: `Loaded target from ${file.name}`, isError: false });
    } catch {
      setErrorStatus({ message: `Failed to read ${file.name}`, isError: true });
    }
  }, []);

  const importPatchOperationsFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setPatchOperationsInput(text);
      setErrorStatus({ message: `Loaded patch from ${file.name}`, isError: false });
    } catch {
      setErrorStatus({ message: `Failed to read ${file.name}`, isError: true });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextState: PersistedState = {
      version: 2,
      sharedInput,
      inputByMode,
      syncInputAcrossModes,
      showArrayHints,
      schemaInput,
      output,
      outputLanguage,
      convertSourceFormat,
      convertTargetFormat,
      diffOriginal,
      diffModified,
      jsonPath,
      theme,
      csvOptions,
      schemaDraft,
      schemaCustomKeywordsInput,
      patchBaseInput,
      patchTargetInput,
      patchOperationsInput,
      lastMode: mode,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, [
    convertSourceFormat,
    convertTargetFormat,
    csvOptions,
    diffModified,
    diffOriginal,
    inputByMode,
    jsonPath,
    mode,
    output,
    outputLanguage,
    patchBaseInput,
    patchOperationsInput,
    patchTargetInput,
    schemaCustomKeywordsInput,
    schemaDraft,
    schemaInput,
    showArrayHints,
    sharedInput,
    syncInputAcrossModes,
    theme,
  ]);

  return {
    input,
    setInput,
    syncInputAcrossModes,
    setSyncInputAcrossModes,
    showArrayHints,
    setShowArrayHints,
    schemaInput,
    setSchemaInput,
    output,
    outputLanguage,
    convertSourceFormat,
    convertTargetFormat,
    setConvertTargetFormat,
    diffOriginal,
    setDiffOriginal,
    diffModified,
    setDiffModified,
    diffReport,
    diffParseError,
    jsonPath,
    setJsonPath,
    theme,
    setTheme,
    csvInputLooksLikeJson,
    errorStatus,
    csvOptions,
    setCsvOptions,
    schemaDraft,
    setSchemaDraft,
    schemaCustomKeywordsInput,
    setSchemaCustomKeywordsInput,
    schemaValidationIssues,
    patchBaseInput,
    setPatchBaseInput,
    patchTargetInput,
    setPatchTargetInput,
    patchOperationsInput,
    setPatchOperationsInput,
    inputEditorRef,
    outputEditorRef,
    schemaEditorRef,
    handleEditorValidation,
    handleSchemaEditorValidation,
    handleFormat,
    handleMinify,
    handleValidate,
    handleGeneratePatch,
    handleApplyPatch,
    handleFormatDiff,
    handleExpandAll,
    handleCollapseAll,
    copyToClipboard,
    downloadFile,
    importInputFile,
    importPatchBaseFile,
    importPatchTargetFile,
    importPatchOperationsFile,
  };
}
