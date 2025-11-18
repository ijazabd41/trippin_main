// setup-translation-structure.js
// Pre-populate all language files with the full key structure from ja.ts,
// filling missing string values with "TODO: translate" and creating empty objects for nested structures.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translationsDirCandidates = [
  path.join(__dirname, 'src', 'i18n', 'translations'),
  path.join(__dirname, 'i18n', 'translations'),
  path.join(__dirname, 'src', 'translations'),
  path.join(__dirname, 'translations'),
];

const translationsDir = translationsDirCandidates.find(d => fs.existsSync(d));
if (!translationsDir) {
  console.error('Could not find translations directory. Tried:', translationsDirCandidates.join('\n'));
  process.exit(1);
}

const MASTER_FILE = path.join(translationsDir, 'ja.ts');
const LANGS = [
  'ar','de','en','es','fr','hi','id','it','ko','nl','pl','pt','ru','sv','th','tr','ur','vi','zh'
];

function extractExportedObject(content) {
  let m = content.match(/export\s+const\s+\w+\s*=\s*({[\s\S]*});?\s*$/m);
  if (m) return m[1];
  m = content.match(/export\s+default\s+({[\s\S]*});?\s*$/m);
  if (m) return m[1];
  return null;
}

function parseObjectLiteral(objStr) {
  try {
    /* eslint-disable no-eval */
    return eval('(' + objStr + ')');
  } catch (e) {
    return null;
  }
}

function buildExportNamed(obj, lang) {
  const json = JSON.stringify(obj, null, 2);
  return `export const ${lang} = ${json};\n`;
}

function ensureKeys(master, target) {
  for (const k of Object.keys(master)) {
    const masterVal = master[k];
    const targetVal = target[k];
    if (typeof masterVal === 'string') {
      if (targetVal === undefined) target[k] = 'TODO: translate';
    } else if (masterVal && typeof masterVal === 'object') {
      if (!targetVal || typeof targetVal !== 'object') target[k] = {};
      ensureKeys(masterVal, target[k]);
    } else {
      if (targetVal === undefined) target[k] = masterVal;
    }
  }
}

async function main() {
  console.log('Using translations dir:', translationsDir);
  console.log('Reading master file:', MASTER_FILE);
  const masterContent = fs.readFileSync(MASTER_FILE, 'utf8');
  const masterLiteral = extractExportedObject(masterContent);
  if (!masterLiteral) {
    console.error('Failed to extract object from ja.ts');
    process.exit(1);
  }
  const masterObj = parseObjectLiteral(masterLiteral);
  if (!masterObj) {
    console.error('Failed to parse master object from ja.ts');
    process.exit(1);
  }

  for (const lang of LANGS) {
    const langFile = path.join(translationsDir, `${lang}.ts`);
    console.log(`\n${'='.repeat(60)}\nEnsuring structure for ${langFile}`);

    let targetObj = {};
    if (fs.existsSync(langFile)) {
      const content = fs.readFileSync(langFile, 'utf8');
      const literal = extractExportedObject(content);
      if (literal) {
        const parsed = parseObjectLiteral(literal);
        if (parsed) targetObj = parsed;
      }
    }

    ensureKeys(masterObj, targetObj);
    fs.writeFileSync(langFile, buildExportNamed(targetObj, lang), 'utf8');
    console.log('  Structure ensured (placeholders added where missing).');
  }

  console.log('\nAll language files now share the master key structure with placeholders.');
}

main().catch(e => { console.error(e); process.exit(1); });



