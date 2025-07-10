/**
 * Utility functions for handling data serialization, particularly BigInt values
 */

/**
 * Recursively converts BigInt values to strings in an object or array
 * This is needed because JSON.stringify() cannot serialize BigInt values
 */
export function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "bigint") {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === "object") {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }

  return obj;
}

/**
 * Specifically handles customer data serialization
 * Converts shopifyId from BigInt to string
 */
export function serializeCustomerData(customer: any): any {
  if (!customer) return customer;

  return {
    ...customer,
    shopifyId: customer.shopifyId
      ? customer.shopifyId.toString()
      : customer.shopifyId,
  };
}

/**
 * Handles transaction data with customer relationships
 */
export function serializeTransactionData(transactions: any[]): any[] {
  return transactions.map((transaction) => ({
    ...transaction,
    customer: transaction.customer
      ? serializeCustomerData(transaction.customer)
      : transaction.customer,
  }));
}
