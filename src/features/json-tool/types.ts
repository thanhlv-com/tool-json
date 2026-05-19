export type Mode =
  | 'format'
  | 'diff'
  | 'query'
  | 'convert'
  | 'schemaGenerate'
  | 'schemaValidate'
  | 'convertCsv'
  | 'escape'
  | 'patch';

export type ThemeMode = 'vs-dark' | 'light';

export type OutputLanguage = 'json' | 'yaml' | 'xml' | 'plaintext';

export type ConvertSourceFormat = 'json' | 'yaml' | null;
export type ConvertTargetFormat = 'yaml' | 'xml' | 'properties';

export type ErrorStatus = {
  message: string;
  isError: boolean;
} | null;

export type CsvDelimiter = ',' | ';' | '\t';
export type CsvQuoteStrategy = 'auto' | 'always';
export type CsvEscapeStrategy = 'double' | 'backslash';

export type CsvOptions = {
  delimiter: CsvDelimiter;
  hasHeaderRow: boolean;
  quoteStrategy: CsvQuoteStrategy;
  escapeStrategy: CsvEscapeStrategy;
};

export type SchemaDraft = 'draft-07' | '2019-09' | '2020-12';

export type SchemaValidationIssue = {
  path: string;
  message: string;
  keyword: string;
};

export type ProcessAction = 'format' | 'minify' | 'validate' | 'convert';
