import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';

function requestTranslate(text, target) {
  return new Promise((resolve) => {
    if (!text) return resolve('');
    const query = new URLSearchParams({ q: text, target, source: 'ja', key: API_KEY }).toString();
    const url = `https://translation.googleapis.com/language/translate/v2?${query}`;

    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const translated = json?.data?.translations?.[0]?.translatedText;
            resolve(translated || text);
          } catch {
            resolve(text);
          }
        });
      })
      .on('error', () => resolve(text));
  });
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

function loadJa() {
  const jaPath = path.join(__dirname, 'src', 'i18n', 'translations', 'ja.ts');
  const content = fs.readFileSync(jaPath, 'utf8');
  const match = content.match(/export const ja = (\{[\s\S]*\});/);
  if (!match) throw new Error('Cannot parse ja.ts');
  // eslint-disable-next-line no-eval
  return eval(`(${match[1]})`);
}

async function translateFile(targetFile, targetLang) {
  const filePath = path.join(__dirname, 'src', 'i18n', 'translations', `${targetFile}.ts`);
  let file = fs.readFileSync(filePath, 'utf8');

  const jaObj = loadJa();
  const flatJa = flatten(jaObj);

  const lines = file.split('\n');
  let changed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/TODO: translate/.test(line)) continue;
    const m = line.match(/"([^"]+)":\s*""/);
    if (!m) continue;
    const key = m[1];

    // Find final segment match in JA
    const jaEntryKey = Object.keys(flatJa).find((p) => p.endsWith(`.${key}`) || p === key);
    const jaValue = jaEntryKey ? flatJa[jaEntryKey] : '';
    if (!jaValue || typeof jaValue !== 'string') continue;

    // Preserve ICU placeholders
    const placeholders = Array.from(jaValue.matchAll(/\{\{[^}]+\}\}/g)).map((x) => x[0]);
    const plain = jaValue.replace(/\{\{[^}]+\}\}/g, '<<<PH>>>');

    // Translate JA->target
    // Rate limit a bit
    // eslint-disable-next-line no-await-in-loop
    const translated = API_KEY ? await requestTranslate(plain, targetLang) : plain;
    let finalText = translated;
    placeholders.forEach((ph) => {
      finalText = finalText.replace('<<<PH>>>', ph);
    });

    const indent = line.match(/^\s*/)?.[0] ?? '';
    const safe = finalText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines[i] = `${indent}"${key}": "${safe}",`;
    changed++;
    if (changed % 20 === 0) await new Promise((r) => setTimeout(r, 150));
  }

  // Ensure export format
  let out = lines.join('\n');
  out = out.replace(/const translation = \{/, `export const ${targetFile} = {`);
  out = out.replace(/export default translation;\s*$/, '');
  fs.writeFileSync(filePath, out, 'utf8');
  return changed;
}

async function main() {
  const targets = process.argv.slice(2);
  if (!API_KEY) {
    console.log('GOOGLE_TRANSLATE_API_KEY not set. Run backend/setup-google-translate.js or set it in .env');
  }
  if (targets.length === 0) {
    console.log('Usage: node translate-from-ja.js ur vi tr th sv ru ...');
    process.exit(1);
  }
  let total = 0;
  for (const t of targets) {
    // Map to Google codes
    const map = { ur: 'ur', vi: 'vi', tr: 'tr', th: 'th', sv: 'sv', ru: 'ru', id: 'id', it: 'it', ko: 'ko', nl: 'nl', pl: 'pl', pt: 'pt', zh: 'zh-CN' };
    const lang = map[t];
    if (!lang) continue;
    // eslint-disable-next-line no-await-in-loop
    const n = await translateFile(t, lang);
    console.log(`Translated ${n} strings in ${t}.ts`);
    total += n;
    // pause between files
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`Done. Total translated: ${total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
