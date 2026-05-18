import type { Mode } from './types';

export const MODE_PATHS: Record<Mode, string> = {
  format: '/editor',
  diff: '/diff',
  query: '/query',
  convert: '/yaml',
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
  return PATH_TO_MODE[normalized] ?? null;
}

export function isValidModePath(pathname: string): boolean {
  return getModeFromPathname(pathname) !== null;
}
