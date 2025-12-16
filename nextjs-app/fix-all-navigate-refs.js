const fs = require('fs');
const path = require('path');

console.log('🔍 Finding and fixing ALL navigate references...\n');

const srcDir = path.join(__dirname, 'src');
let totalFixed = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;
    
    // Fix dependency arrays: [navigate] -> [router]
    if (content.includes('[navigate]')) {
      content = content.replace(/\[navigate\]/g, '[router]');
      modified = true;
      console.log(`  ✅ Fixed dependency array in: ${path.relative(srcDir, filePath)}`);
    }
    
    // Fix dependency arrays with navigate in the middle: [x, navigate, y] -> [x, router, y]
    if (content.match(/\[[^\]]*,\s*navigate\s*,/)) {
      content = content.replace(/(\[[^\]]*),\s*navigate\s*,/g, '$1, router,');
      modified = true;
      console.log(`  ✅ Fixed mixed dependency array in: ${path.relative(srcDir, filePath)}`);
    }
    
    // Fix dependency arrays with navigate at the end: [x, navigate] -> [x, router]
    if (content.match(/\[[^\]]*,\s*navigate\s*\]/)) {
      content = content.replace(/(\[[^\]]*),\s*navigate\s*\]/g, '$1, router]');
      modified = true;
      console.log(`  ✅ Fixed end dependency array in: ${path.relative(srcDir, filePath)}`);
    }
    
    // Check for any remaining 'navigate' variable references (not in strings or comments)
    const navigateVarPattern = /(?<!['"`\/])navigate(?!['"`])/g;
    const matches = content.match(navigateVarPattern);
    if (matches && matches.length > 0) {
      // Check if it's actually being used as a variable (not in import or string)
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip import lines and comments
        if (line.trim().startsWith('import') || 
            line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||
            line.includes('useNavigate')) {
          continue;
        }
        
        // Check for navigate usage
        if (line.includes('navigate(') && !line.includes('router.push(')) {
          console.log(`  ⚠️  Found navigate() call on line ${i + 1}: ${line.trim()}`);
        }
      }
    }
    
    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  let updatedCount = 0;
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        updatedCount += processDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
        if (processFile(fullPath)) {
          updatedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return updatedCount;
}

console.log('Scanning all files in src/...\n');
const updatedCount = processDirectory(srcDir);

console.log(`\n${'='.repeat(60)}`);
console.log(`🎉 Complete! Fixed ${updatedCount} files.`);
console.log(`${'='.repeat(60)}`);
console.log('\n✅ All navigate references in dependency arrays updated to router');
console.log('📝 Next: npm run dev');
