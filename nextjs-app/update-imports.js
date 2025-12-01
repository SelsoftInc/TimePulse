const fs = require('fs');
const path = require('path');

console.log('🔄 Starting import path updates...\n');

const componentsDir = path.join(__dirname, 'src', 'components');

// Patterns to replace
const replacements = [
  // Context imports
  { from: /from ['"]\.\.\/\.\.\/contexts\//g, to: "from '@/contexts/" },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/contexts\//g, to: "from '@/contexts/" },
  { from: /from ['"]\.\.\/contexts\//g, to: "from '@/contexts/" },
  
  // Utils imports
  { from: /from ['"]\.\.\/\.\.\/utils\//g, to: "from '@/utils/" },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/utils\//g, to: "from '@/utils/" },
  { from: /from ['"]\.\.\/utils\//g, to: "from '@/utils/" },
  
  // Services imports
  { from: /from ['"]\.\.\/\.\.\/services\//g, to: "from '@/services/" },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/services\//g, to: "from '@/services/" },
  { from: /from ['"]\.\.\/services\//g, to: "from '@/services/" },
  
  // Hooks imports
  { from: /from ['"]\.\.\/\.\.\/hooks\//g, to: "from '@/hooks/" },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/hooks\//g, to: "from '@/hooks/" },
  { from: /from ['"]\.\.\/hooks\//g, to: "from '@/hooks/" },
  
  // Constants imports
  { from: /from ['"]\.\.\/\.\.\/constants\//g, to: "from '@/constants/" },
  { from: /from ['"]\.\.\/\.\.\/\.\.\/constants\//g, to: "from '@/constants/" },
  { from: /from ['"]\.\.\/constants\//g, to: "from '@/constants/" },
  
  // React Router to Next.js Router
  { from: /import\s*{\s*useNavigate\s*}\s*from\s*['"]react-router-dom['"]/g, to: "import { useRouter } from 'next/navigation'" },
  { from: /import\s*{\s*useParams\s*}\s*from\s*['"]react-router-dom['"]/g, to: "import { useParams } from 'next/navigation'" },
  { from: /import\s*{\s*Link\s*}\s*from\s*['"]react-router-dom['"]/g, to: "import Link from 'next/link'" },
  { from: /import\s*{\s*Navigate\s*}\s*from\s*['"]react-router-dom['"]/g, to: "import { redirect } from 'next/navigation'" },
];

// Check if component needs 'use client'
function needsUseClient(content) {
  // Check for hooks
  if (/use(State|Effect|Context|Reducer|Callback|Memo|Ref|LayoutEffect)/.test(content)) {
    return true;
  }
  
  // Check for event handlers
  if (/on(Click|Change|Submit|KeyDown|KeyUp|Focus|Blur|MouseEnter|MouseLeave)=/.test(content)) {
    return true;
  }
  
  // Check for browser APIs
  if (/(window\.|document\.|localStorage|sessionStorage|navigator\.)/.test(content)) {
    return true;
  }
  
  return false;
}

// Process a single file
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply replacements
    for (const { from, to } of replacements) {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    }
    
    // Add 'use client' if needed
    if (needsUseClient(content) && !content.startsWith("'use client'") && !content.startsWith('"use client"')) {
      content = "'use client';\n\n" + content;
      modified = true;
    }
    
    // Write back if modified
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

// Recursively process directory
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

// Run the update
const updatedCount = processDirectory(componentsDir);

console.log(`\n🎉 Complete! Updated ${updatedCount} files.`);
console.log('\n📝 Next steps:');
console.log('1. Review the changes');
console.log('2. Test the application');
console.log('3. Fix any remaining issues manually');
