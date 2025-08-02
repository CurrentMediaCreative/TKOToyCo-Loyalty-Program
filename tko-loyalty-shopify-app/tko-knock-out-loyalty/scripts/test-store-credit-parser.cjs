const { validateStoreCreditParsing } = require('../app/services/storeCreditParser.server.ts');

console.log('🧪 Testing Store Credit Parser...\n');

const results = validateStoreCreditParsing();

results.forEach(result => {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} Test Case ${result.testCase}`);
  
  if (!result.passed) {
    console.log('  Expected:', result.expected);
    console.log('  Actual:  ', result.actual);
  }
  
  console.log(`  Store Credit: $${result.actual.storeCreditUsed.toFixed(2)}`);
  console.log(`  Loyalty Eligible: $${result.actual.loyaltyEligibleAmount.toFixed(2)}`);
  console.log(`  Has Store Credit: ${result.actual.hasStoreCredit}`);
  console.log('');
});

const allPassed = results.every(r => r.passed);
console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
