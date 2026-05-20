import Ajv, { type ErrorObject } from 'ajv';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import { applyPatch, compare, type Operation, validate as validatePatch } from 'fast-json-patch';
import { JSONPath } from 'jsonpath-plus';
import YAML from 'yaml';
import type { CsvOptions, OutputLanguage, SchemaDraft } from './types';

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

type ImportedSchemaEntry = {
  schema: JsonSchema;
  id?: string;
};

function isSchemaObject(value: unknown): value is JsonSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeImportedSchemas(importedSchemas: unknown): ImportedSchemaEntry[] {
  if (!importedSchemas) {
    return [];
  }

  if (Array.isArray(importedSchemas)) {
    return importedSchemas.map((entry, index) => {
      if (!isSchemaObject(entry)) {
        throw new Error(`Imported schema at index ${index} must be an object`);
      }

      const entryId = typeof entry.$id === 'string' ? entry.$id : undefined;
      return {
        schema: entry,
        id: entryId,
      };
    });
  }

  if (isSchemaObject(importedSchemas)) {
    return Object.entries(importedSchemas).map(([schemaId, schema]) => {
      if (!isSchemaObject(schema)) {
        throw new Error(`Imported schema "${schemaId}" must be an object`);
      }

      return {
        schema,
        id: schemaId,
      };
    });
  }

  throw new Error('Imported schemas must be an array or object map');
}

function addImportedSchemas(ajv: Ajv, importedSchemas: unknown): void {
  const entries = normalizeImportedSchemas(importedSchemas);
  entries.forEach((entry) => {
    if (entry.id) {
      ajv.addSchema(entry.schema, entry.id);
    } else {
      ajv.addSchema(entry.schema);
    }
  });
}

export function validateJsonBySchema(
  data: unknown,
  schema: JsonSchema,
  options?: {
    draft?: SchemaDraft;
    customKeywords?: string[];
    importedSchemas?: unknown;
  },
): { valid: boolean; errors: ErrorObject[] } {
  const ajv = createAjvByDraft(options?.draft ?? 'draft-07');
  addCustomKeywords(ajv, options?.customKeywords ?? []);
  addImportedSchemas(ajv, options?.importedSchemas);

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

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeXmlTagName(name: string): string {
  const sanitized = name.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_.:-]/g, '_');
  if (!sanitized) {
    return 'item';
  }
  if (!/^[A-Za-z_]/.test(sanitized)) {
    return `_${sanitized}`;
  }
  return sanitized;
}

function serializeXmlNode(
  tagName: string,
  value: unknown,
  options: { pretty: boolean; indentSize: number },
  depth: number,
): string {
  const safeTag = normalizeXmlTagName(tagName);
  const indent = options.pretty ? ' '.repeat(depth * options.indentSize) : '';
  const newline = options.pretty ? '\n' : '';

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<${safeTag}/>`;
    }
    return value.map((item) => serializeXmlNode(safeTag, item, options, depth)).join(newline);
  }

  if (value === null || value === undefined) {
    return `${indent}<${safeTag}/>`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return `${indent}<${safeTag}/>`;
    }

    const innerNodes = entries.map(([key, child]) => serializeXmlNode(key, child, options, depth + 1)).join(newline);
    if (!options.pretty) {
      return `${indent}<${safeTag}>${innerNodes}</${safeTag}>`;
    }

    return `${indent}<${safeTag}>${newline}${innerNodes}${newline}${indent}</${safeTag}>`;
  }

  return `${indent}<${safeTag}>${escapeXmlText(String(value))}</${safeTag}>`;
}

export function convertJsonToXml(
  value: unknown,
  options?: {
    rootName?: string;
    pretty?: boolean;
    includeDeclaration?: boolean;
  },
): string {
  const rootName = options?.rootName ?? 'root';
  const pretty = options?.pretty ?? true;
  const includeDeclaration = options?.includeDeclaration ?? true;
  const indentSize = 2;
  const newline = pretty ? '\n' : '';

  const rootNode = serializeXmlNode(rootName, value, { pretty, indentSize }, 0);
  if (!includeDeclaration) {
    return rootNode;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>${newline}${rootNode}`;
}

function escapePropertiesSegment(segment: string): string {
  return segment.replace(/([\\=:\s])/g, '\\$1');
}

function escapePropertiesValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function flattenToProperties(value: unknown, path: string, lines: string[]): void {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      if (path) {
        lines.push(`${path}=`);
      }
      return;
    }

    value.forEach((item, index) => {
      const nextPath = path ? `${path}[${index}]` : `items[${index}]`;
      flattenToProperties(item, nextPath, lines);
    });
    return;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      if (path) {
        lines.push(`${path}=`);
      }
      return;
    }

    entries.forEach(([key, childValue]) => {
      const safeKey = escapePropertiesSegment(key);
      const nextPath = path ? `${path}.${safeKey}` : safeKey;
      flattenToProperties(childValue, nextPath, lines);
    });
    return;
  }

  const key = path || 'value';
  const scalar = value === null || value === undefined ? '' : String(value);
  lines.push(`${key}=${escapePropertiesValue(scalar)}`);
}

export function convertJsonToProperties(value: unknown): string {
  const lines: string[] = [];
  flattenToProperties(value, '', lines);
  return lines.join('\n');
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

export type JsonDiffDetail = {
  id: string;
  op: Operation['op'];
  path: string;
  pathLabel: string;
  message: string;
  originalValue?: unknown;
  modifiedValue?: unknown;
  originalType?: string;
  modifiedType?: string;
};

export type JsonDiffReport = {
  equal: boolean;
  operationCount: number;
  operations: Operation[];
  details: JsonDiffDetail[];
  detailsTruncated: boolean;
  detailLimit: number;
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
};

export type JsonMergeStats = {
  addedKeys: number;
  overwrittenValues: number;
  mergedArrays: number;
  appendedArrayItems: number;
  typeConflicts: number;
  operationCount: number;
};

export type JsonMergeResult = {
  merged: unknown;
  stats: JsonMergeStats;
};

function escapeJsonPointerToken(token: string): string {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

function unescapeJsonPointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function parseJsonPointer(path: string): string[] {
  if (!path) {
    return [];
  }

  return path
    .split('/')
    .slice(1)
    .map((token) => unescapeJsonPointerToken(token));
}

function toJsonPointer(segments: string[]): string {
  if (segments.length === 0) {
    return '';
  }

  return `/${segments.map((segment) => escapeJsonPointerToken(segment)).join('/')}`;
}

function isArrayIndexToken(token: string | undefined): boolean {
  return Boolean(token) && /^\d+$/.test(token);
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getValueAtPointer(source: unknown, path: string): unknown {
  const segments = parseJsonPointer(path);
  let current: unknown = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      if (!isArrayIndexToken(segment)) {
        return undefined;
      }
      current = current[Number(segment)];
      continue;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function getValueType(value: unknown): string {
  if (value === undefined) return 'missing';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function formatDiffPath(path: string): string {
  const segments = parseJsonPointer(path);
  if (segments.length === 0) {
    return '$';
  }

  let result = '$';
  const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

  for (const segment of segments) {
    if (segment === '-') {
      result += '[last]';
      continue;
    }

    if (isArrayIndexToken(segment)) {
      result += `[${segment}]`;
      continue;
    }

    if (identifierPattern.test(segment)) {
      result += `.${segment}`;
      continue;
    }

    result += `[${JSON.stringify(segment)}]`;
  }

  return result;
}

function createPreviewValue(value: unknown): string {
  if (value === undefined) {
    return '(missing)';
  }

  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      return String(value);
    }
    return serialized.length > 180 ? `${serialized.slice(0, 180)}...` : serialized;
  } catch {
    return String(value);
  }
}

function buildDetailMessage(
  operation: Operation,
  path: string,
  originalParent: unknown,
  modifiedParent: unknown,
  originalType: string,
  modifiedType: string,
): string {
  const segments = parseJsonPointer(path);
  const lastToken = segments[segments.length - 1];
  const isArrayScope = Array.isArray(originalParent) || Array.isArray(modifiedParent);

  if (operation.op === 'add') {
    if (isArrayScope) {
      if (lastToken === '-') {
        return 'Appended new item to array';
      }
      return `Array has a new item at index ${lastToken ?? '?'}`;
    }
    return `Added value at ${formatDiffPath(path)}`;
  }

  if (operation.op === 'remove') {
    if (isArrayScope) {
      return `Array item missing in modified at index ${lastToken ?? '?'}`;
    }
    return `Removed value at ${formatDiffPath(path)}`;
  }

  if (operation.op === 'replace') {
    if (isArrayScope) {
      return originalType !== modifiedType
        ? `Array item type changed at index ${lastToken ?? '?'} (${originalType} -> ${modifiedType})`
        : `Array item content changed at index ${lastToken ?? '?'}`;
    }

    return originalType !== modifiedType
      ? `Value type changed at ${formatDiffPath(path)} (${originalType} -> ${modifiedType})`
      : `Value changed at ${formatDiffPath(path)}`;
  }

  return `${operation.op.toUpperCase()} operation at ${formatDiffPath(path)}`;
}

function createDetail(
  operation: Operation,
  index: number,
  original: unknown,
  modified: unknown,
): JsonDiffDetail {
  const path = operation.path ?? '';
  const pathLabel = formatDiffPath(path);
  const segments = parseJsonPointer(path);
  const parentPath = toJsonPointer(segments.slice(0, -1));
  const originalParent = getValueAtPointer(original, parentPath);
  const modifiedParent = getValueAtPointer(modified, parentPath);
  const originalValue = getValueAtPointer(original, path);
  const modifiedValue =
    operation.op === 'add' && 'value' in operation ? operation.value : getValueAtPointer(modified, path);
  const originalType = getValueType(originalValue);
  const modifiedType = getValueType(modifiedValue);
  const message = buildDetailMessage(operation, path, originalParent, modifiedParent, originalType, modifiedType);

  let detailOriginalValue: unknown;
  let detailModifiedValue: unknown;

  if (operation.op === 'add') {
    detailModifiedValue = modifiedValue;
  } else if (operation.op === 'remove') {
    detailOriginalValue = originalValue;
  } else {
    detailOriginalValue = originalValue;
    detailModifiedValue = modifiedValue;
  }

  return {
    id: `${index}-${operation.op}-${path}`,
    op: operation.op,
    path,
    pathLabel,
    message: `${message}. Before: ${createPreviewValue(detailOriginalValue)} | After: ${createPreviewValue(detailModifiedValue)}`,
    originalValue: detailOriginalValue,
    modifiedValue: detailModifiedValue,
    originalType,
    modifiedType,
  };
}

export function generateJsonDiffReport(
  original: unknown,
  modified: unknown,
  options?: {
    maxDetails?: number;
  },
): JsonDiffReport {
  let operations: Operation[] = [];

  if (isObjectLike(original) && isObjectLike(modified)) {
    operations = compare(original as object, modified as object);
  } else if (JSON.stringify(original) !== JSON.stringify(modified)) {
    operations = [{ op: 'replace', path: '', value: modified } as Operation];
  }

  const summary = operations.reduce(
    (result, operation) => {
      if (operation.op === 'add') {
        result.added += 1;
      } else if (operation.op === 'remove') {
        result.removed += 1;
      } else {
        result.changed += 1;
      }
      return result;
    },
    { added: 0, removed: 0, changed: 0 },
  );

  const detailLimit =
    typeof options?.maxDetails === 'number' && Number.isFinite(options.maxDetails) && options.maxDetails > 0
      ? Math.floor(options.maxDetails)
      : operations.length;
  const details = operations.slice(0, detailLimit).map((operation, index) => createDetail(operation, index, original, modified));
  const detailsTruncated = operations.length > detailLimit;

  return {
    equal: operations.length === 0,
    operationCount: operations.length,
    operations,
    details,
    detailsTruncated,
    detailLimit,
    summary,
  };
}

function isMergeObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => cloneJsonValue(item));
  }

  if (isMergeObject(value)) {
    return Object.entries(value).reduce(
      (result, [key, item]) => {
        result[key] = cloneJsonValue(item);
        return result;
      },
      {} as Record<string, unknown>,
    );
  }

  return value;
}

function getJsonTypeLabel(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function mergeJsonValue(left: unknown, right: unknown, stats: Omit<JsonMergeStats, 'operationCount'>): unknown {
  if (Array.isArray(left) && Array.isArray(right)) {
    stats.mergedArrays += 1;
    const maxLength = Math.max(left.length, right.length);
    const mergedArray: unknown[] = [];

    for (let index = 0; index < maxLength; index += 1) {
      const hasLeft = index < left.length;
      const hasRight = index < right.length;

      if (hasLeft && hasRight) {
        mergedArray.push(mergeJsonValue(left[index], right[index], stats));
      } else if (hasLeft) {
        mergedArray.push(cloneJsonValue(left[index]));
      } else if (hasRight) {
        mergedArray.push(cloneJsonValue(right[index]));
        stats.appendedArrayItems += 1;
      }
    }

    return mergedArray;
  }

  if (isMergeObject(left) && isMergeObject(right)) {
    const mergedObject: Record<string, unknown> = Object.entries(left).reduce(
      (result, [key, value]) => {
        result[key] = cloneJsonValue(value);
        return result;
      },
      {} as Record<string, unknown>,
    );

    Object.entries(right).forEach(([key, rightValue]) => {
      if (Object.prototype.hasOwnProperty.call(left, key)) {
        mergedObject[key] = mergeJsonValue((left as Record<string, unknown>)[key], rightValue, stats);
      } else {
        mergedObject[key] = cloneJsonValue(rightValue);
        stats.addedKeys += 1;
      }
    });

    return mergedObject;
  }

  if (JSON.stringify(left) === JSON.stringify(right)) {
    return cloneJsonValue(right);
  }

  const leftType = getJsonTypeLabel(left);
  const rightType = getJsonTypeLabel(right);
  if (leftType !== rightType) {
    stats.typeConflicts += 1;
  }
  stats.overwrittenValues += 1;
  return cloneJsonValue(right);
}

export function mergeJsonStructures(left: unknown, right: unknown): JsonMergeResult {
  const stats: Omit<JsonMergeStats, 'operationCount'> = {
    addedKeys: 0,
    overwrittenValues: 0,
    mergedArrays: 0,
    appendedArrayItems: 0,
    typeConflicts: 0,
  };
  const merged = mergeJsonValue(left, right, stats);
  const operationCount = stats.addedKeys + stats.overwrittenValues + stats.appendedArrayItems;

  return {
    merged,
    stats: {
      ...stats,
      operationCount,
    },
  };
}

type PipelineTargetFormat = 'json' | 'yaml' | 'xml' | 'properties';

type TransformStep =
  | { type: 'query'; path: string }
  | { type: 'set'; path: string; value: unknown }
  | { type: 'remove'; path: string }
  | { type: 'pick'; paths: string[] }
  | { type: 'mask'; rules?: PrivacyMaskConfig }
  | { type: 'convert'; target: PipelineTargetFormat };

export type TransformPipelineResult = {
  output: string;
  outputLanguage: OutputLanguage;
  stepMessages: string[];
};

function ensurePointer(path: string, stepIndex: number): void {
  if (typeof path !== 'string' || (!path.startsWith('/') && path !== '')) {
    throw new Error(`Step ${stepIndex + 1}: pointer path must start with "/" or be empty`);
  }
}

function setValueAtPointer(source: unknown, pointer: string, value: unknown): unknown {
  const segments = parseJsonPointer(pointer);
  if (segments.length === 0) {
    return cloneJsonValue(value);
  }

  const root = cloneJsonValue(source);
  let current: any = root;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nextSegment = segments[index + 1];

    if (Array.isArray(current)) {
      if (!isArrayIndexToken(segment)) {
        throw new Error(`Cannot set pointer "${pointer}" on array`);
      }

      const arrayIndex = Number(segment);
      const nextContainer = isArrayIndexToken(nextSegment) ? [] : {};
      if (!isObjectLike(current[arrayIndex]) && !Array.isArray(current[arrayIndex])) {
        current[arrayIndex] = nextContainer;
      }
      current = current[arrayIndex];
      continue;
    }

    if (!isObjectLike(current)) {
      throw new Error(`Cannot set pointer "${pointer}" on non-object value`);
    }

    if (!isObjectLike(current[segment]) && !Array.isArray(current[segment])) {
      current[segment] = isArrayIndexToken(nextSegment) ? [] : {};
    }
    current = current[segment];
  }

  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (!isArrayIndexToken(lastSegment)) {
      throw new Error(`Cannot set pointer "${pointer}" on array`);
    }
    current[Number(lastSegment)] = cloneJsonValue(value);
    return root;
  }

  if (!isObjectLike(current)) {
    throw new Error(`Cannot set pointer "${pointer}" on non-object value`);
  }

  current[lastSegment] = cloneJsonValue(value);
  return root;
}

function removeValueAtPointer(source: unknown, pointer: string): unknown {
  const segments = parseJsonPointer(pointer);
  if (segments.length === 0) {
    throw new Error('Cannot remove root pointer');
  }

  const root = cloneJsonValue(source);
  let current: any = root;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];

    if (Array.isArray(current)) {
      if (!isArrayIndexToken(segment)) {
        throw new Error(`Cannot remove pointer "${pointer}" on array`);
      }
      current = current[Number(segment)];
      continue;
    }

    if (!isObjectLike(current) || !(segment in current)) {
      throw new Error(`Cannot remove pointer "${pointer}" because it does not exist`);
    }
    current = current[segment];
  }

  const lastSegment = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (!isArrayIndexToken(lastSegment)) {
      throw new Error(`Cannot remove pointer "${pointer}" on array`);
    }

    const removeIndex = Number(lastSegment);
    if (removeIndex < 0 || removeIndex >= current.length) {
      throw new Error(`Cannot remove pointer "${pointer}" because index does not exist`);
    }
    current.splice(removeIndex, 1);
    return root;
  }

  if (!isObjectLike(current) || !(lastSegment in current)) {
    throw new Error(`Cannot remove pointer "${pointer}" because it does not exist`);
  }

  delete current[lastSegment];
  return root;
}

function pickValuesByPointers(source: unknown, pointers: string[]): unknown {
  if (pointers.some((pointer) => pointer === '')) {
    return cloneJsonValue(source);
  }

  const firstPointer = pointers[0];
  if (!firstPointer) {
    return {};
  }

  const firstSegments = parseJsonPointer(firstPointer);
  let result: unknown = isArrayIndexToken(firstSegments[0]) ? [] : {};

  pointers.forEach((pointer) => {
    const value = getValueAtPointer(source, pointer);
    if (value !== undefined) {
      result = setValueAtPointer(result, pointer, cloneJsonValue(value));
    }
  });

  return result;
}

export function runJsonTransformPipeline(input: unknown, rawSteps: unknown[]): TransformPipelineResult {
  let current = cloneJsonValue(input);
  let targetFormat: PipelineTargetFormat = 'json';
  const stepMessages: string[] = [];

  rawSteps.forEach((rawStep, stepIndex) => {
    if (!rawStep || typeof rawStep !== 'object' || Array.isArray(rawStep)) {
      throw new Error(`Step ${stepIndex + 1}: step must be an object`);
    }

    const step = rawStep as TransformStep;

    if (step.type === 'query') {
      if (typeof step.path !== 'string' || !step.path.trim()) {
        throw new Error(`Step ${stepIndex + 1}: query.path is required`);
      }

      const queryResult = JSONPath({
        path: step.path,
        json: current as any,
        wrap: true,
      }) as unknown;

      if (!Array.isArray(queryResult)) {
        throw new Error(`Step ${stepIndex + 1}: query did not return an array result`);
      }

      current = queryResult;
      stepMessages.push(`Step ${stepIndex + 1}: query matched ${queryResult.length} item(s)`);
      return;
    }

    if (step.type === 'set') {
      ensurePointer(step.path, stepIndex);
      current = setValueAtPointer(current, step.path, step.value);
      stepMessages.push(`Step ${stepIndex + 1}: set ${step.path}`);
      return;
    }

    if (step.type === 'remove') {
      ensurePointer(step.path, stepIndex);
      current = removeValueAtPointer(current, step.path);
      stepMessages.push(`Step ${stepIndex + 1}: remove ${step.path}`);
      return;
    }

    if (step.type === 'pick') {
      if (!Array.isArray(step.paths) || step.paths.some((path) => typeof path !== 'string')) {
        throw new Error(`Step ${stepIndex + 1}: pick.paths must be a string array`);
      }

      step.paths.forEach((pointer) => ensurePointer(pointer, stepIndex));
      current = pickValuesByPointers(current, step.paths);
      stepMessages.push(`Step ${stepIndex + 1}: pick ${step.paths.length} pointer(s)`);
      return;
    }

    if (step.type === 'mask') {
      const maskResult = maskJsonSensitiveData(current, step.rules);
      current = maskResult.masked;
      stepMessages.push(`Step ${stepIndex + 1}: masked ${maskResult.maskedCount} field(s)`);
      return;
    }

    if (step.type === 'convert') {
      if (step.target !== 'json' && step.target !== 'yaml' && step.target !== 'xml' && step.target !== 'properties') {
        throw new Error(`Step ${stepIndex + 1}: convert.target must be json|yaml|xml|properties`);
      }
      targetFormat = step.target;
      stepMessages.push(`Step ${stepIndex + 1}: convert target ${step.target}`);
      return;
    }

    throw new Error(`Step ${stepIndex + 1}: unsupported step type`);
  });

  const resolvedTargetFormat = targetFormat as PipelineTargetFormat;

  if (resolvedTargetFormat === 'yaml') {
    return {
      output: YAML.stringify(current),
      outputLanguage: 'yaml',
      stepMessages,
    };
  }

  if (resolvedTargetFormat === 'xml') {
    return {
      output: convertJsonToXml(current, { pretty: true, rootName: 'root' }),
      outputLanguage: 'xml',
      stepMessages,
    };
  }

  if (resolvedTargetFormat === 'properties') {
    return {
      output: convertJsonToProperties(current),
      outputLanguage: 'plaintext',
      stepMessages,
    };
  }

  return {
    output: JSON.stringify(current, null, 2),
    outputLanguage: 'json',
    stepMessages,
  };
}

export type PrivacyMaskConfig = {
  keys?: string[];
  jsonPathPatterns?: string[];
  maskText?: string;
  keepStartVisible?: number;
  keepEndVisible?: number;
};

export type PrivacyMaskResult = {
  masked: unknown;
  maskedCount: number;
  pathPatternMatchCount: number;
};

const DEFAULT_PRIVACY_MASK_KEYS = ['password', 'token', 'authorization', 'secret', 'apiKey', 'email', 'phone'];
const DEFAULT_PRIVACY_MASK_TEXT = '***REDACTED***';

function createMaskedText(
  rawValue: string,
  options: {
    maskText: string;
    keepStartVisible: number;
    keepEndVisible: number;
  },
): string {
  const { keepStartVisible, keepEndVisible, maskText } = options;
  if (keepStartVisible <= 0 && keepEndVisible <= 0) {
    return maskText;
  }

  if (rawValue.length <= keepStartVisible + keepEndVisible) {
    return maskText;
  }

  const hiddenLength = Math.max(rawValue.length - keepStartVisible - keepEndVisible, 3);
  return `${rawValue.slice(0, keepStartVisible)}${'*'.repeat(hiddenLength)}${rawValue.slice(rawValue.length - keepEndVisible)}`;
}

function normalizePrivacyMaskConfig(config?: PrivacyMaskConfig): Required<PrivacyMaskConfig> {
  return {
    keys: Array.isArray(config?.keys) ? config?.keys.filter((key) => typeof key === 'string') : DEFAULT_PRIVACY_MASK_KEYS,
    jsonPathPatterns: Array.isArray(config?.jsonPathPatterns)
      ? config?.jsonPathPatterns.filter((pattern) => typeof pattern === 'string')
      : [],
    maskText: typeof config?.maskText === 'string' && config.maskText.length > 0 ? config.maskText : DEFAULT_PRIVACY_MASK_TEXT,
    keepStartVisible: Number.isInteger(config?.keepStartVisible) ? Math.max(0, Number(config?.keepStartVisible)) : 0,
    keepEndVisible: Number.isInteger(config?.keepEndVisible) ? Math.max(0, Number(config?.keepEndVisible)) : 0,
  };
}

function maskValue(
  value: unknown,
  options: {
    maskText: string;
    keepStartVisible: number;
    keepEndVisible: number;
  },
): string {
  if (typeof value === 'string') {
    return createMaskedText(value, options);
  }

  if (value === null || value === undefined) {
    return options.maskText;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return options.maskText;
  }

  return options.maskText;
}

function collectMaskedPointersByPatterns(source: unknown, patterns: string[]): Set<string> {
  const result = new Set<string>();

  patterns.forEach((pattern) => {
    if (!pattern.trim()) {
      return;
    }

    try {
      const pointers = JSONPath({
        path: pattern,
        json: source as any,
        resultType: 'pointer',
        wrap: true,
      }) as unknown;

      if (!Array.isArray(pointers)) {
        return;
      }

      pointers.forEach((pointer) => {
        if (typeof pointer === 'string') {
          result.add(pointer);
        }
      });
    } catch {
      // Ignore invalid pattern and continue masking by remaining rules.
    }
  });

  return result;
}

export function maskJsonSensitiveData(source: unknown, config?: PrivacyMaskConfig): PrivacyMaskResult {
  const normalizedConfig = normalizePrivacyMaskConfig(config);
  const sensitiveKeys = new Set(normalizedConfig.keys.map((key) => key.toLowerCase()));
  const pointersFromPatterns = collectMaskedPointersByPatterns(source, normalizedConfig.jsonPathPatterns);

  const visit = (value: unknown, pointerSegments: string[], forceMask: boolean): { value: unknown; maskedCount: number } => {
    const pointer = toJsonPointer(pointerSegments);
    if (forceMask || pointersFromPatterns.has(pointer)) {
      return {
        value: maskValue(value, normalizedConfig),
        maskedCount: 1,
      };
    }

    if (Array.isArray(value)) {
      let maskedCount = 0;
      const maskedArray = value.map((item, index) => {
        const next = visit(item, [...pointerSegments, String(index)], false);
        maskedCount += next.maskedCount;
        return next.value;
      });
      return {
        value: maskedArray,
        maskedCount,
      };
    }

    if (!isMergeObject(value)) {
      return {
        value,
        maskedCount: 0,
      };
    }

    let maskedCount = 0;
    const maskedObject = Object.entries(value).reduce(
      (result, [key, childValue]) => {
        const shouldMaskByKey = sensitiveKeys.has(key.toLowerCase());
        const next = visit(childValue, [...pointerSegments, key], shouldMaskByKey);
        maskedCount += next.maskedCount;
        result[key] = next.value;
        return result;
      },
      {} as Record<string, unknown>,
    );

    return {
      value: maskedObject,
      maskedCount,
    };
  };

  const masked = visit(source, [], false);
  return {
    masked: masked.value,
    maskedCount: masked.maskedCount,
    pathPatternMatchCount: pointersFromPatterns.size,
  };
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
