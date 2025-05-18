/**
 * Reward repository interface
 *
 * Defines operations specific to reward entities
 */

import { Reward } from "../models/reward.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface IRewardRepository extends IBaseRepository<Reward> {
  /**
   * Find rewards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  findByTierId(tierId: string, options?: any): Promise<Reward[]>;

  /**
   * Find active rewards
   * @param options Optional query options
   * @returns Promise resolving to array of active rewards
   */
  findAllActive(options?: any): Promise<Reward[]>;

  /**
   * Find rewards by type
   * @param rewardType Type of reward
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  findByRewardType(rewardType: string, options?: any): Promise<Reward[]>;

  /**
   * Find rewards by date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<Reward[]>;

  /**
   * Activate a reward
   * @param id Reward ID
   * @returns Promise resolving to updated reward or null if not found
   */
  activate(id: string): Promise<Reward | null>;

  /**
   * Deactivate a reward
   * @param id Reward ID
   * @returns Promise resolving to updated reward or null if not found
   */
  deactivate(id: string): Promise<Reward | null>;

  /**
   * Find rewards available for a specific tier and all lower tiers
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  findAvailableForTier(tierId: string, options?: any): Promise<Reward[]>;
}
