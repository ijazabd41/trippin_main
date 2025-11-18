import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of all language files
const languages = [
  'ja', 'en', 'zh', 'ko', 'es', 'fr', 'hi', 'ru', 'ar', 'id', 
  'pt', 'th', 'vi', 'it', 'de', 'tr', 'pl', 'nl', 'sv', 'ur'
];

// Function to extract all keys from a translation object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

// Function to get nested value from object
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Read and parse translation files
const translations = {};
const allKeys = new Set();

console.log('🔍 Analyzing translation files...\n');

// First, read all files and collect all keys
for (const lang of languages) {
  try {
    const filePath = path.join(__dirname, 'src', 'i18n', 'translations', `${lang}.ts`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the export object (simple regex approach)
    const match = content.match(/export const \w+ = ({[\s\S]*});$/m);
    if (match) {
      // This is a simplified approach - in reality, we'd need a proper TypeScript parser
      console.log(`✅ ${lang}: File read successfully`);
      
      // For now, let's use a different approach - read the file and count sections
      const sections = content.match(/^\s*\/\/\s+([A-Za-z\s]+)$/gm);
      if (sections) {
        const sectionNames = sections.map(s => s.replace(/^\s*\/\/\s+/, '').trim());
        console.log(`   Sections found: ${sectionNames.length}`);
        console.log(`   Sections: ${sectionNames.join(', ')}`);
      }
    } else {
      console.log(`❌ ${lang}: Could not parse export object`);
    }
  } catch (error) {
    console.log(`❌ ${lang}: Error reading file - ${error.message}`);
  }
}

console.log('\n📊 Translation Analysis Complete');
console.log('Note: This is a basic analysis. For complete validation, we need to run the actual i18n validation in the browser.');
