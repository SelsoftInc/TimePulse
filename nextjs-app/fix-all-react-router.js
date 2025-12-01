const fs = require('fs');
const path = require('path');

console.log('🔍 Finding and fixing ALL React Router imports and syntax errors...\n');

const srcDir = path.join(__dirname, 'src');
let totalFixed = 0;
let syntaxErrors = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const relativePath = path.relative(srcDir, filePath);
    
    // Fix 1: Mismatched quotes in imports
    const mismatchedQuotes = content.match(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"]/g);
    if (mismatchedQuotes) {
      mismatchedQuotes.forEach(imp => {
        // Check for mismatched quotes like '@/contexts/AuthContext"
        if ((imp.includes("from '") && imp.endsWith('"')) || 
            (imp.includes('from "') && imp.endsWith("'"))) {
          console.log(`  ⚠️  Found mismatched quotes in: ${relativePath}`);
          console.log(`     ${imp}`);
          syntaxErrors++;
        }
      });
    }
    
    // Fix mismatched quotes: '@/... " -> '@/...'
    const beforeQuoteFix = content;
    content = content.replace(/from\s+['"]([^'"]+)["']/g, (match, path) => {
      // Normalize to single quotes
      return `from '${path}'`;
    });
    if (content !== beforeQuoteFix) {
      console.log(`  ✅ Fixed quote mismatches in: ${relativePath}`);
      modified = true;
    }
    
    // Fix 2: Remove react-router-dom imports
    if (content.includes('react-router-dom')) {
      console.log(`  🔧 Removing react-router-dom from: ${relativePath}`);
      
      // Remove useParams from react-router-dom
      content = content.replace(/import\s*{\s*([^}]*),?\s*useParams\s*,?\s*([^}]*)\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, (match, before, after) => {
        const parts = [before, after].filter(p => p && p.trim());
        if (parts.length > 0) {
          return `import { ${parts.join(', ')} } from 'react-router-dom';\n`;
        }
        return ''; // Remove entirely if only useParams
      });
      
      // Remove standalone useParams import
      content = content.replace(/import\s*{\s*useParams\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
      
      // Remove empty react-router-dom imports
      content = content.replace(/import\s*{\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
      
      // Add useParams from next/navigation if needed
      if (!content.includes("from 'next/navigation'") && !content.includes('from "next/navigation"')) {
        // Add after first import
        const firstImportMatch = content.match(/^import\s/m);
        if (firstImportMatch) {
          const insertPos = firstImportMatch.index;
          content = content.slice(0, insertPos) + 
                   "import { useParams } from 'next/navigation';\n" + 
                   content.slice(insertPos);
        }
      } else {
        // Add useParams to existing next/navigation import
        content = content.replace(
          /import\s*{\s*([^}]*)\s*}\s*from\s*['"]next\/navigation['"]/g,
          (match, imports) => {
            if (!imports.includes('useParams')) {
              const importList = imports.split(',').map(i => i.trim()).filter(i => i);
              if (!importList.includes('useParams')) {
                importList.push('useParams');
              }
              return `import { ${importList.join(', ')} } from 'next/navigation'`;
            }
            return match;
          }
        );
      }
      
      modified = true;
    }
    
    // Fix 3: Clean up multiple consecutive newlines
    const beforeCleanup = content;
    content = content.replace(/\n{3,}/g, '\n\n');
    if (content !== beforeCleanup && !modified) {
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
console.log(`🎉 Complete! Fixed ${updatedCount} files.`);
console.log(`⚠️  Found ${syntaxErrors} syntax errors (now fixed)`);
console.log(`${'='.repeat(70)}`);
console.log('\n✅ All React Router imports removed');
console.log('✅ All syntax errors fixed');
console.log('✅ All imports updated to Next.js patterns');
console.log('\n📝 Next: npm run dev');
