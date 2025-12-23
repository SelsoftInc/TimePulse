// Check OAuth Configuration
const fs = require('fs');
const path = require('path');

console.log('=== OAuth Configuration Check ===\n');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env.local file found\n');
} catch (error) {
  console.log('❌ .env.local file NOT found!');
  console.log('\nPlease create .env.local with:');
  console.log('GOOGLE_CLIENT_ID=1012443421048-sg42k7t4i6vcdaj0r14mac2ndn8b6ilp.apps.googleusercontent.com');
  console.log('GOOGLE_CLIENT_SECRET=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');
  console.log('NEXTAUTH_SECRET=your-random-secret-here');
  console.log('NEXTAUTH_URL=https://goggly-casteless-torri.ngrok-free.dev');
  process.exit(1);
}

// Parse environment variables
const hasClientId = envContent.includes('GOOGLE_CLIENT_ID=') && !envContent.includes('GOOGLE_CLIENT_ID=your-google-client-id');
const hasClientSecret = envContent.includes('GOOGLE_CLIENT_SECRET=') && !envContent.includes('GOOGLE_CLIENT_SECRET=your-google-client-secret');
const hasNextAuthSecret = envContent.includes('NEXTAUTH_SECRET=') && !envContent.includes('NEXTAUTH_SECRET=your-nextauth-secret');
const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL=');

console.log('Configuration Status:');
console.log('GOOGLE_CLIENT_ID:', hasClientId ? '✅ Set' : '❌ Missing or placeholder');
console.log('GOOGLE_CLIENT_SECRET:', hasClientSecret ? '✅ Set' : '❌ Missing or placeholder');
console.log('NEXTAUTH_SECRET:', hasNextAuthSecret ? '✅ Set' : '❌ Missing or placeholder');
console.log('NEXTAUTH_URL:', hasNextAuthUrl ? '✅ Set' : '⚠️ Not set (optional)');

if (!hasClientId || !hasClientSecret || !hasNextAuthSecret) {
  console.log('\n❌ OAuth is NOT properly configured!');
  console.log('\nYour .env.local should contain:');
  console.log('GOOGLE_CLIENT_ID=1012443421048-sg42k7t4i6vcdaj0r14mac2ndn8b6ilp.apps.googleusercontent.com');
  console.log('GOOGLE_CLIENT_SECRET=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');
  console.log('NEXTAUTH_SECRET=generate-a-random-secret-here');
  console.log('NEXTAUTH_URL=https://goggly-casteless-torri.ngrok-free.dev');
  process.exit(1);
} else {
  console.log('\n✅ OAuth configuration looks good!');
  console.log('\n⚠️ IMPORTANT: You MUST restart the Next.js server for changes to take effect!');
  console.log('\nSteps:');
  console.log('1. Stop the Next.js server (Ctrl+C)');
  console.log('2. Run: npm run dev');
  console.log('3. Clear browser cache or use incognito mode');
  console.log('4. Try OAuth login again');
}
