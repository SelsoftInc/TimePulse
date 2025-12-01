const fs = require('fs');
const path = require('path');

console.log('🧭 Fixing navigation (navigate -> router.push)...\n');

const componentsDir = path.join(__dirname, 'src', 'components');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file uses navigate
    if (content.includes('navigate(')) {
      // Replace const navigate = useNavigate(); with const router = useRouter();
      if (content.match(/const\s+navigate\s*=\s*useNavigate\(\)/)) {
        content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\)\s*;?/g, "const router = useRouter();");
        modified = true;
      }
      
      // Replace navigate( with router.push(
      content = content.replace(/navigate\(/g, 'router.push(');
      modified = true;
      
      // Update imports - remove useNavigate from react-router-dom
      content = content.replace(/import\s*{\s*([^}]*),?\s*useNavigate\s*,?\s*([^}]*)\s*}\s*from\s*['"]react-router-dom['"]\s*;?/g, (match, before, after) => {
        const parts = [before, after].filter(p => p && p.trim());
        if (parts.length > 0) {
          return `import { ${parts.join(', ')} } from 'react-router-dom';`;
        }
        return ''; // Remove the import entirely if only useNavigate was imported
      });
      
      // Remove standalone useNavigate import
      content = content.replace(/import\s*{\s*useNavigate\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
      
      // Add useRouter import if not present
      if (!content.includes("from 'next/navigation'") && !content.includes('from "next/navigation"')) {
        // Find the first import statement
        const firstImportMatch = content.match(/^import\s/m);
        if (firstImportMatch) {
          const insertPos = firstImportMatch.index;
          content = content.slice(0, insertPos) + 
                   "import { useRouter } from 'next/navigation';\n" + 
                   content.slice(insertPos);
        }
      } else {
        // Add useRouter to existing next/navigation import
        content = content.replace(
          /import\s*{\s*([^}]*)\s*}\s*from\s*['"]next\/navigation['"]/g,
          (match, imports) => {
            if (!imports.includes('useRouter')) {
              const importList = imports.split(',').map(i => i.trim()).filter(i => i);
              importList.push('useRouter');
              return `import { ${importList.join(', ')} } from 'next/navigation'`;
            }
            return match;
          }
        );
      }
      
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
console.log('\n📝 All navigate() calls changed to router.push()');
console.log('📝 All useNavigate() changed to useRouter()');
console.log('📝 Next: Restart your dev server (npm run dev)');
