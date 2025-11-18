import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🌍 Google Translate API Setup');
console.log('============================\n');

console.log('To enable Google Translate functionality:');
console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable the "Cloud Translation API"');
console.log('4. Create credentials (API Key)');
console.log('5. Copy the API key and paste it below\n');

rl.question('Enter your Google Translate API Key (or press Enter to skip): ', (apiKey) => {
  if (apiKey.trim()) {
    try {
      // Read current .env file
      let envContent = '';
      if (fs.existsSync('.env')) {
        envContent = fs.readFileSync('.env', 'utf8');
      }
      
      // Add or update the API key
      const keyLine = `GOOGLE_TRANSLATE_API_KEY=${apiKey.trim()}`;
      
      if (envContent.includes('GOOGLE_TRANSLATE_API_KEY=')) {
        // Update existing key
        envContent = envContent.replace(/GOOGLE_TRANSLATE_API_KEY=.*/g, keyLine);
      } else {
        // Add new key
        envContent += (envContent.endsWith('\n') ? '' : '\n') + keyLine + '\n';
      }
      
      // Write updated .env file
      fs.writeFileSync('.env', envContent, 'utf8');
      
      console.log('\n✅ Google Translate API key added to .env file!');
      console.log('🔄 Please restart your backend server for changes to take effect.');
      console.log('\n📝 You can now use full Google Translate functionality!');
      
    } catch (error) {
      console.error('❌ Error updating .env file:', error.message);
    }
  } else {
    console.log('\n⏭️  Skipped. You can add the API key later by editing the .env file.');
    console.log('📝 The translation tool will work with limited fallback translations.');
  }
  
  rl.close();
});
