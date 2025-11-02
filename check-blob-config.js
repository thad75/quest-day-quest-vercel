// Simple script to check Blob Store configuration
// Run with: node check-blob-config.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check environment files
const envFiles = ['.env', '.env.local', '.env.production'];

console.log('🔍 Checking Blob Store Configuration...\n');

envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`📄 Found ${file}:`);
    const content = fs.readFileSync(filePath, 'utf8');

    const tokenMatch = content.match(/BLOB_READ_WRITE_TOKEN=(.+)/);
    if (tokenMatch) {
      const token = tokenMatch[1].trim();
      if (token && token !== 'blob_xxxxxxxxxxxxxxxxxxxx') {
        console.log(`  ✅ Token configured: ${token.substring(0, 20)}...`);
        console.log(`  📏 Token length: ${token.length} characters`);
      } else if (token === 'blob_xxxxxxxxxxxxxxxxxxxx') {
        console.log(`  ⚠️  Token is placeholder - needs real token`);
      } else {
        console.log(`  ❌ Token is empty`);
      }
    } else {
      console.log(`  ❌ BLOB_READ_WRITE_TOKEN not found`);
    }
    console.log('');
  } else {
    console.log(`❌ ${file} not found\n`);
  }
});

// Check if we can access process.env (for Node.js context)
if (process.env.BLOB_READ_WRITE_TOKEN) {
  console.log(`✅ Process.env token found: ${process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20)}...`);
} else {
  console.log(`❌ No token found in process.env`);
}

console.log('\n🎯 Next Steps:');
console.log('1. Get your token from: https://vercel.com/thad75/quest-day-quest-vercel/settings/environment-variables');
console.log('2. Replace the placeholder in your .env file');
console.log('3. Restart your development server');
console.log('4. Visit: http://localhost:5173/test-blob');
console.log('\nOr use Vercel CLI: vercel env pull .env.local');