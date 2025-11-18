import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively find all .tsx and .ts files
function findTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsxFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to extract translation keys from file content
function extractTranslationKeys(content) {
  const keys = new Set();
  
  // Match t('key') or t("key") patterns with more specific regex
  // This looks for t( followed by a string that contains dots (like 'landing.hero.title')
  const tPattern = /t\(['"`]([a-zA-Z_][a-zA-Z0-9_.]*[a-zA-Z0-9_])['"`]\)/g;
  let match;
  
  while ((match = tPattern.exec(content)) !== null) {
    const key = match[1];
    // Only add keys that look like translation keys (contain dots or are common patterns)
    if (key.includes('.') || 
        key.startsWith('common.') || 
        key.startsWith('menu.') || 
        key.startsWith('auth.') || 
        key.startsWith('landing.') ||
        key.startsWith('dashboard.') ||
        key.startsWith('questionnaire.') ||
        key.startsWith('checkout.') ||
        key.startsWith('templates.') ||
        key.startsWith('reviews.') ||
        key.startsWith('help.') ||
        key.startsWith('translation.') ||
        key.startsWith('offline.') ||
        key.startsWith('legal.') ||
        key.startsWith('esim.') ||
        key.startsWith('chat.') ||
        key.startsWith('planGeneration.') ||
        key.startsWith('tripDetail.') ||
        key.startsWith('booking.') ||
        key.startsWith('cookies.') ||
        key.startsWith('magicBox.') ||
        key.startsWith('chatBot.') ||
        key.startsWith('premium.') ||
        key.startsWith('confirmation.') ||
        key.startsWith('errors.') ||
        key.startsWith('destinations.') ||
        key.startsWith('currencies.') ||
        key.startsWith('success.') ||
        key.startsWith('notifications.') ||
        key.startsWith('settings.') ||
        key.startsWith('profile.') ||
        key.startsWith('billing.') ||
        key.startsWith('bookings.') ||
        key.startsWith('admin.') ||
        key.startsWith('map.') ||
        key.startsWith('trip.') ||
        key.startsWith('tripEdit.') ||
        key.startsWith('tripShare.') ||
        key.startsWith('tripTemplates.') ||
        key.startsWith('payment.') ||
        key.startsWith('locale.') ||
        key.startsWith('notification.') ||
        key.startsWith('error.') ||
        key.startsWith('loading.') ||
        key.startsWith('save.') ||
        key.startsWith('cancel.') ||
        key.startsWith('confirm.') ||
        key.startsWith('delete.') ||
        key.startsWith('edit.') ||
        key.startsWith('back.') ||
        key.startsWith('next.') ||
        key.startsWith('previous.') ||
        key.startsWith('close.') ||
        key.startsWith('search.') ||
        key.startsWith('filter.') ||
        key.startsWith('sort.') ||
        key.startsWith('select.') ||
        key.startsWith('all.') ||
        key.startsWith('none.') ||
        key.startsWith('yes.') ||
        key.startsWith('no.') ||
        key.startsWith('loading') ||
        key.startsWith('error') ||
        key.startsWith('success') ||
        key.startsWith('cancel') ||
        key.startsWith('confirm') ||
        key.startsWith('save') ||
        key.startsWith('delete') ||
        key.startsWith('edit') ||
        key.startsWith('back') ||
        key.startsWith('next') ||
        key.startsWith('previous') ||
        key.startsWith('close') ||
        key.startsWith('search') ||
        key.startsWith('filter') ||
        key.startsWith('sort') ||
        key.startsWith('select') ||
        key.startsWith('all') ||
        key.startsWith('none') ||
        key.startsWith('yes') ||
        key.startsWith('no')) {
      keys.add(key);
    }
  }
  
  return Array.from(keys);
}

// Main function
async function main() {
  console.log('🔍 Extracting translation keys from codebase...\n');
  
  // Find all TypeScript files
  const srcDir = path.join(__dirname, 'src');
  const files = findTsxFiles(srcDir);
  
  console.log(`Found ${files.length} TypeScript files\n`);
  
  // Extract all translation keys
  const allKeys = new Set();
  const fileKeyCounts = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const keys = extractTranslationKeys(content);
      
      if (keys.length > 0) {
        console.log(`📄 ${path.relative(srcDir, file)}: ${keys.length} keys`);
        fileKeyCounts.push({ file: path.relative(srcDir, file), count: keys.length, keys });
        keys.forEach(key => allKeys.add(key));
      }
    } catch (error) {
      console.log(`❌ Error reading ${file}: ${error.message}`);
    }
  }
  
  const sortedKeys = Array.from(allKeys).sort();
  console.log(`\n📊 Total unique translation keys found: ${sortedKeys.length}\n`);
  
  // Save keys to file for reference
  fs.writeFileSync(
    path.join(__dirname, 'translation-keys-used-v2.txt'),
    sortedKeys.join('\n')
  );
  
  console.log('💾 Translation keys saved to translation-keys-used-v2.txt\n');
  
  // Show top files by key count
  console.log('📈 Top files by translation key usage:');
  fileKeyCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .forEach(({ file, count }) => {
      console.log(`  ${file}: ${count} keys`);
    });
  
  console.log('\n📋 Sample of extracted keys:');
  sortedKeys.slice(0, 30).forEach(key => console.log(`  • ${key}`));
  if (sortedKeys.length > 30) {
    console.log(`  ... and ${sortedKeys.length - 30} more`);
  }
}

main().catch(console.error);
