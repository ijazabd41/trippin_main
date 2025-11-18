import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the extracted translation keys
const usedKeys = fs.readFileSync(path.join(__dirname, 'translation-keys-used-v2.txt'), 'utf8')
  .split('\n')
  .filter(key => key.trim())
  .sort();

console.log(`🔍 Checking ${usedKeys.length} translation keys across all languages...\n`);

// Languages to check
const languages = [
  'ja', 'en', 'zh', 'ko', 'es', 'fr', 'hi', 'ru', 'ar', 'id', 
  'pt', 'th', 'vi', 'it', 'de', 'tr', 'pl', 'nl', 'sv', 'ur'
];

// Function to check if a key exists in a translation file
function keyExistsInFile(filePath, key) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Convert key to regex pattern
    // e.g., 'landing.hero.title' becomes 'landing\.hero\.title'
    const escapedKey = key.replace(/\./g, '\\.');
    // Look for the key followed by a colon (for object properties)
    const pattern = new RegExp(`['"]${escapedKey}['"]\\s*:`);
    
    return pattern.test(content);
  } catch (error) {
    return false;
  }
}

// Check each language
const results = {};

for (const lang of languages) {
  const filePath = path.join(__dirname, 'src', 'i18n', 'translations', `${lang}.ts`);
  const missingKeys = [];
  
  for (const key of usedKeys) {
    if (!keyExistsInFile(filePath, key)) {
      missingKeys.push(key);
    }
  }
  
  results[lang] = {
    total: usedKeys.length,
    missing: missingKeys.length,
    missingKeys: missingKeys
  };
  
  const percentage = ((usedKeys.length - missingKeys.length) / usedKeys.length * 100).toFixed(1);
  console.log(`🌐 ${lang.toUpperCase()}: ${usedKeys.length - missingKeys.length}/${usedKeys.length} (${percentage}%) - ${missingKeys.length} missing`);
}

// Find the most complete language (reference)
const referenceLang = Object.entries(results)
  .sort((a, b) => b[1].total - b[1].missing - (a[1].total - a[1].missing))
  [0];

console.log(`\n📊 Reference language: ${referenceLang[0].toUpperCase()} (${referenceLang[1].total - referenceLang[1].missing}/${referenceLang[1].total} keys)`);

// Show languages that need the most work
console.log('\n🔧 Languages needing the most work:');
const sortedByMissing = Object.entries(results)
  .sort((a, b) => b[1].missing - a[1].missing)
  .slice(0, 5);

sortedByMissing.forEach(([lang, data]) => {
  const percentage = ((data.total - data.missing) / data.total * 100).toFixed(1);
  console.log(`  ${lang.toUpperCase()}: ${data.missing} missing (${percentage}% complete)`);
});

// Show sample missing keys for the worst language
const worstLang = sortedByMissing[0];
if (worstLang[1].missingKeys.length > 0) {
  console.log(`\n📋 Sample missing keys in ${worstLang[0].toUpperCase()}:`);
  worstLang[1].missingKeys.slice(0, 20).forEach(key => {
    console.log(`  • ${key}`);
  });
  if (worstLang[1].missingKeys.length > 20) {
    console.log(`  ... and ${worstLang[1].missingKeys.length - 20} more`);
  }
}

// Save detailed results
fs.writeFileSync(
  path.join(__dirname, 'translation-analysis.json'),
  JSON.stringify(results, null, 2)
);

console.log('\n💾 Detailed analysis saved to translation-analysis.json');
