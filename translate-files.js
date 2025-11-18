import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function translateWithGoogleAPI(text, targetLang) {
  try {
    // Use the Google Translate API
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    console.error(`Translation error for "${text}":`, error.message);
    return text; // Return original on error
  }
}

// Load the English translation file
const enPath = path.join(__dirname, 'src', 'i18n', 'translations', 'en.ts');
let enContent = fs.readFileSync(enPath, 'utf8');

// Parse the English translations
const exportMatch = enContent.match(/export const en = ({[\s\S]*});/);
if (!exportMatch) {
  console.error('Could not parse English translation file');
  process.exit(1);
}

const enData = exportMatch[1];
// Convert to a more manageable format
const enTranslations = eval(`(${enData})`);

async function translateObject(obj, targetLang, path = '', delay = 100) {
  const result = {};
  let count = 0;
  
  async function delayPromise(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string') {
      // Skip if already translated or empty
      if (value.includes('TODO: translate') || value === '""' || !value) {
        count++;
        if (count % 10 === 0) {
          console.log(`  Progress: ${count} strings translated in ${path || 'root'}...`);
          await delayPromise(delay);
        }
        
        // Translate the text
        const translated = await translateWithGoogleAPI(value.replace(/"/g, ''), targetLang);
        result[key] = `"${translated}"`;
      } else {
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value, targetLang, currentPath, delay);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Language codes for Google Translate
const langCodes = {
  'id': 'id', 'it': 'it', 'ko': 'ko', 'nl': 'nl', 'pl': 'pl', 
  'pt': 'pt', 'ru': 'ru', 'sv': 'sv', 'th': 'th', 'tr': 'tr', 
  'ur': 'ur', 'vi': 'vi', 'zh': 'zh-CN'
};

async function processFile(lang) {
  const langCode = langCodes[lang];
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Translating ${lang}.ts (${langCode})`);
  console.log('='.repeat(60));
  
  const filePath = path.join(__dirname, 'src', 'i18n', 'translations', `${lang}.ts`);
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Count TODO items
  const todoCount = (fileContent.match(/TODO: translate/g) || []).length;
  console.log(`Found ${todoCount} strings to translate`);
  
  // Translate the object
  const translations = await translateObject(enTranslations, langCode);
  
  // Generate new file content
  const newFileContent = `export const ${lang} = ${JSON.stringify(translations, null, 2).replace(/"([^"]+)":/g, '"$1":').replace(/"/g, '')};`;
  
  fs.writeFileSync(filePath, newFileContent, 'utf8');
  console.log(`✓ Completed ${lang}.ts\n`);
}

async function main() {
  const filesToProcess = ['id', 'it', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'ur', 'vi', 'zh'];
  
  console.log('Starting translation process...\n');
  
  for (const lang of filesToProcess) {
    try {
      await processFile(lang);
      // Add delay between files to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error processing ${lang}.ts:`, error.message);
    }
  }
  
  console.log('\n✓ All translation files completed!');
}

main().catch(console.error);

