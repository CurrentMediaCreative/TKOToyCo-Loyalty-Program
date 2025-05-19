import { Customer, Tier, Transaction, TierProgress } from "../models/Customer";

/**
 * Interface for customer data services
 *
 * This interface defines the standard operations that any customer data service
 * should implement, whether it's accessing a remote API or a local database.
 */
export interface ICustomerService {
  /**
   * Test the connection to the data source
   * @returns Promise resolving to true if connection is successful, false otherwise
   */
  testConnection(): Promise<boolean>;

  /**
   * Get a customer by their ID
   * @param id The customer ID
   * @returns Promise resolving to the customer or null if not found
   */
  getCustomerById(id: string): Promise<Customer | null>;

  /**
   * Get a customer by their phone number
   * @param phone The phone number
   * @returns Promise resolving to the customer or null if not found
   */
  getCustomerByPhone(phone: string): Promise<Customer | null>;

  /**
   * Search for customers by name, email, or phone
   * @param query The search query
   * @returns Promise resolving to an array of matching customers
   */
  searchCustomers(query: string): Promise<Customer[]>;

  /**
   * Get all customers
   * @param limit Maximum number of customers to return
   * @returns Promise resolving to an array of customers
   */
  getAllCustomers(limit?: number): Promise<Customer[]>;

  /**
   * Get all loyalty tiers
   * @returns Promise resolving to an array of tiers
   */
  getAllTiers(): Promise<Tier[]>;

  /**
   * Get a tier by its ID
   * @param id The tier ID
   * @returns Promise resolving to the tier or null if not found
   */
  getTierById(id: string): Promise<Tier | null>;

  /**
   * Get transactions for a customer
   * @param customerId The customer ID
   * @returns Promise resolving to an array of transactions
   */
  getCustomerTransactions(customerId: string): Promise<Transaction[]>;

  /**
   * Calculate a customer's total spend
   * @param customerId The customer ID
   * @returns Promise resolving to the total spend amount
   */
  getCustomerTotalSpend(customerId: string): Promise<number>;

  /**
   * Calculate a customer's progress toward the next tier
   * @param customer The customer object
   * @returns Promise resolving to tier progress information
   */
  calculateTierProgress(customer: Customer): Promise<TierProgress>;
}
