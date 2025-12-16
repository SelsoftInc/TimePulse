const fs = require('fs');
const path = require('path');

console.log('🔗 Fixing Link components (to -> href)...\n');

const componentsDir = path.join(__dirname, 'src', 'components');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace <Link to=" with <Link href="
    if (content.includes('<Link to=')) {
      content = content.replace(/<Link to=/g, '<Link href=');
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
    } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx') || item.endsWith('.ts') || item.endsWith('.tsx'))) {
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
console.log('\n📝 All <Link to="..."> changed to <Link href="...">');
console.log('📝 Next: Restart your dev server (npm run dev)');
