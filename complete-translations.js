import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple translation function using Google Translate's free endpoint
async function translate(text, targetLang) {
  if (!text || text === '""' || text === '' || text.includes('TODO')) {
    return null;
  }
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    console.error(`Error translating: ${error.message}`);
    return text;
  }
}

// Parse and translate a file
async function translateFile(fileName, languageCode) {
  console.log(`\nTranslating ${fileName}...`);
  
  const filePath = path.join(__dirname, 'src', 'i18n', 'translations', fileName);
  const enFilePath = path.join(__dirname, 'src', 'i18n', 'translations', 'en.ts');
  
  // Read the files
  const currentContent = fs.readFileSync(filePath, 'utf8');
  const enContent = fs.readFileSync(enFilePath, 'utf8');
  
  // Extract the English translations object
  const enMatch = enContent.match(/export const en = ({[\s\S]*});/);
  if (!enMatch) {
    console.error('Could not parse English file');
    return;
  }
  
  // Use a JavaScript parser to extract the object
  const enObject = eval(`(${enMatch[1]})`);
  
  // Create a flat map of all English strings
  const flattenStrings = (obj, prefix = '') => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        result[fullKey] = value;
      } else if (typeof value === 'object' && value !== null) {
        Object.assign(result, flattenStrings(value, fullKey));
      }
    }
    return result;
  };
  
  const enStrings = flattenStrings(enObject);
  
  // Process the target file line by line
  const lines = currentContent.split('\n');
  const translatedLines = [];
  let inTranslation = false;
  let currentKey = '';
  let buffer = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line has TODO: translate
    if (line.includes('TODO: translate')) {
      // Extract the key path from previous lines or context
      const match = line.match(/"([^"]+)":/);
      if (match) {
        const key = match[1];
        // Find this key in the English translations
        // This is simplified - in production you'd need a more robust parser
        let value = enStrings[key] || '';
        
        if (value && !value.includes('{{')) {
          const translated = await translate(value, languageCode);
          translatedLines.push(`    "${key}": "${translated}",`);
        } else {
          // Preserve structure for now
          translatedLines.push(line);
        }
      } else {
        translatedLines.push(line);
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    } else {
      translatedLines.push(line);
    }
    
    if (i % 100 === 0 && i > 0) {
      console.log(`  Progress: ${i}/${lines.length} lines processed...`);
    }
  }
  
  fs.writeFileSync(filePath, translatedLines.join('\n'), 'utf8');
  console.log(`✓ Completed ${fileName}`);
}

// Main function
async function main() {
  const filesToTranslate = [
    { file: 'pl.ts', lang: 'pl' },
    { file: 'zh.ts', lang: 'zh' },
    { file: 'id.ts', lang: 'id' },
    { file: 'it.ts', lang: 'it' },
    { file: 'ko.ts', lang: 'ko' },
    { file: 'nl.ts', lang: 'nl' },
    { file: 'pt.ts', lang: 'pt' },
    { file: 'ru.ts', lang: 'ru' },
    { file: 'sv.ts', lang: 'sv' },
    { file: 'th.ts', lang: 'th' },
    { file: 'tr.ts', lang: 'tr' },
    { file: 'ur.ts', lang: 'ur' },
    { file: 'vi.ts', lang: 'vi' }
  ];
  
  console.log('Starting translation process for 13 files...\n');
  
  for (const { file, lang } of filesToTranslate) {
    try {
      await translateFile(file, lang);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error with ${file}:`, error.message);
    }
  }
  
  console.log('\n✓ All translations completed!');
}

main().catch(console.error);

