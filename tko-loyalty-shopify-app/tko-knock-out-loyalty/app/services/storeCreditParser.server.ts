/**
 * Store Credit Parser Service
 * 
 * Parses BinderPOS order notes to extract store credit usage information.
 * This is critical for accurate loyalty point calculations.
 */

export interface StoreCreditInfo {
  storeCreditUsed: number;
  loyaltyEligibleAmount: number;
  hasStoreCredit: boolean;
}

/**
 * Parse store credit usage from BinderPOS order notes
 * 
 * Expected format:
 * ```
 * BinderPOS Cart #23437955
 * 
 * --- Tenders ---
 * Credit: $198.18
 * 
 * Store credit used: $45.00
 * ```
 */
export function parseStoreCreditFromNote(orderNote: string | null, totalAmount: number): StoreCreditInfo {
  if (!orderNote) {
    return {
      storeCreditUsed: 0,
      loyaltyEligibleAmount: totalAmount,
      hasStoreCredit: false
    };
  }

  // Look for the specific "Store credit used:" pattern
  const storeCreditMatch = orderNote.match(/Store credit used:\s*\$?(\d+\.?\d*)/i);
  
  if (storeCreditMatch) {
    const storeCreditUsed = parseFloat(storeCreditMatch[1]);
    const loyaltyEligibleAmount = Math.max(0, totalAmount - storeCreditUsed);
    
    return {
      storeCreditUsed,
      loyaltyEligibleAmount,
      hasStoreCredit: true
    };
  }

  // No store credit found - full amount is loyalty eligible
  return {
    storeCreditUsed: 0,
    loyaltyEligibleAmount: totalAmount,
    hasStoreCredit: false
  };
}

/**
 * Calculate loyalty points based on loyalty-eligible amount (excluding store credit)
 */
export function calculateLoyaltyPoints(loyaltyEligibleAmount: number): number {
  // 1 point per dollar spent (excluding store credit)
  return Math.floor(loyaltyEligibleAmount);
}

/**
 * Validate store credit parsing with known examples
 */
export function validateStoreCreditParsing() {
  const testCases = [
    {
      note: `BinderPOS Cart #23437955

--- Tenders ---
Credit: $198.18

Store credit used: $45.00`,
      totalAmount: 243.18,
      expected: { storeCreditUsed: 45.00, loyaltyEligibleAmount: 198.18, hasStoreCredit: true }
    },
    {
      note: `BinderPOS Cart #22364037

--- Tenders ---
Credit: $77.91

Store credit used: $1.13`,
      totalAmount: 79.04,
      expected: { storeCreditUsed: 1.13, loyaltyEligibleAmount: 77.91, hasStoreCredit: true }
    },
    {
      note: `BinderPOS Cart #24487056

--- Tenders ---

Store credit used: $11.30`,
      totalAmount: 11.30,
      expected: { storeCreditUsed: 11.30, loyaltyEligibleAmount: 0, hasStoreCredit: true }
    },
    {
      note: `BinderPOS Cart #23565917

--- Tenders ---
Credit: $102.21`,
      totalAmount: 102.21,
      expected: { storeCreditUsed: 0, loyaltyEligibleAmount: 102.21, hasStoreCredit: false }
    }
  ];

  const results = testCases.map((testCase, index) => {
    const result = parseStoreCreditFromNote(testCase.note, testCase.totalAmount);
    const passed = 
      Math.abs(result.storeCreditUsed - testCase.expected.storeCreditUsed) < 0.01 &&
      Math.abs(result.loyaltyEligibleAmount - testCase.expected.loyaltyEligibleAmount) < 0.01 &&
      result.hasStoreCredit === testCase.expected.hasStoreCredit;

    return {
      testCase: index + 1,
      passed,
      expected: testCase.expected,
      actual: result
    };
  });

  return results;
}
