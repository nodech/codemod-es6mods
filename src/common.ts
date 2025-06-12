import type { FileInfo } from 'jscodeshift';
import { namedTypes } from 'ast-types';

export class TransformError extends Error {
  constructor(message: string, file: FileInfo, loc: namedTypes.SourceLocation) {
    super();

    this.name = 'TransformError';
    this.message = `${message} (at ${file?.path}:${loc.start.line}:${loc.start.column})`
  }
}

export function normalizePath(path: string): string {
  if (path.endsWith('.js'))
    return path;

  if (path.endsWith('.json'))
    return path;

  if (path.startsWith('.') || path.startsWith('/')) {
    return path + '.js';
  }

  return path;
}
