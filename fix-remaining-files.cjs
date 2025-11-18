const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'src', 'i18n', 'translations');

// Function to fix all remaining syntax issues
function fixAllTranslationFiles() {
  const languageCodes = ['de', 'tr', 'nl', 'th', 'vi', 'id', 'pt', 'ru', 'ar', 'zh'];
  
  languageCodes.forEach(lang => {
    const filePath = path.join(translationsDir, `${lang}.ts`);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix the specific pattern: "  }\n\n,\n  "mockData": {"
      content = content.replace(/  }\s*\n\s*\n\s*,\s*\n\s*"mockData":\s*{/g, '  },\n  "mockData": {');
      
      // Fix any remaining double commas
      content = content.replace(/,\s*,\s*/g, ',');
      
      // Ensure proper closing
      if (!content.trim().endsWith('};')) {
        content = content.trim() + ';';
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${lang}.ts`);
    } catch (error) {
      console.error(`❌ Error fixing ${lang}.ts:`, error.message);
    }
  });
}

fixAllTranslationFiles();
console.log('\n✨ All remaining translation files have been fixed!');
