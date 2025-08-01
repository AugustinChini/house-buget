#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Budget App Backend...\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this script from the backend directory.');
  process.exit(1);
}

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!\n');

  // Create .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('🔧 Creating .env file...');
    fs.copyFileSync('env.example', '.env');
    console.log('✅ .env file created from env.example\n');
  }

  // Initialize database
  console.log('🗄️  Initializing database...');
  execSync('npm run init-db', { stdio: 'inherit' });
  console.log('✅ Database initialized successfully!\n');

  console.log('🎉 Backend setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. The API will be available at: http://localhost:3001');
  console.log('3. Health check: http://localhost:3001/api/health');
  console.log('\n📚 For more information, see README.md');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
} 