/**
 * Customer Reward service implementation
 *
 * Implements business logic for customer reward operations
 */

import { CustomerReward } from "../../interfaces/models/customerReward.interface";
import { ICustomerRewardService } from "../../interfaces/services/customerReward.service.interface";
import { customerRewardRepository, rewardRepository } from "../../repositories";

export class CustomerRewardService implements ICustomerRewardService {
  /**
   * Get all customer rewards
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async getAllCustomerRewards(options?: any): Promise<CustomerReward[]> {
    return customerRewardRepository.findAll(options);
  }

  /**
   * Get customer reward by ID
   * @param id Customer reward ID
   * @returns Promise resolving to customer reward or null if not found
   */
  async getCustomerRewardById(id: string): Promise<CustomerReward | null> {
    return customerRewardRepository.findById(id);
  }

  /**
   * Create a new customer reward
   * @param customerRewardData Customer reward data
   * @returns Promise resolving to created customer reward
   */
  async createCustomerReward(
    customerRewardData: Partial<CustomerReward>
  ): Promise<CustomerReward> {
    return customerRewardRepository.create(customerRewardData);
  }

  /**
   * Update an existing customer reward
   * @param id Customer reward ID
   * @param customerRewardData Updated customer reward data
   * @returns Promise resolving to updated customer reward or null if not found
   */
  async updateCustomerReward(
    id: string,
    customerRewardData: Partial<CustomerReward>
  ): Promise<CustomerReward | null> {
    const customerReward = await customerRewardRepository.findById(id);
    if (!customerReward) {
      return null;
    }

    return customerRewardRepository.update(id, customerRewardData);
  }

  /**
   * Delete a customer reward
   * @param id Customer reward ID
   * @returns Promise resolving to boolean indicating success
   */
  async deleteCustomerReward(id: string): Promise<boolean> {
    return customerRewardRepository.delete(id);
  }

  /**
   * Get customer rewards by customer ID
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async getCustomerRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    return customerRewardRepository.findByCustomerId(customerId, options);
  }

  /**
   * Get customer rewards by reward ID
   * @param rewardId Reward ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async getCustomerRewardsByRewardId(
    rewardId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    return customerRewardRepository.findByRewardId(rewardId, options);
  }

  /**
   * Get active (non-expired, non-redeemed) rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of active customer rewards
   */
  async getActiveRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    return customerRewardRepository.findActiveByCustomerId(customerId, options);
  }

  /**
   * Get redeemed rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of redeemed customer rewards
   */
  async getRedeemedRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    return customerRewardRepository.findRedeemedByCustomerId(
      customerId,
      options
    );
  }

  /**
   * Get expired rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of expired customer rewards
   */
  async getExpiredRewardsByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    return customerRewardRepository.findExpiredByCustomerId(
      customerId,
      options
    );
  }

  /**
   * Mark a customer reward as redeemed
   * @param id Customer reward ID
   * @param redeemedDate Date of redemption (defaults to current date)
   * @returns Promise resolving to updated customer reward or null if not found
   */
  async redeemCustomerReward(
    id: string,
    redeemedDate?: Date
  ): Promise<CustomerReward | null> {
    return customerRewardRepository.markAsRedeemed(id, redeemedDate);
  }

  /**
   * Get rewards expiring soon for a customer
   * @param customerId Customer ID
   * @param daysThreshold Number of days to consider "soon" (default: 30)
   * @param options Optional query options
   * @returns Promise resolving to array of soon-to-expire customer rewards
   */
  async getRewardsExpiringSoon(
    customerId: string,
    daysThreshold: number = 30,
    options?: any
  ): Promise<CustomerReward[]> {
    return customerRewardRepository.findExpiringSoon(
      customerId,
      daysThreshold,
      options
    );
  }

  /**
   * Issue a reward to a customer
   * @param customerId Customer ID
   * @param rewardId Reward ID
   * @param expiryDate Optional expiry date
   * @returns Promise resolving to created customer reward
   */
  async issueRewardToCustomer(
    customerId: string,
    rewardId: string,
    expiryDate?: Date
  ): Promise<CustomerReward> {
    // Verify reward exists
    const reward = await rewardRepository.findById(rewardId);
    if (!reward) {
      throw new Error(`Reward with ID ${rewardId} not found`);
    }

    // Set default expiry date if not provided (30 days from now)
    if (!expiryDate) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
    }

    // Create customer reward
    const customerRewardData: Partial<CustomerReward> = {
      customer_id: customerId,
      reward_id: rewardId,
      is_redeemed: false,
      expiry_date: expiryDate,
    };

    return customerRewardRepository.create(customerRewardData);
  }
}
