/**
 * Customer Reward repository interface
 *
 * Defines operations specific to customer reward entities
 */

import { CustomerReward } from "../models/customerReward.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface ICustomerRewardRepository
  extends IBaseRepository<CustomerReward> {
  /**
   * Find customer rewards by customer ID
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  findByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Find customer rewards by reward ID
   * @param rewardId Reward ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  findByRewardId(rewardId: string, options?: any): Promise<CustomerReward[]>;

  /**
   * Find active (non-expired, non-redeemed) rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of active customer rewards
   */
  findActiveByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Find redeemed rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of redeemed customer rewards
   */
  findRedeemedByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Find expired rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of expired customer rewards
   */
  findExpiredByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]>;

  /**
   * Mark a customer reward as redeemed
   * @param id Customer reward ID
   * @param redeemedDate Date of redemption (defaults to current date)
   * @returns Promise resolving to updated customer reward or null if not found
   */
  markAsRedeemed(
    id: string,
    redeemedDate?: Date
  ): Promise<CustomerReward | null>;

  /**
   * Find rewards expiring soon for a customer
   * @param customerId Customer ID
   * @param daysThreshold Number of days to consider "soon" (default: 30)
   * @param options Optional query options
   * @returns Promise resolving to array of soon-to-expire customer rewards
   */
  findExpiringSoon(
    customerId: string,
    daysThreshold?: number,
    options?: any
  ): Promise<CustomerReward[]>;
}
