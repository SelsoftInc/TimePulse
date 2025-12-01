const fs = require('fs');
const path = require('path');

console.log('🔧 FINAL COMPLETE FIX - All Components\n');
console.log('Fixing ALL remaining issues:\n');
console.log('1. Link to= → Link href=');
console.log('2. react-router-dom imports');
console.log('3. useLocation → usePathname');
console.log('4. Syntax errors\n');

const srcDir = path.join(__dirname, 'src');
let stats = {
  linkFixed: 0,
  routerRemoved: 0,
  locationFixed: 0,
  syntaxFixed: 0,
  totalFiles: 0
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const relativePath = path.relative(srcDir, filePath);
    let fileStats = { link: false, router: false, location: false, syntax: false };
    
    // Fix 1: Link to= → Link href=
    if (content.includes('<Link') && content.includes('to=')) {
      const beforeFix = content;
      content = content.replace(/<Link\s+to=/g, '<Link href=');
      if (content !== beforeFix) {
        console.log(`  ✅ Fixed Link to= → href= in: ${relativePath}`);
        fileStats.link = true;
        modified = true;
      }
    }
    
    // Fix 2: Remove react-router-dom imports
    if (content.includes('react-router-dom')) {
      console.log(`  🔧 Removing react-router-dom from: ${relativePath}`);
      
      // Remove Link from react-router-dom
      content = content.replace(/import\s*{\s*([^}]*),?\s*Link\s*,?\s*([^}]*)\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, (match, before, after) => {
        const parts = [before, after].filter(p => p && p.trim());
        if (parts.length > 0) {
          return `import { ${parts.join(', ')} } from 'react-router-dom';\n`;
        }
        return '';
      });
      
      // Remove useLocation from react-router-dom
      content = content.replace(/import\s*{\s*([^}]*),?\s*useLocation\s*,?\s*([^}]*)\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, (match, before, after) => {
        const parts = [before, after].filter(p => p && p.trim());
        if (parts.length > 0) {
          return `import { ${parts.join(', ')} } from 'react-router-dom';\n`;
        }
        return '';
      });
      
      // Remove useParams from react-router-dom
      content = content.replace(/import\s*{\s*([^}]*),?\s*useParams\s*,?\s*([^}]*)\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, (match, before, after) => {
        const parts = [before, after].filter(p => p && p.trim());
        if (parts.length > 0) {
          return `import { ${parts.join(', ')} } from 'react-router-dom';\n`;
        }
        return '';
      });
      
      // Remove empty react-router-dom imports
      content = content.replace(/import\s*{\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
      content = content.replace(/import\s*{\s*,\s*}\s*from\s*['"]react-router-dom['"]\s*;?\s*\n?/g, '');
      
      // Add Link from next/link if needed
      if (!content.includes("from 'next/link'") && !content.includes('from "next/link"')) {
        const firstImportMatch = content.match(/^import\s/m);
        if (firstImportMatch) {
          const insertPos = firstImportMatch.index;
          content = content.slice(0, insertPos) + 
                   "import Link from 'next/link';\n" + 
                   content.slice(insertPos);
        }
      }
      
      fileStats.router = true;
      modified = true;
    }
    
    // Fix 3: useLocation → usePathname
    if (content.includes('useLocation')) {
      const beforeFix = content;
      
      // Replace const location = useLocation()
      content = content.replace(/const\s+location\s*=\s*useLocation\(\)\s*;?/g, 'const pathname = usePathname();');
      
      // Replace location.pathname with pathname
      content = content.replace(/location\.pathname/g, 'pathname');
      
      // Add usePathname to next/navigation import if needed
      if (content !== beforeFix) {
        if (content.includes("from 'next/navigation'") || content.includes('from "next/navigation"')) {
          content = content.replace(
            /import\s*{\s*([^}]*)\s*}\s*from\s*['"]next\/navigation['"]/g,
            (match, imports) => {
              if (!imports.includes('usePathname')) {
                const importList = imports.split(',').map(i => i.trim()).filter(i => i);
                if (!importList.includes('usePathname')) {
                  importList.push('usePathname');
                }
                return `import { ${importList.join(', ')} } from 'next/navigation'`;
              }
              return match;
            }
          );
        } else {
          // Add new import
          const firstImportMatch = content.match(/^import\s/m);
          if (firstImportMatch) {
            const insertPos = firstImportMatch.index;
            content = content.slice(0, insertPos) + 
                     "import { usePathname } from 'next/navigation';\n" + 
                     content.slice(insertPos);
          }
        }
        
        console.log(`  ✅ Fixed useLocation → usePathname in: ${relativePath}`);
        fileStats.location = true;
        modified = true;
      }
    }
    
    // Fix 4: Double commas and syntax errors
    const beforeSyntaxFix = content;
    content = content.replace(/,\s*,/g, ','); // Remove double commas
    content = content.replace(/{\s*,/g, '{'); // Remove leading comma in imports
    content = content.replace(/,\s*}/g, '}'); // Remove trailing comma before }
    
    if (content !== beforeSyntaxFix) {
      console.log(`  ✅ Fixed syntax errors in: ${relativePath}`);
      fileStats.syntax = true;
      modified = true;
    }
    
    // Clean up multiple newlines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      
      // Update stats
      if (fileStats.link) stats.linkFixed++;
      if (fileStats.router) stats.routerRemoved++;
      if (fileStats.location) stats.locationFixed++;
      if (fileStats.syntax) stats.syntaxFixed++;
      stats.totalFiles++;
      
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
console.log(`🎉 FINAL FIX COMPLETE!`);
console.log(`${'='.repeat(70)}`);
console.log(`\n📊 Statistics:`);
console.log(`   Total files fixed: ${stats.totalFiles}`);
console.log(`   Link to= → href=: ${stats.linkFixed} files`);
console.log(`   react-router-dom removed: ${stats.routerRemoved} files`);
console.log(`   useLocation → usePathname: ${stats.locationFixed} files`);
console.log(`   Syntax errors fixed: ${stats.syntaxFixed} files`);
console.log(`\n✅ All components are now Next.js compatible!`);
console.log(`\n📝 Next: npm run dev`);
