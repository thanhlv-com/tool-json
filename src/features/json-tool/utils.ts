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

type JsonSchemaNode = JsonSchema | boolean;

type MockGenerationContext = {
  rootSchema: JsonSchemaNode;
  random: () => number;
  maxDepth: number;
  now: Date;
  generatedCount: number;
  refVisitCountByPointer: Record<string, number>;
};

function isJsonSchemaRecord(value: unknown): value is JsonSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  if (state === 0) {
    state = 0x9e3779b9;
  }

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(min: number, max: number, random: () => number): number {
  if (max <= min) {
    return min;
  }

  return min + Math.floor(random() * (max - min + 1));
}

function normalizeInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.trunc(value);
}

function cloneMockValue<T>(value: T): T {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function decodeJsonPointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function resolveLocalSchemaRef(rootSchema: JsonSchemaNode, ref: string): JsonSchemaNode | null {
  if (ref === '#') {
    return rootSchema;
  }

  if (!ref.startsWith('#/')) {
    return null;
  }

  const tokens = ref
    .slice(2)
    .split('/')
    .map((token) => decodeJsonPointerToken(token));

  let current: unknown = rootSchema;
  for (const token of tokens) {
    if (Array.isArray(current)) {
      const numericToken = Number(token);
      if (!Number.isInteger(numericToken) || numericToken < 0 || numericToken >= current.length) {
        return null;
      }
      current = current[numericToken];
      continue;
    }

    if (!isJsonSchemaRecord(current)) {
      return null;
    }

    current = current[token];
  }

  if (typeof current === 'boolean' || isJsonSchemaRecord(current)) {
    return current;
  }

  return null;
}

function coerceStringLength(value: string, minLength: number, maxLength: number): string {
  let normalized = value;

  if (normalized.length < minLength) {
    normalized = `${normalized}${'x'.repeat(minLength - normalized.length)}`;
  }

  if (normalized.length > maxLength) {
    normalized = normalized.slice(0, maxLength);
  }

  return normalized;
}

function createUuid(random: () => number): string {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (character) => {
    const randomNibble = Math.floor(random() * 16);
    const nibble = character === 'x' ? randomNibble : (randomNibble & 0x3) | 0x8;
    return nibble.toString(16);
  });
}

function generateStringValue(
  schema: JsonSchema,
  path: string,
  context: MockGenerationContext,
  minLength: number,
  maxLength: number,
): string {
  const format = typeof schema.format === 'string' ? schema.format : '';
  const runningCount = context.generatedCount;

  if (format === 'email') {
    return coerceStringLength(`user${runningCount}@example.com`, minLength, maxLength);
  }

  if (format === 'uri' || format === 'url') {
    return coerceStringLength(`https://example.com/resource/${runningCount}`, minLength, maxLength);
  }

  if (format === 'date-time') {
    const date = new Date(context.now.getTime() + runningCount * 60_000);
    return coerceStringLength(date.toISOString(), minLength, maxLength);
  }

  if (format === 'date') {
    const date = new Date(context.now.getTime() + runningCount * 86_400_000);
    return coerceStringLength(date.toISOString().slice(0, 10), minLength, maxLength);
  }

  if (format === 'uuid') {
    return coerceStringLength(createUuid(context.random), minLength, maxLength);
  }

  if (format === 'ipv4') {
    const octetA = randomInt(1, 223, context.random);
    const octetB = randomInt(0, 255, context.random);
    const octetC = randomInt(0, 255, context.random);
    const octetD = randomInt(1, 254, context.random);
    return coerceStringLength(`${octetA}.${octetB}.${octetC}.${octetD}`, minLength, maxLength);
  }

  const pattern = typeof schema.pattern === 'string' ? schema.pattern : '';
  if (pattern.includes('[0-9]')) {
    const digits = String(randomInt(10000, 99999, context.random));
    return coerceStringLength(digits, minLength, maxLength);
  }

  if (pattern.includes('[A-Z]')) {
    return coerceStringLength(`CODE${runningCount}`, minLength, maxLength);
  }

  const leafKey = path.split('.').pop()?.replace(/\[[0-9]+\]/g, '') || 'value';
  return coerceStringLength(`${leafKey}_${runningCount}`, minLength, maxLength);
}

function inferSchemaType(schema: JsonSchema): string {
  if (typeof schema.type === 'string') {
    return schema.type;
  }

  if (Array.isArray(schema.type)) {
    const candidates = schema.type.filter((item): item is string => typeof item === 'string');
    if (candidates.length > 0) {
      return candidates.find((candidate) => candidate !== 'null') ?? candidates[0];
    }
  }

  if (isJsonSchemaRecord(schema.properties)) {
    return 'object';
  }

  if (schema.items !== undefined || Array.isArray(schema.prefixItems)) {
    return 'array';
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    const first = schema.enum[0];
    if (first === null) return 'null';
    if (Array.isArray(first)) return 'array';
    if (typeof first === 'object') return 'object';
    if (typeof first === 'number' && Number.isInteger(first)) return 'integer';
    return typeof first;
  }

  return 'object';
}

function generateBySchema(
  schemaNode: JsonSchemaNode,
  path: string,
  depth: number,
  context: MockGenerationContext,
): unknown {
  if (depth > context.maxDepth) {
    return null;
  }

  if (schemaNode === true) {
    return {};
  }

  if (schemaNode === false) {
    return null;
  }

  if (typeof schemaNode.$ref === 'string') {
    const refPointer = schemaNode.$ref;
    const currentVisits = context.refVisitCountByPointer[refPointer] ?? 0;

    if (currentVisits > 4) {
      return null;
    }

    const resolvedSchema = resolveLocalSchemaRef(context.rootSchema, refPointer);
    if (resolvedSchema) {
      context.refVisitCountByPointer[refPointer] = currentVisits + 1;
      const generated = generateBySchema(resolvedSchema, path, depth + 1, context);
      context.refVisitCountByPointer[refPointer] = currentVisits;
      return generated;
    }
  }

  if (schemaNode.const !== undefined) {
    return cloneMockValue(schemaNode.const);
  }

  if (Array.isArray(schemaNode.enum) && schemaNode.enum.length > 0) {
    const selected = schemaNode.enum[randomInt(0, schemaNode.enum.length - 1, context.random)];
    return cloneMockValue(selected);
  }

  if (schemaNode.example !== undefined) {
    return cloneMockValue(schemaNode.example);
  }

  if (Array.isArray(schemaNode.examples) && schemaNode.examples.length > 0) {
    const selected = schemaNode.examples[randomInt(0, schemaNode.examples.length - 1, context.random)];
    return cloneMockValue(selected);
  }

  if (schemaNode.default !== undefined) {
    return cloneMockValue(schemaNode.default);
  }

  if (Array.isArray(schemaNode.oneOf) && schemaNode.oneOf.length > 0) {
    const selectedSchema = schemaNode.oneOf[randomInt(0, schemaNode.oneOf.length - 1, context.random)];
    return generateBySchema(selectedSchema as JsonSchemaNode, path, depth + 1, context);
  }

  if (Array.isArray(schemaNode.anyOf) && schemaNode.anyOf.length > 0) {
    const selectedSchema = schemaNode.anyOf[randomInt(0, schemaNode.anyOf.length - 1, context.random)];
    return generateBySchema(selectedSchema as JsonSchemaNode, path, depth + 1, context);
  }

  if (Array.isArray(schemaNode.allOf) && schemaNode.allOf.length > 0) {
    const generatedParts = schemaNode.allOf.map((childSchema, childIndex) =>
      generateBySchema(childSchema as JsonSchemaNode, `${path}.allOf[${childIndex}]`, depth + 1, context),
    );

    if (generatedParts.every((part) => part && typeof part === 'object' && !Array.isArray(part))) {
      return Object.assign({}, ...generatedParts);
    }

    return generatedParts[generatedParts.length - 1] ?? null;
  }

  const normalizedType = inferSchemaType(schemaNode);

  if (normalizedType === 'object') {
    const properties = isJsonSchemaRecord(schemaNode.properties)
      ? (schemaNode.properties as Record<string, JsonSchemaNode>)
      : {};
    const required = Array.isArray(schemaNode.required)
      ? schemaNode.required.filter((item): item is string => typeof item === 'string')
      : [];
    const optionalKeys = Object.keys(properties).filter((key) => !required.includes(key));

    const objectResult: Record<string, unknown> = {};
    required.forEach((requiredKey) => {
      objectResult[requiredKey] = generateBySchema(properties[requiredKey] ?? true, `${path}.${requiredKey}`, depth + 1, context);
    });

    const minProperties = Math.max(0, normalizeInteger(schemaNode.minProperties, 0));
    const maxPropertiesRaw = normalizeInteger(schemaNode.maxProperties, Number.POSITIVE_INFINITY);
    const maxProperties =
      Number.isFinite(maxPropertiesRaw) && maxPropertiesRaw >= minProperties ? maxPropertiesRaw : Number.POSITIVE_INFINITY;

    for (const key of optionalKeys) {
      if (Object.keys(objectResult).length >= maxProperties) {
        break;
      }
      if (context.random() <= 0.6) {
        objectResult[key] = generateBySchema(properties[key], `${path}.${key}`, depth + 1, context);
      }
    }

    const additionalPropertiesSchema = schemaNode.additionalProperties;
    let extraIndex = 1;
    while (Object.keys(objectResult).length < minProperties) {
      if (isJsonSchemaRecord(additionalPropertiesSchema) || typeof additionalPropertiesSchema === 'boolean') {
        const extraKey = `extraField${extraIndex}`;
        if (!Object.prototype.hasOwnProperty.call(objectResult, extraKey)) {
          objectResult[extraKey] = generateBySchema(
            additionalPropertiesSchema,
            `${path}.${extraKey}`,
            depth + 1,
            context,
          );
        }
        extraIndex += 1;
      } else if (optionalKeys.length > 0) {
        const missingOptional = optionalKeys.find((key) => !Object.prototype.hasOwnProperty.call(objectResult, key));
        if (!missingOptional) {
          break;
        }
        objectResult[missingOptional] = generateBySchema(
          properties[missingOptional],
          `${path}.${missingOptional}`,
          depth + 1,
          context,
        );
      } else {
        break;
      }
    }

    return objectResult;
  }

  if (normalizedType === 'array') {
    const minItems = Math.max(0, normalizeInteger(schemaNode.minItems, 1));
    const maxItemsRaw = normalizeInteger(schemaNode.maxItems, Math.max(minItems, 4));
    const maxItemsCap = Math.max(minItems, Math.min(8, Number.isFinite(maxItemsRaw) ? maxItemsRaw : minItems + 3));
    const targetLength = randomInt(minItems, maxItemsCap, context.random);

    const prefixItems = Array.isArray(schemaNode.prefixItems) ? (schemaNode.prefixItems as JsonSchemaNode[]) : [];
    const itemSchema = (schemaNode.items ?? true) as JsonSchemaNode;

    const items: unknown[] = [];
    for (let index = 0; index < targetLength; index += 1) {
      const currentSchema = prefixItems[index] ?? itemSchema;
      items.push(generateBySchema(currentSchema, `${path}[${index}]`, depth + 1, context));
    }

    return items;
  }

  if (normalizedType === 'string') {
    const minLength = Math.max(0, normalizeInteger(schemaNode.minLength, 3));
    const maxLengthRaw = normalizeInteger(schemaNode.maxLength, Math.max(minLength, 24));
    const maxLength = Math.max(minLength, maxLengthRaw);
    return generateStringValue(schemaNode, path, context, minLength, maxLength);
  }

  if (normalizedType === 'integer' || normalizedType === 'number') {
    const minimum =
      typeof schemaNode.minimum === 'number'
        ? schemaNode.minimum
        : typeof schemaNode.exclusiveMinimum === 'number'
          ? schemaNode.exclusiveMinimum + (normalizedType === 'integer' ? 1 : 0.1)
          : 0;
    const maximum =
      typeof schemaNode.maximum === 'number'
        ? schemaNode.maximum
        : typeof schemaNode.exclusiveMaximum === 'number'
          ? schemaNode.exclusiveMaximum - (normalizedType === 'integer' ? 1 : 0.1)
          : minimum + 100;
    const safeMaximum = maximum < minimum ? minimum : maximum;
    const multipleOf = typeof schemaNode.multipleOf === 'number' && schemaNode.multipleOf > 0 ? schemaNode.multipleOf : null;

    if (normalizedType === 'integer') {
      let result = randomInt(Math.ceil(minimum), Math.floor(safeMaximum), context.random);
      if (multipleOf) {
        result = Math.round(result / multipleOf) * multipleOf;
      }
      return Math.trunc(result);
    }

    let result = minimum + context.random() * (safeMaximum - minimum);
    if (multipleOf) {
      result = Math.round(result / multipleOf) * multipleOf;
    }
    return Number(result.toFixed(6));
  }

  if (normalizedType === 'boolean') {
    return context.random() >= 0.5;
  }

  if (normalizedType === 'null') {
    return null;
  }

  return {};
}

export function generateMockDataFromSchema(
  schema: unknown,
  options?: {
    count?: number;
    seed?: number;
    maxDepth?: number;
  },
): unknown {
  if (!isJsonSchemaRecord(schema) && typeof schema !== 'boolean') {
    throw new Error('Schema must be a JSON object or boolean');
  }

  const count = Math.max(1, normalizeInteger(options?.count, 1));
  const seed = normalizeInteger(options?.seed, Date.now());
  const maxDepth = Math.max(1, normalizeInteger(options?.maxDepth, 8));
  const random = createSeededRandom(seed);

  const context: MockGenerationContext = {
    rootSchema: schema,
    random,
    maxDepth,
    now: new Date(),
    generatedCount: 0,
    refVisitCountByPointer: {},
  };

  const items: unknown[] = [];
  for (let index = 0; index < count; index += 1) {
    context.generatedCount = index + 1;
    items.push(generateBySchema(schema, '$', 0, context));
  }

  return count === 1 ? items[0] : items;
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

type DtoInferredType =
  | { kind: 'unknown' }
  | { kind: 'null' }
  | { kind: 'boolean' }
  | { kind: 'integer' }
  | { kind: 'number' }
  | { kind: 'string' }
  | { kind: 'array'; element: DtoInferredType }
  | { kind: 'object'; properties: Record<string, { type: DtoInferredType; optional: boolean }> }
  | { kind: 'union'; members: DtoInferredType[] };

const TS_RESERVED_WORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'as',
  'implements',
  'interface',
  'let',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'yield',
  'any',
  'boolean',
  'constructor',
  'declare',
  'get',
  'module',
  'require',
  'number',
  'set',
  'string',
  'symbol',
  'type',
  'from',
  'of',
]);

const JAVA_RESERVED_WORDS = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
  'true',
  'false',
  'null',
  'record',
  'sealed',
  'permits',
  'var',
  'yield',
]);

function splitIdentifierWords(value: string): string[] {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim();

  if (!normalized) {
    return [];
  }

  return normalized.split(/\s+/).filter(Boolean);
}

function toPascalCase(value: string, fallback: string): string {
  const words = splitIdentifierWords(value);
  const base =
    words.length > 0
      ? words
          .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
          .join('')
      : fallback;

  if (!base) {
    return fallback;
  }

  return /^[0-9]/.test(base) ? `N${base}` : base;
}

function toCamelCase(value: string, fallback: string): string {
  const pascal = toPascalCase(value, fallback);
  if (!pascal) {
    return fallback;
  }

  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function createUniqueName(base: string, usedNames: Set<string>): string {
  let candidate = base;
  let suffix = 2;

  while (usedNames.has(candidate)) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

function isDtoObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inferDtoType(value: unknown): DtoInferredType {
  if (value === null) {
    return { kind: 'null' };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        kind: 'array',
        element: { kind: 'unknown' },
      };
    }

    const inferredElement = value
      .map((item) => inferDtoType(item))
      .reduce((current, next) => mergeDtoTypes(current, next));
    return {
      kind: 'array',
      element: inferredElement,
    };
  }

  if (isDtoObject(value)) {
    const properties = Object.entries(value).reduce(
      (result, [key, childValue]) => {
        result[key] = {
          type: inferDtoType(childValue),
          optional: false,
        };
        return result;
      },
      {} as Record<string, { type: DtoInferredType; optional: boolean }>,
    );

    return {
      kind: 'object',
      properties,
    };
  }

  if (typeof value === 'number') {
    return {
      kind: Number.isInteger(value) ? 'integer' : 'number',
    };
  }

  if (typeof value === 'string') {
    return { kind: 'string' };
  }

  if (typeof value === 'boolean') {
    return { kind: 'boolean' };
  }

  return { kind: 'unknown' };
}

function serializeDtoType(type: DtoInferredType): string {
  if (type.kind === 'array') {
    return `array(${serializeDtoType(type.element)})`;
  }

  if (type.kind === 'object') {
    const serializedProperties = Object.keys(type.properties)
      .sort()
      .map((key) => {
        const property = type.properties[key];
        return `${JSON.stringify(key)}${property.optional ? '?' : ''}:${serializeDtoType(property.type)}`;
      })
      .join(',');
    return `object({${serializedProperties}})`;
  }

  if (type.kind === 'union') {
    return `union(${type.members.map((member) => serializeDtoType(member)).sort().join('|')})`;
  }

  return type.kind;
}

function simplifyUnionMembers(members: DtoInferredType[]): DtoInferredType[] {
  if (members.some((member) => member.kind === 'unknown')) {
    return [{ kind: 'unknown' }];
  }

  const filtered = members.filter((member) => !(member.kind === 'integer' && members.some((item) => item.kind === 'number')));
  const map = new Map<string, DtoInferredType>();
  filtered.forEach((member) => {
    map.set(serializeDtoType(member), member);
  });

  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, member]) => member);
}

function createUnionType(rawMembers: DtoInferredType[]): DtoInferredType {
  const flattenedMembers = rawMembers.flatMap((member) => (member.kind === 'union' ? member.members : [member]));
  const members = simplifyUnionMembers(flattenedMembers);

  if (members.length === 1) {
    return members[0];
  }

  return {
    kind: 'union',
    members,
  };
}

function mergeDtoObjectProperties(
  left: Record<string, { type: DtoInferredType; optional: boolean }>,
  right: Record<string, { type: DtoInferredType; optional: boolean }>,
): Record<string, { type: DtoInferredType; optional: boolean }> {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const merged: Record<string, { type: DtoInferredType; optional: boolean }> = {};

  keys.forEach((key) => {
    const leftProperty = left[key];
    const rightProperty = right[key];

    if (leftProperty && rightProperty) {
      merged[key] = {
        type: mergeDtoTypes(leftProperty.type, rightProperty.type),
        optional: leftProperty.optional || rightProperty.optional,
      };
      return;
    }

    if (leftProperty) {
      merged[key] = {
        type: leftProperty.type,
        optional: true,
      };
      return;
    }

    if (rightProperty) {
      merged[key] = {
        type: rightProperty.type,
        optional: true,
      };
    }
  });

  return merged;
}

function mergeDtoTypes(left: DtoInferredType, right: DtoInferredType): DtoInferredType {
  if (left.kind === 'unknown' || right.kind === 'unknown') {
    return { kind: 'unknown' };
  }

  if (left.kind === right.kind) {
    if (left.kind === 'object' && right.kind === 'object') {
      return {
        kind: 'object',
        properties: mergeDtoObjectProperties(left.properties, right.properties),
      };
    }

    if (left.kind === 'array' && right.kind === 'array') {
      return {
        kind: 'array',
        element: mergeDtoTypes(left.element, right.element),
      };
    }

    if (left.kind === 'union' && right.kind === 'union') {
      return createUnionType([...left.members, ...right.members]);
    }

    return left;
  }

  if ((left.kind === 'integer' && right.kind === 'number') || (left.kind === 'number' && right.kind === 'integer')) {
    return { kind: 'number' };
  }

  if (left.kind === 'union') {
    return createUnionType([...left.members, right]);
  }

  if (right.kind === 'union') {
    return createUnionType([left, ...right.members]);
  }

  return createUnionType([left, right]);
}

function isValidTsIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) && !TS_RESERVED_WORDS.has(value);
}

function toTsPropertyName(key: string): string {
  return isValidTsIdentifier(key) ? key : JSON.stringify(key);
}

function shouldWrapTsArrayElement(typeExpression: string): boolean {
  return typeExpression.includes(' | ');
}

type TsDtoContext = {
  interfaceNameBySignature: Map<string, string>;
  interfaceCodeByName: Map<string, string>;
  usedInterfaceNames: Set<string>;
};

function resolveTsDtoType(type: DtoInferredType, nameHint: string, context: TsDtoContext): string {
  if (type.kind === 'object') {
    const signature = serializeDtoType(type);
    const existingName = context.interfaceNameBySignature.get(signature);
    if (existingName) {
      return existingName;
    }

    const interfaceName = createUniqueName(toPascalCase(nameHint, 'Type'), context.usedInterfaceNames);
    context.interfaceNameBySignature.set(signature, interfaceName);

    const propertyLines = Object.keys(type.properties)
      .sort()
      .map((key) => {
        const property = type.properties[key];
        const propertyType = resolveTsDtoType(property.type, `${interfaceName}${toPascalCase(key, 'Item')}`, context);
        const optionalSuffix = property.optional ? '?' : '';
        return `  ${toTsPropertyName(key)}${optionalSuffix}: ${propertyType};`;
      });

    const interfaceBody = propertyLines.length > 0 ? propertyLines.join('\n') : '  [key: string]: unknown;';
    context.interfaceCodeByName.set(
      interfaceName,
      `export interface ${interfaceName} {\n${interfaceBody}\n}`,
    );
    return interfaceName;
  }

  if (type.kind === 'array') {
    const elementType = resolveTsDtoType(type.element, `${nameHint}Item`, context);
    return shouldWrapTsArrayElement(elementType) ? `(${elementType})[]` : `${elementType}[]`;
  }

  if (type.kind === 'union') {
    const unionTypes = [...new Set(type.members.map((member) => resolveTsDtoType(member, nameHint, context)))];
    return unionTypes.join(' | ');
  }

  if (type.kind === 'string') return 'string';
  if (type.kind === 'boolean') return 'boolean';
  if (type.kind === 'integer' || type.kind === 'number') return 'number';
  if (type.kind === 'null') return 'null';
  return 'unknown';
}

export function convertJsonToTypeScriptDto(value: unknown, rootName = 'RootDto'): string {
  const inferredType = inferDtoType(value);
  const normalizedRootName = toPascalCase(rootName, 'RootDto');
  const context: TsDtoContext = {
    interfaceNameBySignature: new Map(),
    interfaceCodeByName: new Map(),
    usedInterfaceNames: new Set(),
  };

  const rootTypeExpression = resolveTsDtoType(inferredType, normalizedRootName, context);
  const rootInterfaceCode = context.interfaceCodeByName.get(normalizedRootName);
  const nestedInterfaceCodes = [...context.interfaceCodeByName.entries()]
    .filter(([name]) => name !== normalizedRootName)
    .map(([, code]) => code);

  if (rootInterfaceCode) {
    return [rootInterfaceCode, ...nestedInterfaceCodes].join('\n\n');
  }

  const rootAlias = `export type ${normalizedRootName} = ${rootTypeExpression};`;
  if (nestedInterfaceCodes.length === 0) {
    return rootAlias;
  }

  return [rootAlias, ...nestedInterfaceCodes].join('\n\n');
}

function toJavaFieldName(key: string): string {
  const baseName = toCamelCase(key, 'value').replace(/[^A-Za-z0-9_]/g, '_');
  const normalized = /^[A-Za-z_]/.test(baseName) ? baseName : `_${baseName}`;
  return JAVA_RESERVED_WORDS.has(normalized) ? `${normalized}Value` : normalized;
}

function escapeJavaCommentText(value: string): string {
  return value.replace(/\*\//g, '*\\/');
}

type JavaDtoContext = {
  classNameBySignature: Map<string, string>;
  nestedClassCodeByName: Map<string, string>;
  usedClassNames: Set<string>;
  requiresListImport: boolean;
};

function resolveJavaDtoType(type: DtoInferredType, nameHint: string, context: JavaDtoContext): string {
  if (type.kind === 'object') {
    const signature = serializeDtoType(type);
    const existingName = context.classNameBySignature.get(signature);
    if (existingName) {
      return existingName;
    }

    const className = createUniqueName(toPascalCase(nameHint, 'Type'), context.usedClassNames);
    context.classNameBySignature.set(signature, className);

    const fieldLines: string[] = [];
    Object.keys(type.properties)
      .sort()
      .forEach((key) => {
        const property = type.properties[key];
        const fieldType = resolveJavaDtoType(property.type, `${className}${toPascalCase(key, 'Item')}`, context);
        const fieldName = toJavaFieldName(key);

        if (fieldName !== key) {
          fieldLines.push(`    // JSON key: ${escapeJavaCommentText(key)}`);
        }
        fieldLines.push(`    public ${fieldType} ${fieldName};`);
      });

    const body = fieldLines.length > 0 ? fieldLines.join('\n') : '    // empty object';
    context.nestedClassCodeByName.set(className, `  public static class ${className} {\n${body}\n  }`);
    return className;
  }

  if (type.kind === 'array') {
    context.requiresListImport = true;
    const elementType = resolveJavaDtoType(type.element, `${nameHint}Item`, context);
    return `List<${elementType}>`;
  }

  if (type.kind === 'union') {
    const nonNullMembers = type.members.filter((member) => member.kind !== 'null');
    if (nonNullMembers.length === 1 && type.members.length === 2) {
      return resolveJavaDtoType(nonNullMembers[0], nameHint, context);
    }
    return 'Object';
  }

  if (type.kind === 'string') return 'String';
  if (type.kind === 'boolean') return 'Boolean';
  if (type.kind === 'integer') return 'Integer';
  if (type.kind === 'number') return 'Double';
  return 'Object';
}

function buildJavaRootClassBody(
  rootType: DtoInferredType,
  rootClassName: string,
  context: JavaDtoContext,
): string {
  if (rootType.kind !== 'object') {
    const rootValueType = resolveJavaDtoType(rootType, `${rootClassName}Value`, context);
    return `  public ${rootValueType} value;`;
  }

  const rootSignature = serializeDtoType(rootType);
  context.classNameBySignature.set(rootSignature, rootClassName);

  const fieldLines: string[] = [];
  Object.keys(rootType.properties)
    .sort()
    .forEach((key) => {
      const property = rootType.properties[key];
      const fieldType = resolveJavaDtoType(property.type, `${rootClassName}${toPascalCase(key, 'Item')}`, context);
      const fieldName = toJavaFieldName(key);

      if (fieldName !== key) {
        fieldLines.push(`  // JSON key: ${escapeJavaCommentText(key)}`);
      }
      fieldLines.push(`  public ${fieldType} ${fieldName};`);
    });

  return fieldLines.length > 0 ? fieldLines.join('\n') : '  // empty object';
}

export function convertJsonToJavaDto(value: unknown, rootClassName = 'RootDto'): string {
  const inferredType = inferDtoType(value);
  const normalizedRootClassName = toPascalCase(rootClassName, 'RootDto');
  const context: JavaDtoContext = {
    classNameBySignature: new Map(),
    nestedClassCodeByName: new Map(),
    usedClassNames: new Set([normalizedRootClassName]),
    requiresListImport: false,
  };

  const rootBody = buildJavaRootClassBody(inferredType, normalizedRootClassName, context);
  const nestedClassCodes = [...context.nestedClassCodeByName.entries()]
    .filter(([name]) => name !== normalizedRootClassName)
    .map(([, code]) => code);
  const importBlock = context.requiresListImport ? 'import java.util.List;\n\n' : '';
  const nestedBlock = nestedClassCodes.length > 0 ? `\n\n${nestedClassCodes.join('\n\n')}` : '';

  return `${importBlock}public class ${normalizedRootClassName} {\n${rootBody}${nestedBlock}\n}`;
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
