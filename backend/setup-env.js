import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Environment Setup Helper');
console.log('============================\n');

console.log('Please enter your API keys. Press Enter to skip any optional fields.\n');

const questions = [
  {
    key: 'OPENAI_API_KEY',
    prompt: 'OpenAI API Key (required): ',
    required: true
  },
  {
    key: 'SUPABASE_URL',
    prompt: 'Supabase URL (required): ',
    required: true
  },
  {
    key: 'SUPABASE_ANON_KEY',
    prompt: 'Supabase Anonymous Key (required): ',
    required: true
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    prompt: 'Supabase Service Role Key (required): ',
    required: true
  },
  {
    key: 'STRIPE_SECRET_KEY',
    prompt: 'Stripe Secret Key (optional): ',
    required: false
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    prompt: 'Stripe Webhook Secret (optional): ',
    required: false
  },
  {
    key: 'GOOGLE_MAPS_API_KEY',
    prompt: 'Google Maps API Key (optional): ',
    required: false
  },
  {
    key: 'GOOGLE_TRANSLATE_API_KEY',
    prompt: 'Google Translate API Key (optional): ',
    required: false
  }
];

const answers = {};

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question.prompt, (answer) => {
      if (question.required && !answer.trim()) {
        console.log('❌ This field is required!');
        askQuestion(question).then(resolve);
      } else {
        answers[question.key] = answer.trim();
        resolve();
      }
    });
  });
}

async function main() {
  try {
    // Ask all questions
    for (const question of questions) {
      await askQuestion(question);
    }

    // Read current .env file
    let envContent = fs.readFileSync('.env', 'utf8');

    // Replace placeholder values
    for (const [key, value] of Object.entries(answers)) {
      if (value) {
        const regex = new RegExp(`${key}=.*`, 'g');
        envContent = envContent.replace(regex, `${key}=${value}`);
      }
    }

    // Write updated .env file
    fs.writeFileSync('.env', envContent, 'utf8');

    console.log('\n✅ .env file updated successfully!');
    console.log('\n📋 Summary of changes:');
    for (const [key, value] of Object.entries(answers)) {
      if (value) {
        console.log(`  ${key}: ${value.substring(0, 10)}...`);
      }
    }

    console.log('\n🚀 You can now start the backend server with: npm start');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();


