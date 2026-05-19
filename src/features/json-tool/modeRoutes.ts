import type { Mode } from './types';

export const MODE_PATHS: Record<Mode, string> = {
  format: '/editor',
  diff: '/diff',
  merge: '/merge',
  query: '/query',
  convert: '/convert',
  schemaGenerate: '/schema-generate',
  schemaValidate: '/schema-validate',
  convertCsv: '/csv',
  escape: '/escape',
  patch: '/patch',
};

const LEGACY_PATH_TO_MODE: Record<string, Mode> = {
  '/yaml': 'convert',
};

const PATH_TO_MODE: Record<string, Mode> = Object.entries(MODE_PATHS).reduce(
  (result, [mode, path]) => {
    result[path] = mode as Mode;
    return result;
  },
  {} as Record<string, Mode>,
);

export function getModeFromPathname(pathname: string): Mode | null {
  const normalized = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return PATH_TO_MODE[normalized] ?? LEGACY_PATH_TO_MODE[normalized] ?? null;
}

export function isValidModePath(pathname: string): boolean {
  return getModeFromPathname(pathname) !== null;
}
