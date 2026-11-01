import { pathToFileURL, fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve as pathResolve, dirname as pathDirname } from 'node:path';

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const raw = pathResolve(process.cwd(), 'src', specifier.slice(2));
    const target = existsSync(raw + '.ts')
      ? raw + '.ts'
      : existsSync(raw + '/index.ts')
        ? raw + '/index.ts'
        : existsSync(raw + '.tsx')
          ? raw + '.tsx'
          : raw;
    return nextResolve(pathToFileURL(target).href, context);
  }
  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL &&
    context.parentURL.startsWith('file://')
  ) {
    const parentPath = fileURLToPath(context.parentURL);
    const raw = pathResolve(pathDirname(parentPath), specifier);
    if (!existsSync(raw)) {
      const target = existsSync(raw + '.ts')
        ? raw + '.ts'
        : existsSync(raw + '/index.ts')
          ? raw + '/index.ts'
          : existsSync(raw + '.tsx')
            ? raw + '.tsx'
            : null;
      if (target) {
        return nextResolve(pathToFileURL(target).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
