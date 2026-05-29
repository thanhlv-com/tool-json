import { MODE_PATHS } from './modeRoutes';
import type { Mode } from './types';

export const SITE_NAME = 'JSON Dev Tool';
export const SITE_URL = 'https://json-tools.thanhlv.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/pwa-512x512.svg`;
export const PAGE_SCHEMA_ID = 'ld-json-page';

type ModeSeoConfig = {
  title: string;
  description: string;
};

export const MODE_SEO: Record<Mode, ModeSeoConfig> = {
  format: {
    title: 'JSON Editor & Validator',
    description: 'Format, minify, and validate JSON instantly in a fast online editor.',
  },
  diff: {
    title: 'JSON Diff Tool',
    description: 'Compare two JSON documents and inspect detailed path-by-path differences.',
  },
  merge: {
    title: 'JSON Merge Tool',
    description: 'Merge left and right JSON structures with a clear merge summary.',
  },
  query: {
    title: 'JSONPath Query Tool',
    description: 'Run JSONPath queries to extract and inspect nested JSON values.',
  },
  pipeline: {
    title: 'JSON Transform Pipeline',
    description: 'Apply query, set, remove, pick, mask, and convert steps on JSON data.',
  },
  privacy: {
    title: 'JSON Privacy Masking',
    description: 'Mask sensitive JSON fields by key names and JSONPath patterns.',
  },
  tree: {
    title: 'JSON Tree Explorer',
    description: 'Explore JSON structure with tree navigation, JSON Pointer, and JSONPath.',
  },
  convert: {
    title: 'JSON Converter',
    description: 'Convert JSON to YAML, XML, Properties, TypeScript DTO, or Java DTO.',
  },
  schemaGenerate: {
    title: 'JSON Schema Generator',
    description: 'Generate JSON Schema from sample JSON payloads.',
  },
  schemaMock: {
    title: 'JSON Schema Mock Data',
    description: 'Generate mock JSON data from JSON Schema with configurable row counts.',
  },
  schemaValidate: {
    title: 'JSON Schema Validator',
    description: 'Validate JSON against JSON Schema using draft-07, 2019-09, or 2020-12.',
  },
  convertCsv: {
    title: 'JSON CSV Converter',
    description: 'Convert JSON to CSV or CSV to JSON with delimiter and quoting options.',
  },
  escape: {
    title: 'JSON String Escape Tool',
    description: 'Escape or unescape JSON string content quickly.',
  },
  patch: {
    title: 'JSON Patch Tool',
    description: 'Generate and apply RFC 6902 JSON Patch operations.',
  },
};

function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, `${SITE_URL}/`).toString();
}

function upsertMetaTag(attribute: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (existing) {
    existing.setAttribute('content', content);
    return;
  }

  const meta = document.createElement('meta');
  meta.setAttribute(attribute, key);
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

function upsertCanonicalLink(href: string): void {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (existing) {
    existing.setAttribute('href', href);
    return;
  }

  const link = document.createElement('link');
  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', href);
  document.head.appendChild(link);
}

function upsertJsonLdScript(id: string, payload: Record<string, unknown>): void {
  const existing = document.head.querySelector<HTMLScriptElement>(`script#${id}[type="application/ld+json"]`);
  const serializedPayload = JSON.stringify(payload);

  if (existing) {
    existing.textContent = serializedPayload;
    return;
  }

  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = serializedPayload;
  document.head.appendChild(script);
}

export type SeoSnapshot = {
  fullTitle: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  pageSchema: Record<string, unknown>;
};

export function getSeoSnapshot(mode: Mode): SeoSnapshot {
  const seo = MODE_SEO[mode];
  const canonicalPath = MODE_PATHS[mode];
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const fullTitle = `${seo.title} | ${SITE_NAME}`;
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    description: seo.description,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
    },
  };

  return {
    fullTitle,
    description: seo.description,
    canonicalPath,
    canonicalUrl,
    pageSchema,
  };
}

export function applySeoForMode(mode: Mode): void {
  if (typeof document === 'undefined') {
    return;
  }

  const seo = getSeoSnapshot(mode);

  document.title = seo.fullTitle;

  upsertMetaTag('name', 'description', seo.description);
  upsertMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:site_name', SITE_NAME);
  upsertMetaTag('property', 'og:title', seo.fullTitle);
  upsertMetaTag('property', 'og:description', seo.description);
  upsertMetaTag('property', 'og:url', seo.canonicalUrl);
  upsertMetaTag('property', 'og:image', DEFAULT_OG_IMAGE);

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', seo.fullTitle);
  upsertMetaTag('name', 'twitter:description', seo.description);
  upsertMetaTag('name', 'twitter:image', DEFAULT_OG_IMAGE);

  upsertCanonicalLink(seo.canonicalUrl);
  upsertJsonLdScript(PAGE_SCHEMA_ID, seo.pageSchema);
}
