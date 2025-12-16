const fs = require('fs');
const path = require('path');

console.log('🔄 Final routing fixes...\n');

const componentsDir = path.join(__dirname, 'src', 'components');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove any remaining react-router-dom imports that are now unused
    const oldContent = content;
    
    // Remove empty react-router-dom imports
    content = content.replace(/import\s*{\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
    
    // Remove react-router-dom import if it only has whitespace
    content = content.replace(/import\s*{\s*,\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
    
    // Clean up multiple consecutive newlines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (content !== oldContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  let updatedCount = 0;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      updatedCount += processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
      if (processFile(fullPath)) {
        updatedCount++;
        console.log(`✅ Cleaned: ${path.relative(componentsDir, fullPath)}`);
      }
    }
  }
  
  return updatedCount;
}

const updatedCount = processDirectory(componentsDir);

console.log(`\n🎉 Complete! Cleaned ${updatedCount} files.`);
console.log('\n✅ All routing fixes applied!');
console.log('📝 Next: npm run dev');
