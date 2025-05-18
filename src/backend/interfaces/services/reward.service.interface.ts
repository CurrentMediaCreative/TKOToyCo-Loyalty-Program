/**
 * Reward service interface
 *
 * Defines operations for reward business logic
 */

import { Reward } from "../models/reward.interface";

export interface IRewardService {
  /**
   * Get all rewards
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  getAllRewards(options?: any): Promise<Reward[]>;

  /**
   * Get reward by ID
   * @param id Reward ID
   * @returns Promise resolving to reward or null if not found
   */
  getRewardById(id: string): Promise<Reward | null>;

  /**
   * Create a new reward
   * @param rewardData Reward data
   * @returns Promise resolving to created reward
   */
  createReward(rewardData: Partial<Reward>): Promise<Reward>;

  /**
   * Update an existing reward
   * @param id Reward ID
   * @param rewardData Updated reward data
   * @returns Promise resolving to updated reward or null if not found
   */
  updateReward(id: string, rewardData: Partial<Reward>): Promise<Reward | null>;

  /**
   * Delete a reward
   * @param id Reward ID
   * @returns Promise resolving to boolean indicating success
   */
  deleteReward(id: string): Promise<boolean>;

  /**
   * Get rewards by type
   * @param type Reward type
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  getRewardsByType(type: string, options?: any): Promise<Reward[]>;

  /**
   * Get rewards by point cost range
   * @param minPoints Minimum point cost
   * @param maxPoints Maximum point cost
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  getRewardsByPointRange(
    minPoints: number,
    maxPoints: number,
    options?: any
  ): Promise<Reward[]>;

  /**
   * Get active rewards
   * @param options Optional query options
   * @returns Promise resolving to array of active rewards
   */
  getActiveRewards(options?: any): Promise<Reward[]>;

  /**
   * Get rewards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  getRewardsByTierId(tierId: string, options?: any): Promise<Reward[]>;
}
