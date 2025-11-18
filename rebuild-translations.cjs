const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'src', 'i18n', 'translations');

// Function to completely rebuild a translation file with proper structure
function rebuildTranslationFile(lang) {
  const filePath = path.join(translationsDir, `${lang}.ts`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the export statement
    const exportMatch = content.match(/export const \w+ = ({[\s\S]*});$/);
    if (!exportMatch) {
      console.error(`❌ Could not parse ${lang}.ts`);
      return;
    }
    
    let jsonContent = exportMatch[1];
    
    // Parse the JSON content
    try {
      const parsed = JSON.parse(jsonContent);
      
      // Add mockData section if it doesn't exist
      if (!parsed.mockData) {
        parsed.mockData = {
          notice: "Communication failed, showing mock data.",
          serviceNotification: "Service Notification",
          retry: "Retry",
          demoModeActive: "Demo mode is active. Actual Auth0 authentication is not configured.",
          imageApiUnavailable: "Image translation API is temporarily unavailable.",
          imageProcessingError: "Image processing error occurred.",
          imageProcessingFailed: "Image processing failed. Please check your network connection.",
          dismiss: "Dismiss"
        };
      }
      
      // Add alwaysActive to cookies if it doesn't exist
      if (parsed.cookies && !parsed.cookies.alwaysActive) {
        parsed.cookies.alwaysActive = "Always Active";
      }
      
      // Rebuild the file with proper structure
      const newContent = `export const ${lang} = ${JSON.stringify(parsed, null, 2)};`;
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Rebuilt ${lang}.ts`);
    } catch (jsonError) {
      console.error(`❌ JSON parse error in ${lang}.ts:`, jsonError.message);
    }
  } catch (error) {
    console.error(`❌ Error rebuilding ${lang}.ts:`, error.message);
  }
}

const languageCodes = ['ja', 'en', 'zh', 'ko', 'es', 'fr', 'hi', 'ru', 'ar', 'id', 'pt', 'th', 'vi', 'it', 'de', 'tr', 'pl', 'nl', 'sv', 'ur'];

// Rebuild all files
languageCodes.forEach(rebuildTranslationFile);

console.log('\n✨ All translation files have been rebuilt!');
