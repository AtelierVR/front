/**
 * check-i18n — Compare all messages/*.json against en.json (source of truth).
 *
 * Usage:
 *   npx tsx scripts/check-i18n.ts          # check all
 *   npx tsx scripts/check-i18n.ts --lang fr # check a specific language
 *
 * Reports:
 *   - Keys present in en.json but MISSING in target language
 *   - Keys present in target language but NOT in en.json (orphaned)
 *   - Placeholder count mismatches (e.g. {{count}} vs no placeholder)
 */

import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const MESSAGES_DIR = resolve(import.meta.dirname, '..', 'src', 'messages');
const REFERENCE_LANG = 'en';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Recursively flatten a nested object into dot.separated keys → string values. */
function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') {
      result[fullKey] = val;
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flatten(val as Record<string, unknown>, fullKey));
    }
    // skip non-string, non-object values (arrays, numbers, etc.)
  }
  return result;
}

/** Count {{placeholder}} occurrences in a string. */
function placeholderCount(s: string): number {
  return (s.match(/\{\{.+?\}\}/g) || []).length;
}

/** Extract placeholder names from a string. */
function placeholders(s: string): string[] {
  return Array.from(s.matchAll(/\{\{(.+?)\}\}/g)).map(m => m[1]);
}

// ─── main ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const targetLang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
const showDetails = args.includes('--details') || args.includes('-d');

// Load reference
const refPath = resolve(MESSAGES_DIR, `${REFERENCE_LANG}.json`);
const refRaw = JSON.parse(readFileSync(refPath, 'utf-8')) as Record<string, unknown>;
const refFlat = flatten(refRaw);
const refKeys = Object.keys(refFlat);

console.log(`\n📖 Reference: ${REFERENCE_LANG}.json (${refKeys.length} keys)\n`);

// Gather language files
import { readdirSync } from 'node:fs';
const files = readdirSync(MESSAGES_DIR)
  .filter(f => f.endsWith('.json') && f !== `${REFERENCE_LANG}.json`)
  .filter(f => !targetLang || f === `${targetLang}.json`);

if (targetLang && files.length === 0) {
  console.error(`❌ Language file not found: ${targetLang}.json`);
  process.exit(1);
}

let totalMissing = 0;
let totalOrphaned = 0;
let totalMismatches = 0;

for (const file of files.sort()) {
  const lang = basename(file, '.json');
  const langRaw = JSON.parse(readFileSync(resolve(MESSAGES_DIR, file), 'utf-8')) as Record<string, unknown>;
  const langFlat = flatten(langRaw);
  const langKeys = Object.keys(langFlat);

  const missing = refKeys.filter(k => !(k in langFlat));
  const orphaned = langKeys.filter(k => !(k in refFlat));

  // Placeholder mismatches
  const mismatches: { key: string; ref: string; lang: string }[] = [];
  for (const k of refKeys) {
    if (!(k in langFlat)) continue;
    if (placeholderCount(refFlat[k]) !== placeholderCount(langFlat[k])) {
      mismatches.push({ key: k, ref: refFlat[k], lang: langFlat[k] });
    }
  }

  const coverage = refKeys.length > 0 ? ((refKeys.length - missing.length) / refKeys.length * 100).toFixed(1) : '0';

  if (missing.length === 0 && orphaned.length === 0 && mismatches.length === 0) {
    console.log(`✅ ${lang}.json — 100% complete, no issues`);
    continue;
  }

  console.log(`📋 ${lang}.json — ${coverage}% coverage`);
  console.log(`   Missing: ${missing.length}  |  Orphaned: ${orphaned.length}  |  Placeholder mismatches: ${mismatches.length}`);

  if (missing.length > 0 && showDetails) {
    console.log(`\n   🔴 Missing keys:`);
    for (const k of missing) {
      console.log(`      ${k}`);
    }
  }

  if (orphaned.length > 0 && showDetails) {
    console.log(`\n   🟡 Orphaned keys (not in ${REFERENCE_LANG}.json):`);
    for (const k of orphaned) {
      console.log(`      ${k}`);
    }
  }

  if (mismatches.length > 0) {
    console.log(`\n   🟠 Placeholder mismatches:`);
    for (const m of mismatches) {
      const refPh = placeholders(m.ref);
      const langPh = placeholders(m.lang);
      console.log(`      ${m.key}`);
      console.log(`        ref (en):  ${refPh.length > 0 ? refPh.join(', ') : '(none)'}`);
      console.log(`        ${lang}:      ${langPh.length > 0 ? langPh.join(', ') : '(none)'}`);
    }
  }

  console.log();
  totalMissing += missing.length;
  totalOrphaned += orphaned.length;
  totalMismatches += mismatches.length;
}

// ─── summary ────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════');
console.log(`Total missing keys:    ${totalMissing}`);
console.log(`Total orphaned keys:   ${totalOrphaned}`);
console.log(`Placeholder mismatches: ${totalMismatches}`);
console.log('═══════════════════════════════════════\n');

if (totalMissing > 0 || totalOrphaned > 0 || totalMismatches > 0) {
  console.log('💡 Run with --details to see individual missing keys.\n');
  process.exit(1);
}
