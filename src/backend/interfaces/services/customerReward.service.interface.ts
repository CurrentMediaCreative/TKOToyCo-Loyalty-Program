/**
 * Customer Reward service interface
 *
 * Defines operations for customer reward business logic
 */

import { CustomerReward } from "../models/customerReward.interface";

export interface ICustomerRewardService {
  /**
   * Get all customer rewards
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  getAllCustomerRewards(options?: any): Promise<CustomerReward[]>;

  /**
   * Get customer reward by ID
   * @param id Customer reward ID
   * @returns Promise resolving to customer reward or null if not found
   */
  getCustomerRewardById(id: string): Promise<CustomerReward | null>;

  /**
   * Create a new customer reward
   * @param customerRewardData Customer reward data
   * @returns Promise resolving to created customer reward
   */
  createCustomerReward(
    customerRewardData: Partial<CustomerReward>
  ): Promise<CustomerReward>;

  /**
   * Update an existing customer reward
   * @param id Customer reward ID
   * @param customerRewardData Updated customer reward data
   * @returns Promise resolving to updated customer reward or null if not found
   */
  updateCustomerReward(
    id: string,
    customerRewardData: Partial<CustomerReward>
  ): Promise<CustomerReward | null>;

  /**
   * Delete a customer reward
   * @param id Customer reward ID
   * @returns Promise resolving to boolean indicating success
   */
  deleteCustomerReward(id: string): Promise<boolean>;

  /**
   * Get customer rewards by customer ID
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  getCustomerRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Get customer rewards by reward ID
   * @param rewardId Reward ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  getCustomerRewardsByRewardId(
    rewardId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Get active (non-expired, non-redeemed) rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of active customer rewards
   */
  getActiveRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Get redeemed rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of redeemed customer rewards
   */
  getRedeemedRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Get expired rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of expired customer rewards
   */
  getExpiredRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Mark a customer reward as redeemed
   * @param id Customer reward ID
   * @param redeemedDate Date of redemption (defaults to current date)
   * @returns Promise resolving to updated customer reward or null if not found
   */
  redeemCustomerReward(
    id: string,
    redeemedDate?: Date
  ): Promise<CustomerReward | null>;

  /**
   * Get rewards expiring soon for a customer
   * @param customerId Customer ID
   * @param daysThreshold Number of days to consider "soon" (default: 30)
   * @param options Optional query options
   * @returns Promise resolving to array of soon-to-expire customer rewards
   */
  getRewardsExpiringSoon(
    customerId: string,
    daysThreshold?: number,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Issue a reward to a customer
   * @param customerId Customer ID
   * @param rewardId Reward ID
   * @param expiryDate Optional expiry date
   * @returns Promise resolving to created customer reward
   */
  issueRewardToCustomer(
    customerId: string,
    rewardId: string,
    expiryDate?: Date
  ): Promise<CustomerReward>;
}
