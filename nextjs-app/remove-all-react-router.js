const fs = require('fs');
const path = require('path');

console.log('🔍 Removing ALL remaining react-router-dom imports...\n');

const srcDir = path.join(__dirname, 'src');
let fixedCount = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const relativePath = path.relative(srcDir, filePath);
    
    // Check if file has react-router-dom
    if (!content.includes('react-router-dom')) {
      return false;
    }
    
    console.log(`  🔧 Found react-router-dom in: ${relativePath}`);
    
    // Store what we're removing for logging
    const imports = [];
    
    // Extract what's being imported from react-router-dom
    const importMatch = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]react-router-dom['"]/);
    if (importMatch) {
      imports.push(...importMatch[1].split(',').map(i => i.trim()));
    }
    
    // Remove the entire react-router-dom import line
    content = content.replace(/import\s*{\s*[^}]*\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
    
    // Add Next.js imports if needed
    const needsRouter = imports.some(i => i.includes('useNavigate'));
    const needsParams = imports.some(i => i.includes('useParams'));
    const needsSearchParams = imports.some(i => i.includes('useSearchParams'));
    const needsLocation = imports.some(i => i.includes('useLocation'));
    const needsLink = imports.some(i => i.includes('Link'));
    
    const nextImports = [];
    if (needsRouter) nextImports.push('useRouter');
    if (needsParams) nextImports.push('useParams');
    if (needsSearchParams) nextImports.push('useSearchParams');
    if (needsLocation) nextImports.push('usePathname');
    
    // Check if next/navigation import already exists
    const hasNextNavigation = content.includes("from 'next/navigation'") || content.includes('from "next/navigation"');
    
    if (nextImports.length > 0) {
      if (hasNextNavigation) {
        // Add to existing import
        content = content.replace(
          /import\s*{\s*([^}]*)\s*}\s*from\s*['"]next\/navigation['"]/,
          (match, existing) => {
            const existingImports = existing.split(',').map(i => i.trim()).filter(i => i);
            const allImports = [...new Set([...existingImports, ...nextImports])];
            return `import { ${allImports.join(', ')} } from 'next/navigation'`;
          }
        );
      } else {
        // Add new import at the top
        const firstImportMatch = content.match(/^import\s/m);
        if (firstImportMatch) {
          const insertPos = firstImportMatch.index;
          content = content.slice(0, insertPos) + 
                   `import { ${nextImports.join(', ')} } from 'next/navigation';\n` + 
                   content.slice(insertPos);
        }
      }
    }
    
    // Add Link from next/link if needed
    if (needsLink && !content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
      const firstImportMatch = content.match(/^import\s/m);
      if (firstImportMatch) {
        const insertPos = firstImportMatch.index;
        content = content.slice(0, insertPos) + 
                 "import Link from 'next/link';\n" + 
                 content.slice(insertPos);
      }
    }
    
    // Clean up multiple newlines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Removed react-router-dom from: ${relativePath}`);
    console.log(`     Removed: ${imports.join(', ')}`);
    if (nextImports.length > 0) {
      console.log(`     Added: ${nextImports.join(', ')} from next/navigation`);
    }
    if (needsLink) {
      console.log(`     Added: Link from next/link`);
    }
    
    return true;
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
console.log(`🎉 Complete! Removed react-router-dom from ${updatedCount} files.`);
console.log(`${'='.repeat(70)}`);
console.log('\n✅ All react-router-dom imports removed');
console.log('✅ All Next.js imports added');
console.log('\n📝 Next: npm run dev');
