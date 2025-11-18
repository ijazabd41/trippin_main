#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Trippin Development Environment...\n');

// Start backend server
console.log('📡 Starting Backend Server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a bit for backend to start
setTimeout(() => {
  console.log('\n🌐 Starting Frontend Server...');
  
  // Start frontend server
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  frontend.on('error', (error) => {
    console.error('Frontend error:', error);
  });

}, 3000);

backend.on('error', (error) => {
  console.error('Backend error:', error);
});

console.log('\n✅ Development servers starting...');
console.log('📡 Backend: http://localhost:3001');
console.log('🌐 Frontend: http://localhost:5173');
console.log('\nPress Ctrl+C to stop both servers');



