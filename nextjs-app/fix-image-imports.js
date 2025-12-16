const fs = require('fs');
const path = require('path');

console.log('🖼️  Fixing image imports...\n');

const componentsDir = path.join(__dirname, 'src', 'components');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Pattern 1: Remove import statements for images from assets
    const importPattern = /import\s+(\w+)\s+from\s+['"]\.\.\/\.\.\/assets\/images\/[^'"]+['"]\s*;?\s*\n?/g;
    if (importPattern.test(content)) {
      content = content.replace(importPattern, '');
      modified = true;
    }
    
    // Pattern 2: Replace image variable usage with public path
    // Common patterns: logo, logo2, logoImage, etc.
    const imageVarPattern = /{(\w*logo\w*|image\w*)}/gi;
    const srcPattern = /src=\{(\w*logo\w*|image\w*)\}/gi;
    
    // Find all image variable names that were imported
    const importMatches = content.matchAll(/import\s+(\w+)\s+from\s+['"]\.\.\/\.\.\/assets\/images\/([^'"]+)['"]/g);
    for (const match of importMatches) {
      const varName = match[1];
      const imagePath = match[2];
      
      // Replace usage of the variable with the public path
      const varUsagePattern = new RegExp(`\\{${varName}\\}`, 'g');
      content = content.replace(varUsagePattern, `"/assets/images/${imagePath}"`);
      modified = true;
    }
    
    if (modified) {
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
        console.log(`✅ Updated: ${path.relative(componentsDir, fullPath)}`);
      }
    }
  }
  
  return updatedCount;
}

const updatedCount = processDirectory(componentsDir);

console.log(`\n🎉 Complete! Updated ${updatedCount} files.`);
console.log('\n📝 Next: Restart your dev server (npm run dev)');
