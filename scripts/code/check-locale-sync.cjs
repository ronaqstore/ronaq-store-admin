'use strict';

const fs = require('fs');
const path = require('path');
const { Reporter } = require('./lib/reporter.cjs');

const r = new Reporter('Locale Message Sync Audit', { emoji: '🌐' });
const messagesDir = path.join(__dirname, '../../messages');
const locales = ['en', 'ur', 'ps'];

function flat(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = v;
  }
  return out;
}

const maps = {};
for (const locale of locales) {
  const file = path.join(messagesDir, `${locale}.json`);
  if (!fs.existsSync(file)) {
    r.addViolation(`messages/${locale}.json`, 1, `Missing locale file messages/${locale}.json`);
    continue;
  }
  maps[locale] = flat(JSON.parse(fs.readFileSync(file, 'utf8')));
}

if (maps.en) {
  const enKeys = Object.keys(maps.en);
  for (const locale of locales) {
    if (locale === 'en' || !maps[locale]) continue;
    for (const key of enKeys) {
      if (!(key in maps[locale])) {
        r.addViolation(
          `messages/${locale}.json`,
          1,
          `Missing key "${key}" (present in en.json)`,
          { fix: `Add "${key}" to messages/${locale}.json` }
        );
      }
    }
    for (const key of Object.keys(maps[locale])) {
      if (!(key in maps.en)) {
        r.addViolation(
          `messages/${locale}.json`,
          1,
          `Extra key "${key}" not present in en.json`,
          { fix: `Remove or add matching key to messages/en.json` }
        );
      }
    }
  }
}

r.finish({
  fixTip: 'Keep messages/en.json, ur.json, and ps.json in sync for every leaf key.'
});
