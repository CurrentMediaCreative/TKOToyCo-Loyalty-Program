import { Customer, Tier, TierProgress } from '../models/Customer';

/**
 * Interface for customer data service
 * This allows us to swap implementations (mock vs. real API) without changing the consuming code
 */
export interface ICustomerService {
  /**
   * Get a customer by phone number
   * @param phoneNumber The customer's phone number
   * @returns Promise resolving to the customer or null if not found
   */
  getCustomerByPhone(phoneNumber: string): Promise<Customer | null>;
  
  /**
   * Get a customer by ID
   * @param id The customer's ID
   * @returns Promise resolving to the customer or null if not found
   */
  getCustomerById(id: string): Promise<Customer | null>;
  
  /**
   * Calculate tier progress for a customer
   * @param customer The customer
   * @returns The tier progress information
   */
  calculateTierProgress(customer: Customer): TierProgress;
  
  /**
   * Get all tiers
   * @returns Promise resolving to array of all tiers
   */
  getAllTiers(): Promise<Tier[]>;
}
