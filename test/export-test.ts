import { describe, it } from 'node:test';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { transformExports } from '../src/exports.ts';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dataDir = path.join(__dirname, 'data');
const transformExportsDir = path.join(dataDir, 'transform-exports');

describe('Transform Exports', function() {
  const files = fs.readdirSync(transformExportsDir);
  const testMap = files.reduce((map, filename) => {
    const filepath = path.join(transformExportsDir, filename);
    const isBefore = filename.endsWith('.before.js');
    const isAfter = filename.endsWith('.after.js');
    const testName = filename.replace(/\.(before|after)\.js$/, '');

    if (!isBefore && !isAfter)
      return map;

    const testEntry = map.get(testName) || {};
    const key = isBefore ? 'before' : 'after';

    testEntry[key] = fs.readFileSync(filepath).toString('utf8');

    map.set(testName, testEntry);

    return map;
  }, new Map<string, { before?: string, after?: string }>());

  for (const [name, {before, after}] of testMap.entries()) {
    it(`should transform ${name}`, () => {
      if (!before) {
        throw new Error(`Before does not exist for ${name}.`);
      }

      if (!after) {
        throw new Error(`After does not exist for ${name}.`);
      }

      const transformed = transformExports(before);
      assert.strictEqual(transformed, after);
    });
  }
});
