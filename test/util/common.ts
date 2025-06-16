import assert from 'assert';

/**
 * Reduce logs
 */

export function codeEquals(before: string, after: string) {
  try {
    assert.strictEqual(before, after);
  } catch (e) {
    throw new Error(`Code mismatch: ${e.message}`);
  }
}
