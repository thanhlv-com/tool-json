import fs from 'node:fs/promises';
import path from 'node:path';
import { LEGACY_PATH_TO_MODE, MODE_PATHS } from '../src/features/json-tool/modeRoutes.ts';
import { DEFAULT_OG_IMAGE, PAGE_SCHEMA_ID, SITE_NAME, getSeoSnapshot } from '../src/features/json-tool/seo.ts';
import type { Mode } from '../src/features/json-tool/types.ts';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const ROOT_HTML_PATH = path.join(DIST_DIR, 'index.html');

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertBeforeHeadEnd(html: string, tag: string): string {
  if (!html.includes('</head>')) {
    throw new Error('Missing </head> tag in generated HTML.');
  }

  return html.replace('</head>', `  ${tag}\n  </head>`);
}

function upsertTitle(html: string, title: string): string {
  const titleTag = `<title>${escapeHtmlAttribute(title)}</title>`;

  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>[\s\S]*?<\/title>/i, titleTag);
  }

  return insertBeforeHeadEnd(html, titleTag);
}

function upsertMetaTag(
  html: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
): string {
  const escapedKey = escapeRegex(key);
  const matcher = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escapedKey}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${escapeHtmlAttribute(content)}" />`;

  if (matcher.test(html)) {
    return html.replace(matcher, tag);
  }

  return insertBeforeHeadEnd(html, tag);
}

function upsertCanonicalLink(html: string, href: string): string {
  const matcher = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtmlAttribute(href)}" />`;

  if (matcher.test(html)) {
    return html.replace(matcher, tag);
  }

  return insertBeforeHeadEnd(html, tag);
}

function upsertJsonLdScript(html: string, scriptId: string, payload: Record<string, unknown>): string {
  const escapedId = escapeRegex(scriptId);
  const matcher = new RegExp(`<script\\s+[^>]*id=["']${escapedId}["'][^>]*>[\\s\\S]*?<\\/script>`, 'i');
  const script = `<script id="${scriptId}" type="application/ld+json">${JSON.stringify(payload)}</script>`;

  if (matcher.test(html)) {
    return html.replace(matcher, script);
  }

  return insertBeforeHeadEnd(html, script);
}

async function writeRouteHtml(routePath: string, html: string): Promise<void> {
  const normalizedRoute = routePath.replace(/^\/+|\/+$/g, '');
  const outputDir = normalizedRoute.length === 0 ? DIST_DIR : path.join(DIST_DIR, normalizedRoute);
  const outputPath = path.join(outputDir, 'index.html');

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, html, 'utf8');
}

async function prerenderAllRoutes(): Promise<void> {
  const rootHtml = await fs.readFile(ROOT_HTML_PATH, 'utf8');
  const pathToMode = new Map<string, Mode>([['/', 'format']]);

  Object.entries(MODE_PATHS).forEach(([mode, routePath]) => {
    pathToMode.set(routePath, mode as Mode);
  });

  Object.entries(LEGACY_PATH_TO_MODE).forEach(([legacyPath, mode]) => {
    pathToMode.set(legacyPath, mode);
  });

  for (const [routePath, mode] of pathToMode) {
    const seoSnapshot = getSeoSnapshot(mode);
    let routeHtml = rootHtml;

    routeHtml = upsertTitle(routeHtml, seoSnapshot.fullTitle);
    routeHtml = upsertMetaTag(routeHtml, 'name', 'description', seoSnapshot.description);
    routeHtml = upsertMetaTag(
      routeHtml,
      'name',
      'robots',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );
    routeHtml = upsertMetaTag(routeHtml, 'property', 'og:type', 'website');
    routeHtml = upsertMetaTag(routeHtml, 'property', 'og:site_name', SITE_NAME);
    routeHtml = upsertMetaTag(routeHtml, 'property', 'og:title', seoSnapshot.fullTitle);
    routeHtml = upsertMetaTag(routeHtml, 'property', 'og:description', seoSnapshot.description);
    routeHtml = upsertMetaTag(routeHtml, 'property', 'og:url', seoSnapshot.canonicalUrl);
    routeHtml = upsertMetaTag(routeHtml, 'property', 'og:image', DEFAULT_OG_IMAGE);
    routeHtml = upsertMetaTag(routeHtml, 'name', 'twitter:card', 'summary_large_image');
    routeHtml = upsertMetaTag(routeHtml, 'name', 'twitter:title', seoSnapshot.fullTitle);
    routeHtml = upsertMetaTag(routeHtml, 'name', 'twitter:description', seoSnapshot.description);
    routeHtml = upsertMetaTag(routeHtml, 'name', 'twitter:image', DEFAULT_OG_IMAGE);
    routeHtml = upsertCanonicalLink(routeHtml, seoSnapshot.canonicalUrl);
    routeHtml = upsertJsonLdScript(routeHtml, PAGE_SCHEMA_ID, seoSnapshot.pageSchema);

    await writeRouteHtml(routePath, routeHtml);
  }

  console.log(`[ssg] prerendered ${pathToMode.size} routes into ${DIST_DIR}`);
}

prerenderAllRoutes().catch((error) => {
  console.error('[ssg] failed to prerender static routes.');
  console.error(error);
  process.exitCode = 1;
});
