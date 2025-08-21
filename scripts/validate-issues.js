#!/usr/bin/env node

/**
 * Issue Validation Script
 * Checks if documented issues in ISSUES.md still exist in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating documented issues against current codebase...\n');

const issues = [
  {
    id: '#001',
    name: 'Customer Page Checkbox Selection Bug',
    file: 'tko-loyalty-shopify-app/tko-knock-out-loyalty/app/routes/app.customers.tsx',
    searchPattern: 'handleSelectionChange',
    description: 'Check if custom selection logic still exists'
  },
  {
    id: '#002', 
    name: 'NaN Display in Customer Table',
    file: 'tko-loyalty-shopify-app/tko-knock-out-loyalty/app/routes/app.customers.tsx',
    searchPattern: 'customer.storeCreditUsed.toFixed',
    description: 'Check if missing null checks still exist'
  },
  {
    id: '#003',
    name: 'JSON Parsing Without Error Handling',
    file: 'tko-loyalty-shopify-app/tko-knock-out-loyalty/app/services/pointEvent.server.ts',
    searchPattern: 'JSON.parse(event.collections)',
    description: 'Check if unprotected JSON.parse still exists'
  }
];

let issuesFound = 0;
let issuesFixed = 0;

for (const issue of issues) {
  console.log(`Checking ${issue.id}: ${issue.name}`);
  
  try {
    const filePath = path.join(process.cwd(), issue.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ File not found: ${issue.file}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(issue.searchPattern)) {
      console.log(`  🐛 ISSUE STILL EXISTS: ${issue.description}`);
      issuesFound++;
    } else {
      console.log(`  ✅ Issue appears to be fixed or pattern not found`);
      issuesFixed++;
    }
    
  } catch (error) {
    console.log(`  ❌ Error checking file: ${error.message}`);
  }
  
  console.log('');
}

console.log('📊 Summary:');
console.log(`  🐛 Issues still present: ${issuesFound}`);
console.log(`  ✅ Issues potentially fixed: ${issuesFixed}`);
console.log(`  📝 Total issues checked: ${issues.length}`);

if (issuesFound > 0) {
  console.log('\n💡 Run this script after fixing issues to track progress');
  console.log('💡 Update ISSUES.md when issues are resolved');
}
