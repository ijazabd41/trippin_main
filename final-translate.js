import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Translation function using Google Translate
async function translateText(text, targetLang) {
  if (!text || text === '""' || text === '' || text.includes('TODO')) return null;
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await axios.get(url);
    return response.data[0][0][0];
  } catch (error) {
    console.error(`Error translating "${text}": ${error.message}`);
    return text;
  }
}

// Language codes
const LANG_CODES = {
  'pl': 'pl', 'zh': 'zh-CN', 'id': 'id', 'it': 'it', 
  'ko': 'ko', 'nl': 'nl', 'pt': 'pt', 'ru': 'ru', 
  'sv': 'sv', 'th': 'th', 'tr': 'tr', 'ur': 'ur', 'vi': 'vi'
};

async function translateFile(langName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Translating ${langName}.ts`);
  console.log('='.repeat(70));
  
  // Read files
  const targetFile = path.join(__dirname, 'src', 'i18n', 'translations', `${langName}.ts`);
  const enFile = path.join(__dirname, 'src', 'i18n', 'translations', 'en.ts');
  
  const targetContent = fs.readFileSync(targetFile, 'utf8');
  const enContent = fs.readFileSync(enFile, 'utf8');
  
  // Extract English translations object
  const enMatch = enContent.match(/export const en = ({[\s\S]*});/);
  if (!enMatch) {
    console.error('Could not parse English file');
    return;
  }
  
  // Parse English object
  const enObj = eval(`(${enMatch[1]})`);
  
  // Function to recursively extract all strings with their paths
  function extractStrings(obj, pathArray = []) {
    const strings = [];
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = pathArray.length ? `${pathArray.join('.')}.${key}` : key;
      if (typeof value === 'string') {
        strings.push({ path: currentPath, key, value });
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        strings.push(...extractStrings(value, [...pathArray, key]));
      }
    }
    return strings;
  }
  
  const enStrings = extractStrings(enObj);
  console.log(`Found ${enStrings.length} English strings`);
  
  // Create a key to English value map for quick lookup
  const keyMap = new Map();
  for (const item of enStrings) {
    keyMap.set(item.key, item.value);
  }
  
  // Get target language code
  const langCode = LANG_CODES[langName];
  
  // Process target file line by line
  const lines = targetContent.split('\n');
  let translatedCount = 0;
  let totalTodoCount = 0;
  
  // Count TODOs first
  for (const line of lines) {
    if (line.includes('TODO: translate')) {
      totalTodoCount++;
    }
  }
  
  console.log(`Found ${totalTodoCount} strings to translate`);
  
  // Process the file
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a TODO line
    if (line.includes('TODO: translate')) {
      const keyMatch = line.match(/"([^"]+)":\s*""/);
      if (keyMatch) {
        const key = keyMatch[1];
        // Find the English translation
        const enValue = keyMap.get(key);
        
        if (enValue) {
          try {
            const translated = await translateText(enValue, langCode);
            if (translated && translated !== enValue) {
              // Preserve the structure
              const indent = line.match(/^\s*/)[0];
              // Escape quotes in translation
              const safeTranslation = translated.replace(/"/g, '\\"');
              newLines.push(`${indent}"${key}": "${safeTranslation}",`);
              translatedCount++;
              
              if (translatedCount % 10 === 0) {
                console.log(`  Translated ${translatedCount}/${totalTodoCount} strings`);
              }
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 150));
              continue;
            }
          } catch (error) {
            console.error(`Error translating ${key}:`, error.message);
          }
        }
      }
    }
    
    newLines.push(line);
  }
  
  // Write the translated file
  let newContent = newLines.join('\n');
  
  // Fix the export statement
  newContent = newContent.replace(/const translation = \{/, `export const ${langName} = {`);
  newContent = newContent.replace(/export default translation;/, '');
  
  fs.writeFileSync(targetFile, newContent, 'utf8');
  console.log(`✓ Translated ${translatedCount}/${totalTodoCount} strings in ${langName}.ts`);
}

async function main() {
  const files = ['pl', 'zh', 'id', 'it', 'ko', 'nl', 'pt', 'ru', 'sv', 'th', 'tr', 'ur', 'vi'];
  
  console.log('Starting translation process with Google Translate API...');
  console.log('This will take several minutes to complete all files.\n');
  
  for (const lang of files) {
    try {
      await translateFile(lang);
      // Delay between files
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\n✗ Error with ${lang}.ts: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✓ All translation files completed!');
  console.log('='.repeat(70));
}

main().catch(console.error);

