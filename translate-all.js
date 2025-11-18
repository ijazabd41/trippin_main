// translate-all.js
// Place this in your project root and run: node translate-all.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to locate translations dir from a few likely locations
const candidateDirs = [
  path.join(__dirname, 'src', 'i18n', 'translations'),
  path.join(__dirname, 'i18n', 'translations'),
  path.join(__dirname, 'src', 'translations'),
  path.join(__dirname, 'translations'),
  path.join(__dirname, '..', 'i18n', 'translations'),
];

let translationsDir = candidateDirs.find(d => fs.existsSync(d));
if (!translationsDir) {
  console.error('Could not find translations directory. Tried:', candidateDirs.join('\n'));
  process.exit(1);
}
console.log('Using translations dir:', translationsDir);

// Master reference file (you said ja.ts is the master)
const MASTER_FILE = path.join(translationsDir, 'ja.ts');

// Languages to process (excluding ja)
const LANGS = [
  'ar','de','en','es','fr','hi','id','it','ko','nl','pl','pt','ru','sv','th','tr','ur','vi','zh'
].filter(l => l !== 'ja');

// Map of lang file -> Google translate code (adjust as needed)
const LANG_CODES = {
  ar: 'ar', de: 'de', en: 'en', es: 'es', fr: 'fr', hi: 'hi', id: 'id',
  it: 'it', ko: 'ko', nl: 'nl', pl: 'pl', pt: 'pt', ru: 'ru', sv: 'sv',
  th: 'th', tr: 'tr', ur: 'ur', vi: 'vi', zh: 'zh-CN'
};

// dynamic fetch support
async function ensureFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  // dynamic import node-fetch
  try {
    const nodeFetch = await import('node-fetch');
    return nodeFetch.default || nodeFetch;
  } catch (e) {
    throw new Error('fetch is not available and node-fetch could not be imported. Run `npm install node-fetch`');
  }
}

async function translateText(text, targetLang) {
  if (!text || text.trim() === '' || text === 'TODO: translate') return null;
  try {
    const fetchFn = await ensureFetch();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetchFn(url);
    const data = await res.json();
    // data[0] is an array of arrays
    return (data && data[0] && data[0][0] && data[0][0][0]) ? data[0][0][0] : null;
  } catch (err) {
    console.error('translateText error:', err.message);
    return null;
  }
}

// Extract object literal from file content when exported as "export const lang = { ... }" or "export default { ... }"
function extractExportedObject(content) {
  // Try named export first (e.g., "export const ja = { ... }")
  let m = content.match(/export\s+const\s+\w+\s*=\s*({[\s\S]*});?\s*$/m);
  if (m) return m[1];
  
  // Fallback to default export
  m = content.match(/export\s+default\s+({[\s\S]*});?\s*$/m);
  if (m) return m[1];
  
  return null;
}

// Safely evaluate an object literal string to an actual object
function parseObjectLiteral(objStr) {
  // We restrict eval to only parse object literal; wrap in parenthesis
  try {
    /* eslint-disable no-eval */
    const obj = eval('(' + objStr + ')');
    return obj;
  } catch (err) {
    console.error('Failed to eval object literal:', err.message);
    return null;
  }
}

// Convert plain JS object to nicely formatted TS export (uses JSON.stringify for safety)
function buildExportDefault(obj, langCode) {
  // JSON.stringify quotes keys and values which is valid TypeScript
  const json = JSON.stringify(obj, null, 2);
  return `export const ${langCode} = ${json};\n`;
}

// Recursively walk master object and fill into target object when placeholder present
async function fillPlaceholders(masterObj, targetObj, langCode, stats) {
  for (const key of Object.keys(masterObj)) {
    const masterVal = masterObj[key];
    const targetVal = targetObj ? targetObj[key] : undefined;

    if (typeof masterVal === 'string') {
      const needsTranslation =
        targetVal === undefined ||
        targetVal === null ||
        (typeof targetVal === 'string' && (targetVal.trim() === '' || targetVal === 'TODO: translate'));

      if (needsTranslation) {
        // translate masterVal (we use ja as source so masterVal is Japanese)
        const translated = await translateText(masterVal, langCode);
        if (translated) {
          if (!targetObj) {
            // create targetObj if missing
            // This shouldn't usually happen since we recreate files with structure
          }
          targetObj[key] = translated;
          stats.translated++;
          if (stats.translated % 20 === 0) console.log(`  translated ${stats.translated}...`);
          // small delay to lower risk of rate limiting
          await new Promise(r => setTimeout(r, 120));
        } else {
          // fallback: keep placeholder
          targetObj[key] = 'TODO: translate';
          stats.skipped++;
        }
      } else {
        // existing non-placeholder value - leave it
      }
    } else if (masterVal && typeof masterVal === 'object') {
      if (!targetObj[key] || typeof targetObj[key] !== 'object') targetObj[key] = {};
      await fillPlaceholders(masterVal, targetObj[key], langCode, stats);
    } else {
      // other types - copy directly
      targetObj[key] = masterVal;
    }
  }
}

async function main() {
  console.log('Reading master file:', MASTER_FILE);
  if (!fs.existsSync(MASTER_FILE)) {
    console.error('Master file not found:', MASTER_FILE);
    process.exit(1);
  }

  const masterContent = fs.readFileSync(MASTER_FILE, 'utf8');
  const masterObjLiteral = extractExportedObject(masterContent);
  if (!masterObjLiteral) {
    console.error('Could not extract export default object from ja.ts');
    process.exit(1);
  }

  const masterObj = parseObjectLiteral(masterObjLiteral);
  if (!masterObj) {
    console.error('Could not parse master object from ja.ts');
    process.exit(1);
  }

  console.log('Master keys parsed. Starting translations for languages:', LANGS.join(', '));

  for (const lang of LANGS) {
    const langFile = path.join(translationsDir, `${lang}.ts`);
    console.log('\n' + '='.repeat(60));
    console.log(`Processing ${langFile}`);

    // If file missing, create a fresh placeholder file with same structure
    let targetObj = null;
    if (!fs.existsSync(langFile)) {
      console.log('  File does not exist — generating new placeholder file.');
      // create a deep copy of master structure but with "TODO: translate"
      function buildPlaceholder(obj) {
        const res = Array.isArray(obj) ? [] : {};
        for (const k of Object.keys(obj)) {
          if (typeof obj[k] === 'string') res[k] = 'TODO: translate';
          else if (obj[k] && typeof obj[k] === 'object') res[k] = buildPlaceholder(obj[k]);
          else res[k] = obj[k];
        }
        return res;
      }
      targetObj = buildPlaceholder(masterObj);
      const out = buildExportDefault(targetObj, lang);
      fs.writeFileSync(langFile, out, 'utf8');
      console.log('  Created placeholder file at', langFile);
    } else {
      // read existing file and extract object
      const targetContent = fs.readFileSync(langFile, 'utf8');
      const targetLiteral = extractExportedObject(targetContent);
      if (!targetLiteral) {
        console.warn('  Could not parse existing export default in', langFile, '-- regenerating placeholder structure.');
        // fallback to placeholder structure
        function buildPlaceholder(obj) {
          const res = Array.isArray(obj) ? [] : {};
          for (const k of Object.keys(obj)) {
            if (typeof obj[k] === 'string') res[k] = 'TODO: translate';
            else if (obj[k] && typeof obj[k] === 'object') res[k] = buildPlaceholder(obj[k]);
            else res[k] = obj[k];
          }
          return res;
        }
        targetObj = buildPlaceholder(masterObj);
      } else {
        targetObj = parseObjectLiteral(targetLiteral);
        if (!targetObj) {
          console.warn('  Failed to eval target file — regenerating placeholder structure.');
          function buildPlaceholder(obj) {
            const res = Array.isArray(obj) ? [] : {};
            for (const k of Object.keys(obj)) {
              if (typeof obj[k] === 'string') res[k] = 'TODO: translate';
              else if (obj[k] && typeof obj[k] === 'object') res[k] = buildPlaceholder(obj[k]);
              else res[k] = obj[k];
            }
            return res;
          }
          targetObj = buildPlaceholder(masterObj);
        } else {
          // ensure any missing keys are added as placeholders
          function ensureKeys(master, target) {
            for (const k of Object.keys(master)) {
              if (!(k in target)) {
                if (typeof master[k] === 'string') target[k] = 'TODO: translate';
                else if (typeof master[k] === 'object') {
                  target[k] = {};
                  ensureKeys(master[k], target[k]);
                } else target[k] = master[k];
              } else if (master[k] && typeof master[k] === 'object') {
                if (typeof target[k] !== 'object') target[k] = {};
                ensureKeys(master[k], target[k]);
              }
            }
          }
          ensureKeys(masterObj, targetObj);
        }
      }
    }

    // Now fill placeholders by translating from master (ja)
    const langCode = LANG_CODES[lang] || lang;
    const stats = { translated: 0, skipped: 0 };

    await fillPlaceholders(masterObj, targetObj, langCode, stats);

    // Write file back
    const finalContent = buildExportDefault(targetObj, lang);
    fs.writeFileSync(langFile, finalContent, 'utf8');

    console.log(`  Done ${lang}. Translated: ${stats.translated}, Skipped/left as TODO: ${stats.skipped}`);
    // short delay between languages
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\nAll done. Please run your TypeScript build or linter to confirm no syntax errors.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
