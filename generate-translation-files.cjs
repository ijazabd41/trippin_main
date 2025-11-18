const fs = require('fs');
const path = require('path');

// Read the ja.ts file to get the structure
const jaFilePath = path.join(__dirname, 'src', 'i18n', 'translations', 'ja.ts');
const jaContent = fs.readFileSync(jaFilePath, 'utf8');

// Extract the structure from ja.ts by parsing the export
const jaMatch = jaContent.match(/export const ja = ({[\s\S]*});$/);
if (!jaMatch) {
  console.error('Could not parse ja.ts structure');
  process.exit(1);
}

const jaStructure = jaMatch[1];

// Function to replace all values with "TODO: translate" while preserving structure
function replaceValuesWithPlaceholders(obj) {
  if (typeof obj === 'string') {
    return '"TODO: translate"';
  } else if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => replaceValuesWithPlaceholders(item)).join(', ') + ']';
    } else {
      const entries = Object.entries(obj).map(([key, value]) => {
        return `"${key}": ${replaceValuesWithPlaceholders(value)}`;
      });
      return '{' + entries.join(', ') + '}';
    }
  }
  return obj;
}

// List of language codes to generate
const languages = [
  'de', 'en', 'es', 'fr', 'hi', 'id', 'it', 'ko', 'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'ur', 'vi', 'zh'
];

// Generate each translation file
languages.forEach(lang => {
  const placeholderStructure = replaceValuesWithPlaceholders(JSON.parse(jaStructure));
  const fileContent = `export const ${lang} = ${placeholderStructure};`;
  
  const filePath = path.join(__dirname, 'src', 'i18n', 'translations', `${lang}.ts`);
  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log(`Generated ${lang}.ts`);
});

console.log('All translation files have been generated with placeholder values!');
