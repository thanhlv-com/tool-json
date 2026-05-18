import { useCallback, useEffect, useRef, useState } from 'react';
import { JSONPath } from 'jsonpath-plus';
import YAML from 'yaml';
import type { ConvertSourceFormat, ErrorStatus, Mode, OutputLanguage, ProcessAction, ThemeMode } from './types';
import {
  convertCsvToJson,
  convertJsonToCsv,
  escapeOrUnescapeJsonString,
  generateJsonSchemaFromSample,
  validateJsonBySchema,
} from './utils';

type MonacoMarker = {
  severity: number;
  startLineNumber: number;
  startColumn: number;
  message: string;
};

const DEFAULT_JSON_INPUT =
  '{\n  "tool": "JSON Dev Tool",\n  "version": 1.0,\n  "features": [\n    "Format",\n    "Validate",\n    "Diff",\n    "Query",\n    "YAML"\n  ],\n  "is_awesome": true\n}';
const DEFAULT_SCHEMA_INPUT =
  '{\n  "type": "object",\n  "properties": {\n    "tool": { "type": "string" },\n    "version": { "type": "number" }\n  },\n  "required": ["tool", "version"],\n  "additionalProperties": true\n}';

export function useJsonToolState(mode: Mode) {
  const [input, setInput] = useState<string>(DEFAULT_JSON_INPUT);
  const [schemaInput, setSchemaInput] = useState<string>(DEFAULT_SCHEMA_INPUT);
  const [output, setOutput] = useState<string>('');
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('json');
  const [convertSourceFormat, setConvertSourceFormat] = useState<ConvertSourceFormat>(null);
  const [diffOriginal, setDiffOriginal] = useState<string>('{\n  "status": "ok",\n  "code": 200\n}');
  const [diffModified, setDiffModified] = useState<string>(
    '{\n  "status": "error",\n  "code": 500,\n  "message": "Failed"\n}',
  );
  const [jsonPath, setJsonPath] = useState<string>('$.features');
  const [theme, setTheme] = useState<ThemeMode>('vs-dark');
  const [errorStatus, setErrorStatus] = useState<ErrorStatus>(null);

  const inputEditorRef = useRef<any>(null);
  const outputEditorRef = useRef<any>(null);
  const schemaEditorRef = useRef<any>(null);

  const processJson = useCallback(
    (action: ProcessAction = 'format', customInput = input) => {
      setErrorStatus(null);
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

          if (sourceFormat === 'json') {
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
              setErrorStatus({ message: 'Converted JSON to YAML (Minified)', isError: false });
            } else {
              setOutput(YAML.stringify(parsed));
              if (action === 'validate') {
                setErrorStatus({ message: 'Valid JSON (Converted to YAML)', isError: false });
              } else {
                setErrorStatus({ message: 'Converted JSON to YAML', isError: false });
              }
            }
          } else {
            setOutputLanguage('json');
            if (action === 'minify') {
              setOutput(JSON.stringify(parsed));
              setErrorStatus({ message: 'Converted YAML to JSON (Minified)', isError: false });
            } else {
              setOutput(JSON.stringify(parsed, null, 2));
              if (action === 'validate') {
                setErrorStatus({ message: 'Valid YAML (Converted to JSON)', isError: false });
              } else {
                setErrorStatus({ message: 'Converted YAML to JSON', isError: false });
              }
            }
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
          const result = validateJsonBySchema(data, schema);
          const normalizedErrors = result.errors.map((error) => ({
            path: error.instancePath || '/',
            message: error.message ?? 'Validation error',
            keyword: error.keyword,
          }));

          setOutput(
            JSON.stringify(
              {
                valid: result.valid,
                errorCount: normalizedErrors.length,
                errors: normalizedErrors,
              },
              null,
              2,
            ),
          );
          setErrorStatus({
            message: result.valid ? 'JSON is valid for schema' : `JSON is invalid (${normalizedErrors.length} errors)`,
            isError: !result.valid,
          });
          return;
        }

        if (mode === 'convertCsv') {
          setConvertSourceFormat(null);
          let parsed: unknown;

          try {
            parsed = JSON.parse(customInput);
            const csv = convertJsonToCsv(parsed);
            setOutput(csv);
            setOutputLanguage('plaintext');
            setErrorStatus({ message: 'Converted JSON to CSV', isError: false });
          } catch {
            const json = convertCsvToJson(customInput);
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
        setErrorStatus({ message: `Parse Error: ${error.message}`, isError: true });
      }
    },
    [input, jsonPath, mode, schemaInput],
  );

  useEffect(() => {
    if (mode !== 'diff') {
      processJson();
    }
  }, [mode, processJson, jsonPath, schemaInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        processJson('validate');
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        processJson('format');
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        processJson('minify');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [processJson]);

  const handleEditorValidation = useCallback(
    (markers: MonacoMarker[]) => {
      if (mode === 'diff' || mode === 'convert' || mode === 'convertCsv' || mode === 'escape') {
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
    [input, mode],
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

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
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

  return {
    input,
    setInput,
    schemaInput,
    setSchemaInput,
    output,
    outputLanguage,
    convertSourceFormat,
    diffOriginal,
    setDiffOriginal,
    diffModified,
    setDiffModified,
    jsonPath,
    setJsonPath,
    theme,
    setTheme,
    errorStatus,
    inputEditorRef,
    outputEditorRef,
    schemaEditorRef,
    handleEditorValidation,
    handleSchemaEditorValidation,
    handleFormat,
    handleMinify,
    handleValidate,
    handleExpandAll,
    handleCollapseAll,
    copyToClipboard,
    downloadFile,
  };
}
