import Ajv, { type ErrorObject } from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import { applyPatch, compare, type Operation, validate as validatePatch } from 'fast-json-patch';
import type { CsvOptions, SchemaDraft } from './types';

type JsonSchema = Record<string, unknown>;

const DEFAULT_CSV_OPTIONS: CsvOptions = {
  delimiter: ',',
  hasHeaderRow: true,
  quoteStrategy: 'auto',
  escapeStrategy: 'double',
};

function normalizeCsvOptions(options?: Partial<CsvOptions>): CsvOptions {
  return {
    ...DEFAULT_CSV_OPTIONS,
    ...options,
  };
}

function getPrimitiveType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function uniqueSchemas(schemas: JsonSchema[]): JsonSchema[] {
  const seen = new Set<string>();
  const result: JsonSchema[] = [];

  for (const schema of schemas) {
    const key = JSON.stringify(schema);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(schema);
  }

  return result;
}

function createSchemaForValue(value: unknown): JsonSchema {
  const type = getPrimitiveType(value);

  if (type === 'array') {
    const arr = value as unknown[];
    if (arr.length === 0) {
      return { type: 'array', items: {} };
    }

    const itemSchemas = uniqueSchemas(arr.map((item) => createSchemaForValue(item)));
    return {
      type: 'array',
      items: itemSchemas.length === 1 ? itemSchemas[0] : { anyOf: itemSchemas },
    };
  }

  if (type === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    const properties: Record<string, JsonSchema> = {};

    for (const key of keys) {
      properties[key] = createSchemaForValue(obj[key]);
    }

    return {
      type: 'object',
      properties,
      required: keys,
      additionalProperties: true,
    };
  }

  return { type };
}

export function generateJsonSchemaFromSample(sample: unknown): JsonSchema {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    ...createSchemaForValue(sample),
  };
}

function createAjvByDraft(draft: SchemaDraft): Ajv {
  if (draft === '2019-09') {
    return new Ajv2019({ allErrors: true, strict: false });
  }

  if (draft === '2020-12') {
    return new Ajv2020({ allErrors: true, strict: false });
  }

  return new Ajv({ allErrors: true, strict: false });
}

function addCustomKeywords(ajv: Ajv, keywords: string[]): void {
  for (const keyword of keywords) {
    const normalized = keyword.trim();
    if (!normalized || ajv.getKeyword(normalized)) {
      continue;
    }

    ajv.addKeyword({
      keyword: normalized,
      schemaType: ['boolean', 'number', 'string', 'object', 'array', 'null'],
      errors: false,
      validate: () => true,
    });
  }
}

export function validateJsonBySchema(
  data: unknown,
  schema: JsonSchema,
  options?: {
    draft?: SchemaDraft;
    customKeywords?: string[];
  },
): { valid: boolean; errors: ErrorObject[] } {
  const ajv = createAjvByDraft(options?.draft ?? 'draft-07');
  addCustomKeywords(ajv, options?.customKeywords ?? []);

  const validate = ajv.compile(schema);
  const valid = validate(data);

  return {
    valid: Boolean(valid),
    errors: (validate.errors ?? []) as ErrorObject[],
  };
}

function parseCsvRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];
    const next = row[i + 1];

    if (char === '\\' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function splitCsvLines(input: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '\\' && inQuotes && next === '"') {
      current += '\\"';
      i += 1;
      continue;
    }

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '""';
        i += 1;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      lines.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines.filter((line) => line.length > 0);
}

function parseCellValue(raw: string): unknown {
  const value = raw.trim();
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
    try {
      return JSON.parse(value);
    } catch {
      return raw;
    }
  }
  return raw;
}

function escapeCsvCell(value: unknown, options: CsvOptions): string {
  const str =
    value === null || value === undefined
      ? ''
      : typeof value === 'string'
        ? value
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

  const mustQuote =
    options.quoteStrategy === 'always' ||
    str.includes(options.delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (!mustQuote) {
    return str;
  }

  const escaped = options.escapeStrategy === 'backslash' ? str.replace(/"/g, '\\"') : str.replace(/"/g, '""');

  return `"${escaped}"`;
}

export function convertJsonToCsv(value: unknown, options?: Partial<CsvOptions>): string {
  const normalizedOptions = normalizeCsvOptions(options);
  const rows = Array.isArray(value) ? value : [value];

  if (rows.length === 0) {
    return '';
  }

  if (rows.every((row) => typeof row === 'object' && row !== null && !Array.isArray(row))) {
    const keys: string[] = Array.from(
      rows.reduce((set, row) => {
        Object.keys(row as Record<string, unknown>).forEach((key) => set.add(key));
        return set;
      }, new Set<string>()),
    );

    const body = rows.map((row) => {
      const record = row as Record<string, unknown>;
      return keys.map((key) => escapeCsvCell(record[key], normalizedOptions)).join(normalizedOptions.delimiter);
    });

    if (!normalizedOptions.hasHeaderRow) {
      return body.join('\n');
    }

    const header = keys.map((key) => escapeCsvCell(key, normalizedOptions)).join(normalizedOptions.delimiter);
    return [header, ...body].join('\n');
  }

  if (rows.every((row) => Array.isArray(row))) {
    return rows
      .map((row) => (row as unknown[]).map((cell) => escapeCsvCell(cell, normalizedOptions)).join(normalizedOptions.delimiter))
      .join('\n');
  }

  return rows.map((row) => escapeCsvCell(row, normalizedOptions)).join('\n');
}

export function convertCsvToJson(csvText: string, options?: Partial<CsvOptions>): unknown {
  const normalizedOptions = normalizeCsvOptions(options);
  const lines = splitCsvLines(csvText);

  if (lines.length === 0) {
    return [];
  }

  const parsedRows = lines.map((line) => parseCsvRow(line, normalizedOptions.delimiter));

  if (!normalizedOptions.hasHeaderRow) {
    return parsedRows.map((row) => row.map((cell) => parseCellValue(cell)));
  }

  const header = parsedRows[0];
  const bodyRows = parsedRows.slice(1);

  if (bodyRows.length === 0) {
    return [];
  }

  return bodyRows.map((row) => {
    const record: Record<string, unknown> = {};
    for (let i = 0; i < header.length; i += 1) {
      record[header[i]] = parseCellValue(row[i] ?? '');
    }
    return record;
  });
}

export function escapeOrUnescapeJsonString(input: string): {
  output: string;
  outputLanguage: 'json' | 'plaintext';
  message: string;
} {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      output: '',
      outputLanguage: 'plaintext',
      message: 'Empty input',
    };
  }

  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === 'string') {
      return {
        output: parsed,
        outputLanguage: 'plaintext',
        message: 'Unescaped JSON string',
      };
    }

    return {
      output: JSON.stringify(JSON.stringify(parsed)),
      outputLanguage: 'json',
      message: 'Escaped JSON value to JSON string',
    };
  } catch {
    return {
      output: JSON.stringify(input),
      outputLanguage: 'json',
      message: 'Escaped text to JSON string',
    };
  }
}

export function generateJsonPatchOperations(original: unknown, modified: unknown): Operation[] {
  return compare(original as object, modified as object);
}

export function applyJsonPatchOperations(original: unknown, operations: Operation[]): unknown {
  const validationError = validatePatch(operations, original);
  if (validationError) {
    throw new Error(validationError.message || 'Invalid JSON Patch operations');
  }

  const clone = JSON.parse(JSON.stringify(original));
  const result = applyPatch(clone, operations, true, false);
  return result.newDocument;
}
