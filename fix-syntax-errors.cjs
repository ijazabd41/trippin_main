const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'src', 'i18n', 'translations');

// Function to fix syntax errors in translation files
function fixTranslationFile(lang) {
  const filePath = path.join(translationsDir, `${lang}.ts`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix common syntax issues
    content = content.replace(/,\s*,\s*/g, ','); // Remove double commas
    content = content.replace(/}\s*,\s*}/g, '}'); // Remove comma before closing brace
    content = content.replace(/}\s*,\s*$/g, '}'); // Remove trailing comma
    content = content.replace(/,\s*$/g, ''); // Remove trailing comma at end of file
    
    // Ensure proper closing structure
    if (!content.trim().endsWith('};')) {
      // Find the last closing brace and ensure it's followed by semicolon
      const lastBraceIndex = content.lastIndexOf('}');
      if (lastBraceIndex > -1) {
        const beforeLastBrace = content.substring(0, lastBraceIndex);
        const afterLastBrace = content.substring(lastBraceIndex);
        
        // Remove any trailing content after the last brace
        const cleanAfterBrace = afterLastBrace.replace(/[^};]/g, '');
        content = beforeLastBrace + cleanAfterBrace;
        
        // Ensure it ends with };
        if (!content.trim().endsWith('};')) {
          content = content.trim() + ';';
        }
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${lang}.ts`);
  } catch (error) {
    console.error(`❌ Error fixing ${lang}.ts:`, error.message);
  }
}

const languageCodes = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'hi', 'ru', 'ar', 'id', 'pt', 'th', 'vi', 'it', 'de', 'tr', 'pl', 'nl', 'sv', 'ur'];

// Fix all files
languageCodes.forEach(fixTranslationFile);

console.log('\n✨ All translation files have been fixed!');
