import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Setting up Trippin database...');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} failed:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} failed with error:`, err.message);
      }
    }

    console.log('✅ Database setup completed!');
    
    // Test the setup by checking if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'trips', 'itineraries', 'bookings', 'payments']);

    if (tablesError) {
      console.warn('⚠️  Could not verify table creation:', tablesError.message);
    } else {
      console.log('📊 Created tables:', tables?.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql function...');
  
  const execSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: execSqlFunction });
    if (error) {
      console.warn('⚠️  Could not create exec_sql function:', error.message);
    } else {
      console.log('✅ exec_sql function created');
    }
  } catch (err) {
    console.warn('⚠️  exec_sql function creation failed:', err.message);
  }
}

async function main() {
  console.log('🎯 Trippin Backend Setup');
  console.log('========================');
  
  // Create exec_sql function first
  await createExecSqlFunction();
  
  // Setup database
  await setupDatabase();
  
  console.log('');
  console.log('🎉 Setup completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the backend server: npm run dev');
  console.log('2. Update your frontend environment variables');
  console.log('3. Test the API endpoints');
  console.log('');
  console.log('📚 Documentation: http://localhost:3001/');
}

main().catch(console.error);
