/**
 * fix-i18n — Fill missing keys with English fallback, remove orphaned keys.
 *
 * Usage:
 *   npx tsx scripts/fix-i18n.ts           # fix all languages
 *   npx tsx scripts/fix-i18n.ts --lang fr # fix a specific language
 *   npx tsx scripts/fix-i18n.ts --dry-run # preview changes only
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const MESSAGES_DIR = resolve(import.meta.dirname, '..', 'src', 'messages');
const REFERENCE_LANG = 'en';

// ─── helpers ────────────────────────────────────────────────────────────────

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') {
      result[fullKey] = val;
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flatten(val as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

/** Walk the reference object and set missing keys in the target. */
function deepMerge(target: Record<string, unknown>, ref: Record<string, unknown>, path: string[] = []): number {
  let added = 0;
  for (const [key, val] of Object.entries(ref)) {
    if (typeof val === 'string') {
      if (!(key in target)) {
        target[key] = `[en] ${val}`;
        added++;
      }
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if (!(key in target) || typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {};
      }
      added += deepMerge(target[key] as Record<string, unknown>, val as Record<string, unknown>, [...path, key]);
    }
  }
  return added;
}

/** Remove keys from target that don't exist in reference. */
function deepClean(target: Record<string, unknown>, ref: Record<string, unknown>): number {
  let removed = 0;
  for (const key of Object.keys(target)) {
    if (!(key in ref)) {
      delete target[key];
      removed++;
    } else {
      const tv = target[key];
      const rv = ref[key];
      if (tv !== null && typeof tv === 'object' && !Array.isArray(tv) &&
          rv !== null && typeof rv === 'object' && !Array.isArray(rv)) {
        removed += deepClean(tv as Record<string, unknown>, rv as Record<string, unknown>);
      }
    }
  }
  return removed;
}

// ─── main ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const targetLang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
const dryRun = args.includes('--dry-run');

const refPath = resolve(MESSAGES_DIR, `${REFERENCE_LANG}.json`);
const ref = JSON.parse(readFileSync(refPath, 'utf-8')) as Record<string, unknown>;
const refFlat = flatten(ref);

const files = readdirSync(MESSAGES_DIR)
  .filter(f => f.endsWith('.json') && f !== `${REFERENCE_LANG}.json`)
  .filter(f => !targetLang || f === `${targetLang}.json`);

if (targetLang && files.length === 0) {
  console.error(`❌ Language file not found: ${targetLang}.json`);
  process.exit(1);
}

let totalAdded = 0;
let totalRemoved = 0;

for (const file of files.sort()) {
  const lang = basename(file, '.json');
  const filePath = resolve(MESSAGES_DIR, file);
  const original = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(original) as Record<string, unknown>;

  // Deep clone for comparison
  const beforeFlat = flatten(data);

  const added = deepMerge(data, ref);
  const removed = deepClean(data, ref);

  if (added === 0 && removed === 0) {
    console.log(`✅ ${lang}.json — already complete`);
    continue;
  }

  if (dryRun) {
    console.log(`🔍 ${lang}.json — would add ${added} keys, remove ${removed} orphans`);
  } else {
    const sorted = sortKeys(data);
    writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
    console.log(`✏️  ${lang}.json — added ${added} keys, removed ${removed} orphans`);
  }

  totalAdded += added;
  totalRemoved += removed;
}

console.log(`\nDone. Added: ${totalAdded}  |  Removed: ${totalRemoved}`);

if (dryRun) {
  console.log('🔍 Dry run — no files were modified. Remove --dry-run to apply.\n');
} else if (totalAdded > 0 || totalRemoved > 0) {
  console.log('💡 Run check-i18n.ts to verify the result.\n');
}

// ─── sort keys alphabetically for stable diffs ──────────────────────────────

function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const record = obj as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    sorted[key] = sortKeys(record[key]);
  }
  return sorted;
}
