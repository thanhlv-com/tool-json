export type Mode =
  | 'format'
  | 'diff'
  | 'query'
  | 'convert'
  | 'schemaGenerate'
  | 'schemaValidate'
  | 'convertCsv'
  | 'escape';

export type ThemeMode = 'vs-dark' | 'light';

export type OutputLanguage = 'json' | 'yaml' | 'plaintext';

export type ConvertSourceFormat = 'json' | 'yaml' | null;

export type ErrorStatus = {
  message: string;
  isError: boolean;
} | null;

export type ProcessAction = 'format' | 'minify' | 'validate' | 'convert';
