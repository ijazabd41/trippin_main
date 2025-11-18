import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Translation function using Google Translate
function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    if (!text || text === '""' || text === '' || text.includes('TODO')) {
      resolve(null);
      return;
    }
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const translated = parsed[0][0][0];
          resolve(translated);
        } catch (error) {
          console.error(`Parse error for "${text}":`, error.message);
          resolve(text); // Return original on error
        }
      });
    }).on('error', (error) => {
      console.error(`Request error for "${text}":`, error.message);
      resolve(text); // Return original on error
    });
  });
}

// Language codes
const LANG_CODES = {
  'ru': 'ru',
  'sv': 'sv',
  'th': 'th',
  'tr': 'tr',
  'ur': 'ur',
  'vi': 'vi'
};

async function processFile(langName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Translating ${langName}.ts (${LANG_CODES[langName]})`);
  console.log('='.repeat(70));
  
  const targetFile = path.join(__dirname, 'src', 'i18n', 'translations', `${langName}.ts`);
  const enFile = path.join(__dirname, 'src', 'i18n', 'translations', 'en.ts');
  
  let targetContent = fs.readFileSync(targetFile, 'utf8');
  const enContent = fs.readFileSync(enFile, 'utf8');
  
  // Extract English translations
  const enMatch = enContent.match(/export const en = ({[\s\S]*});/);
  if (!enMatch) {
    console.error('Could not parse English file');
    return;
  }
  
  const enObj = eval(`(${enMatch[1]})`);
  
  // Flatten English object for easier lookup
  function flatten(obj, prefix = '') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        result[fullKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, flatten(value, fullKey));
      }
    }
    return result;
  }
  
  const enStrings = flatten(enObj);
  
  // Process target file line by line
  const lines = targetContent.split('\n');
  let translatedCount = 0;
  let todoCount = 0;
  
  // Count TODOs
  for (const line of lines) {
    if (line.includes('TODO: translate')) {
      todoCount++;
    }
  }
  
  console.log(`Found ${todoCount} strings to translate`);
  
  // Create lookup map
  const keyMap = {};
  for (const [pathKey, value] of Object.entries(enStrings)) {
    const segments = pathKey.split('.');
    const lastKey = segments[segments.length - 1];
    if (!keyMap[lastKey]) {
      keyMap[lastKey] = value;
    }
  }
  
  // Process each line
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('TODO: translate')) {
      const keyMatch = line.match(/"([^"]+)":\s*""/);
      if (keyMatch) {
        const key = keyMatch[1];
        const enValue = keyMap[key];
        
        if (enValue) {
          try {
            const translated = await translateText(enValue, LANG_CODES[langName]);
            if (translated && translated !== enValue) {
              const indent = line.match(/^\s*/)[0];
              const safeTranslation = translated
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, ' ')
                .replace(/\r/g, '');
              newLines.push(`${indent}"${key}": "${safeTranslation}",`);
              translatedCount++;
              
              if (translatedCount % 10 === 0) {
                console.log(`  Progress: ${translatedCount}/${todoCount} (${Math.round(translatedCount/todoCount*100)}%)`);
              }
              
              await new Promise(resolve => setTimeout(resolve, 250));
              continue;
            }
          } catch (error) {
            console.error(`  Error with "${key}": ${error.message}`);
          }
        }
      }
    }
    
    newLines.push(line);
  }
  
  // Fix export statement
  targetContent = newLines.join('\n');
  targetContent = targetContent.replace(/const translation = \{/, `export const ${langName} = {`);
  targetContent = targetContent.replace(/export default translation;/, '');
  
  fs.writeFileSync(targetFile, targetContent, 'utf8');
  console.log(`✓ Completed: ${translatedCount}/${todoCount} strings (${Math.round(translatedCount/todoCount*100)}%)`);
}

async function main() {
  const files = ['ur', 'vi', 'tr', 'th', 'sv', 'ru'];
  
  console.log('Starting translation for specific files...');
  console.log('Files: ur.ts, vi.ts, tr.ts, th.ts, sv.ts, ru.ts\n');
  
  for (const lang of files) {
    try {
      await processFile(lang);
      console.log(`\n✅ Completed ${lang}.ts - Pausing before next file...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n✗ Error with ${lang}.ts:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✓ All specified translation files completed!');
  console.log('='.repeat(70));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

