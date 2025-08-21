/**
 * Store Credit Parser Service
 * 
 * Parses BinderPOS order notes to extract store credit usage information.
 * This is critical for accurate loyalty point calculations.
 */

import { logError, logOrderProcessing, debugLog } from '../utils/logger.server.js';
import { validateNumeric } from '../utils/errorHandler.server.js';

export interface StoreCreditInfo {
  storeCreditUsed: number;
  loyaltyEligibleAmount: number;
  hasStoreCredit: boolean;
  parseSuccess: boolean;
  errorMessage?: string;
}

export interface ParseResult {
  success: boolean;
  data?: StoreCreditInfo;
  error?: string;
  warnings?: string[];
}

/**
 * Parse store credit usage from BinderPOS order notes with comprehensive error handling
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
  // Input validation
  const totalValidation = validateNumeric(totalAmount, { min: 0 });
  if (!totalValidation.isValid) {
    const error = `Invalid total amount: ${totalValidation.errors.join(', ')}`;
    logError(new Error(error), {
      operation: 'parseStoreCreditFromNote',
      totalAmount,
      orderNote: orderNote?.substring(0, 100) + '...'
    });
    
    return {
      storeCreditUsed: 0,
      loyaltyEligibleAmount: 0,
      hasStoreCredit: false,
      parseSuccess: false,
      errorMessage: error
    };
  }

  // Handle null or empty order note
  if (!orderNote || orderNote.trim() === '') {
    debugLog('No order note provided - assuming no store credit used', {
      operation: 'parseStoreCreditFromNote',
      totalAmount
    });
    
    return {
      storeCreditUsed: 0,
      loyaltyEligibleAmount: totalAmount,
      hasStoreCredit: false,
      parseSuccess: true
    };
  }

  try {
    // Look for the specific "Store credit used:" pattern with enhanced regex
    const storeCreditPatterns = [
      /Store credit used:\s*\$?(\d+\.?\d*)/i,
      /Store Credit Used:\s*\$?(\d+\.?\d*)/i,
      /store\s*credit\s*used:\s*\$?(\d+\.?\d*)/i,
      /Store\s*Credit:\s*\$?(\d+\.?\d*)/i
    ];

    let storeCreditUsed = 0;
    let patternMatched = false;

    for (const pattern of storeCreditPatterns) {
      const match = orderNote.match(pattern);
      if (match) {
        const parsedAmount = parseFloat(match[1]);
        
        // Validate the parsed amount
        if (isNaN(parsedAmount)) {
          logError(new Error(`Invalid store credit amount parsed: ${match[1]}`), {
            operation: 'parseStoreCreditFromNote',
            orderNote: orderNote.substring(0, 200) + '...',
            matchedPattern: pattern.toString(),
            matchedValue: match[1]
          });
          continue;
        }

        if (parsedAmount < 0) {
          logError(new Error(`Negative store credit amount: ${parsedAmount}`), {
            operation: 'parseStoreCreditFromNote',
            orderNote: orderNote.substring(0, 200) + '...',
            parsedAmount
          });
          continue;
        }

        storeCreditUsed = parsedAmount;
        patternMatched = true;
        
        debugLog('Store credit pattern matched', {
          operation: 'parseStoreCreditFromNote',
          pattern: pattern.toString(),
          storeCreditUsed,
          totalAmount
        });
        break;
      }
    }

    // Validate store credit doesn't exceed total amount (with small tolerance for rounding)
    const tolerance = 0.01;
    if (storeCreditUsed > totalAmount + tolerance) {
      const error = `Store credit used (${storeCreditUsed}) exceeds total amount (${totalAmount})`;
      logError(new Error(error), {
        operation: 'parseStoreCreditFromNote',
        storeCreditUsed,
        totalAmount,
        orderNote: orderNote.substring(0, 200) + '...'
      });
      
      // Cap store credit at total amount to prevent negative loyalty eligible amount
      storeCreditUsed = totalAmount;
      logOrderProcessing('store-credit-parse', 'unknown', 
        `Capped store credit at total amount due to validation error`);
    }

    const loyaltyEligibleAmount = Math.max(0, totalAmount - storeCreditUsed);
    
    const result: StoreCreditInfo = {
      storeCreditUsed,
      loyaltyEligibleAmount,
      hasStoreCredit: patternMatched && storeCreditUsed > 0,
      parseSuccess: true
    };

    if (patternMatched) {
      logOrderProcessing('store-credit-parse', 'unknown', 
        `Parsed store credit: $${storeCreditUsed.toFixed(2)} from total $${totalAmount.toFixed(2)}`);
    }

    return result;

  } catch (error) {
    const errorMessage = `Failed to parse store credit from order note: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: 'parseStoreCreditFromNote',
      orderNote: orderNote.substring(0, 200) + '...',
      totalAmount
    });

    return {
      storeCreditUsed: 0,
      loyaltyEligibleAmount: totalAmount,
      hasStoreCredit: false,
      parseSuccess: false,
      errorMessage
    };
  }
}

/**
 * Calculate loyalty points based on loyalty-eligible amount (excluding store credit)
 * with comprehensive validation
 */
export function calculateLoyaltyPoints(loyaltyEligibleAmount: number): number {
  // Input validation
  const validation = validateNumeric(loyaltyEligibleAmount, { min: 0 });
  if (!validation.isValid) {
    logError(new Error(`Invalid loyalty eligible amount: ${validation.errors.join(', ')}`), {
      operation: 'calculateLoyaltyPoints',
      loyaltyEligibleAmount
    });
    return 0;
  }

  try {
    // 1 point per dollar spent (excluding store credit)
    const points = Math.floor(loyaltyEligibleAmount);
    
    debugLog('Calculated loyalty points', {
      operation: 'calculateLoyaltyPoints',
      loyaltyEligibleAmount,
      points
    });
    
    return points;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: 'calculateLoyaltyPoints',
      loyaltyEligibleAmount
    });
    return 0;
  }
}

/**
 * Enhanced parsing with detailed result information
 */
export function parseStoreCreditWithValidation(orderNote: string | null, totalAmount: number): ParseResult {
  try {
    const result = parseStoreCreditFromNote(orderNote, totalAmount);
    const warnings: string[] = [];

    // Additional validation checks
    if (result.storeCreditUsed > 0 && !orderNote?.toLowerCase().includes('binderpos')) {
      warnings.push('Store credit found but order note does not appear to be from BinderPOS');
    }

    if (result.loyaltyEligibleAmount === 0 && result.storeCreditUsed > 0) {
      warnings.push('Entire order amount was paid with store credit - no loyalty points will be earned');
    }

    return {
      success: result.parseSuccess,
      data: result,
      error: result.errorMessage,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    const errorMessage = `Critical error in store credit parsing: ${error instanceof Error ? error.message : 'Unknown error'}`;
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: 'parseStoreCreditWithValidation',
      orderNote: orderNote?.substring(0, 100) + '...',
      totalAmount
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Batch parse multiple orders with error tracking
 */
export function batchParseStoreCredit(orders: Array<{ note: string | null; totalAmount: number; orderId?: string }>): {
  results: Array<{ orderId?: string; result: ParseResult }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    withStoreCredit: number;
    totalStoreCreditFound: number;
  };
} {
  const results: Array<{ orderId?: string; result: ParseResult }> = [];
  let successful = 0;
  let failed = 0;
  let withStoreCredit = 0;
  let totalStoreCreditFound = 0;

  for (const order of orders) {
    try {
      const result = parseStoreCreditWithValidation(order.note, order.totalAmount);
      results.push({ orderId: order.orderId, result });

      if (result.success) {
        successful++;
        if (result.data?.hasStoreCredit) {
          withStoreCredit++;
          totalStoreCreditFound += result.data.storeCreditUsed;
        }
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      logError(error instanceof Error ? error : new Error(String(error)), {
        operation: 'batchParseStoreCredit',
        orderId: order.orderId
      });
      
      results.push({
        orderId: order.orderId,
        result: {
          success: false,
          error: 'Unexpected error during parsing'
        }
      });
    }
  }

  return {
    results,
    summary: {
      total: orders.length,
      successful,
      failed,
      withStoreCredit,
      totalStoreCreditFound
    }
  };
}

/**
 * Validate store credit parsing with known examples and comprehensive testing
 */
export function validateStoreCreditParsing() {
  const testCases = [
    {
      name: 'Standard BinderPOS with store credit',
      note: `BinderPOS Cart #23437955

--- Tenders ---
Credit: $198.18

Store credit used: $45.00`,
      totalAmount: 243.18,
      expected: { storeCreditUsed: 45.00, loyaltyEligibleAmount: 198.18, hasStoreCredit: true, parseSuccess: true }
    },
    {
      name: 'Small store credit amount',
      note: `BinderPOS Cart #22364037

--- Tenders ---
Credit: $77.91

Store credit used: $1.13`,
      totalAmount: 79.04,
      expected: { storeCreditUsed: 1.13, loyaltyEligibleAmount: 77.91, hasStoreCredit: true, parseSuccess: true }
    },
    {
      name: 'Full payment with store credit',
      note: `BinderPOS Cart #24487056

--- Tenders ---

Store credit used: $11.30`,
      totalAmount: 11.30,
      expected: { storeCreditUsed: 11.30, loyaltyEligibleAmount: 0, hasStoreCredit: true, parseSuccess: true }
    },
    {
      name: 'No store credit used',
      note: `BinderPOS Cart #23565917

--- Tenders ---
Credit: $102.21`,
      totalAmount: 102.21,
      expected: { storeCreditUsed: 0, loyaltyEligibleAmount: 102.21, hasStoreCredit: false, parseSuccess: true }
    },
    {
      name: 'Empty order note',
      note: null,
      totalAmount: 50.00,
      expected: { storeCreditUsed: 0, loyaltyEligibleAmount: 50.00, hasStoreCredit: false, parseSuccess: true }
    },
    {
      name: 'Invalid total amount',
      note: 'Store credit used: $10.00',
      totalAmount: -5.00,
      expected: { storeCreditUsed: 0, loyaltyEligibleAmount: 0, hasStoreCredit: false, parseSuccess: false }
    },
    {
      name: 'Store credit exceeds total',
      note: 'Store credit used: $100.00',
      totalAmount: 50.00,
      expected: { storeCreditUsed: 50.00, loyaltyEligibleAmount: 0, hasStoreCredit: true, parseSuccess: true }
    }
  ];

  const results = testCases.map((testCase, index) => {
    try {
      const result = parseStoreCreditFromNote(testCase.note, testCase.totalAmount);
      const passed = 
        Math.abs(result.storeCreditUsed - testCase.expected.storeCreditUsed) < 0.01 &&
        Math.abs(result.loyaltyEligibleAmount - testCase.expected.loyaltyEligibleAmount) < 0.01 &&
        result.hasStoreCredit === testCase.expected.hasStoreCredit &&
        result.parseSuccess === testCase.expected.parseSuccess;

      return {
        testCase: index + 1,
        name: testCase.name,
        passed,
        expected: testCase.expected,
        actual: {
          storeCreditUsed: result.storeCreditUsed,
          loyaltyEligibleAmount: result.loyaltyEligibleAmount,
          hasStoreCredit: result.hasStoreCredit,
          parseSuccess: result.parseSuccess
        },
        error: result.errorMessage
      };
    } catch (error) {
      return {
        testCase: index + 1,
        name: testCase.name,
        passed: false,
        expected: testCase.expected,
        actual: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length
  };

  logOrderProcessing('store-credit-validation', 'test', 
    `Validation complete: ${summary.passed}/${summary.total} tests passed`);

  return { results, summary };
}
