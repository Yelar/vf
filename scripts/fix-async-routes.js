const fs = require('fs');
const path = require('path');

// Files that need async fixes
const filesToFix = [
  'src/app/api/auth/resend-verification/route.ts',
  'src/app/api/render-and-save/route.ts', 
  'src/app/api/videos/shared/route.ts',
  'src/app/api/videos/download-direct/[id]/route.ts',
  'src/app/api/videos/download/[id]/route.ts',
  'src/app/api/videos/[id]/route.ts',
  'src/app/api/render-quiz-video/route.ts'
];

// Common patterns to fix
const fixes = [
  // Add await to database calls
  { pattern: /const (\w+) = (get\w+|create\w+|update\w+|delete\w+|toggle\w+|verify\w+)\(/g, replacement: 'const $1 = await $2(' },
  { pattern: /const (\w+) = (get\w+|create\w+|update\w+|delete\w+|toggle\w+|verify\w+)\(/g, replacement: 'const $1 = await $2(' },
  
  // Fix user ID parsing (remove parseInt)
  { pattern: /parseInt\(session\.user\.id\)/g, replacement: 'session.user.id' },
  
  // Fix boolean comparisons for is_shared
  { pattern: /is_shared === 1/g, replacement: 'is_shared === true' },
  { pattern: /is_shared === 0/g, replacement: 'is_shared === false' },
  
  // Fix email_verified comparisons
  { pattern: /email_verified === 1/g, replacement: 'email_verified === true' },
  { pattern: /email_verified === 0/g, replacement: 'email_verified === false' },
];

console.log('🔧 Fixing async patterns in API routes...');

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`  📝 Processing ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`    ✅ Fixed async patterns`);
    } else {
      console.log(`    ⏸️ No changes needed`);
    }
  } else {
    console.log(`    ⚠️ File not found: ${filePath}`);
  }
});

console.log('\n🎉 Async fixes completed!');
console.log('\n⚠️  Note: You may still need to manually review some files for edge cases.');
console.log('🚀 Run `npm run dev` to test the changes.'); 