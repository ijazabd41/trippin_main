const fs = require('fs');
const path = require('path');

// Function to extract all keys from a translation object recursively
function extractKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Function to get nested value from object using dot notation
function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to set nested value in object using dot notation
function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Function to parse TypeScript export and extract the object
function parseTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Extract the export statement content
    const match = content.match(/export const \w+ = ({[\s\S]*});$/m);
    if (!match) {
      throw new Error('Could not parse export statement');
    }
    
    // Evaluate the object (this is safe since we control the input)
    const objectString = match[1];
    // Replace the object string to make it evaluable
    const evaluableString = `(${objectString})`;
    return eval(evaluableString);
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

// Function to format object back to TypeScript export
function formatTranslationFile(obj, languageCode) {
  const formatted = JSON.stringify(obj, null, 2);
  return `export const ${languageCode} = ${formatted};`;
}

// Main function
async function syncTranslations() {
  const translationsDir = path.join(__dirname, 'src', 'i18n', 'translations');
  
  // Read Japanese reference file
  const jaPath = path.join(translationsDir, 'ja.ts');
  const jaTranslations = parseTranslationFile(jaPath);
  
  if (!jaTranslations) {
    console.error('Failed to parse Japanese reference file');
    return;
  }
  
  const jaKeys = extractKeys(jaTranslations);
  console.log(`Japanese reference has ${jaKeys.length} keys`);
  
  // Get all translation files except ja.ts
  const files = fs.readdirSync(translationsDir)
    .filter(file => file.endsWith('.ts') && file !== 'ja.ts')
    .filter(file => !file.includes('backup')); // Skip backup files
  
  console.log(`Found ${files.length} translation files to update`);
  
  for (const file of files) {
    const filePath = path.join(translationsDir, file);
    const languageCode = path.basename(file, '.ts');
    
    console.log(`\nProcessing ${file}...`);
    
    const translations = parseTranslationFile(filePath);
    if (!translations) {
      console.error(`Failed to parse ${file}, skipping...`);
      continue;
    }
    
    const existingKeys = extractKeys(translations);
    const missingKeys = jaKeys.filter(key => !existingKeys.includes(key));
    
    console.log(`  Existing keys: ${existingKeys.length}`);
    console.log(`  Missing keys: ${missingKeys.length}`);
    
    if (missingKeys.length === 0) {
      console.log(`  ✅ ${file} is already up to date`);
      continue;
    }
    
    // Add missing keys with TODO placeholders
    for (const key of missingKeys) {
      const jaValue = getNestedValue(jaTranslations, key);
      const placeholderValue = `TODO: translate "${jaValue}"`;
      setNestedValue(translations, key, placeholderValue);
    }
    
    // Write updated file
    const updatedContent = formatTranslationFile(translations, languageCode);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`  ✅ Added ${missingKeys.length} missing keys to ${file}`);
  }
  
  console.log('\n🎉 Translation synchronization completed!');
}

// Run the script
syncTranslations().catch(console.error);
