const fs = require('fs');
const path = require('path');

console.log('🖼️  Fixing all undefined logo references...\n');

const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const relativePath = path.relative(srcDir, filePath);
    
    // Check for logo variables (logo, logo2, logo3, etc.)
    const logoVarPattern = /\{(logo\d?)\}/g;
    const srcLogoPattern = /src=\{(logo\d?)\}/g;
    
    if (logoVarPattern.test(content) || srcLogoPattern.test(content)) {
      console.log(`  🔍 Found logo reference in: ${relativePath}`);
      
      // Replace {logo}, {logo2}, {logo3} etc. with the public path
      content = content.replace(/\{logo\d?\}/g, '"/assets/images/jsTree/TimePulseLogoAuth.png"');
      content = content.replace(/src=\{logo\d?\}/g, 'src="/assets/images/jsTree/TimePulseLogoAuth.png"');
      
      // Also replace direct variable usage in expressions
      content = content.replace(/\|\|\s*logo\d?(?!\w)/g, '|| "/assets/images/jsTree/TimePulseLogoAuth.png"');
      
      console.log(`  ✅ Fixed logo reference in: ${relativePath}`);
      modified = true;
    }
    
    if (modified) {
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

console.log(`\n${'='.repeat(70)}`);
console.log(`🎉 Complete! Fixed ${updatedCount} files with logo references.`);
console.log(`${'='.repeat(70)}`);
console.log('\n✅ All undefined logo variables replaced with public paths');
console.log('📝 Next: npm run dev');
