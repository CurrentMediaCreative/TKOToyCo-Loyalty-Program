/**
 * Reward service implementation
 *
 * Implements business logic for reward operations
 */

import { Reward } from "../../interfaces/models/reward.interface";
import { IRewardService } from "../../interfaces/services/reward.service.interface";
import { rewardRepository } from "../../repositories";

export class RewardService implements IRewardService {
  /**
   * Get all rewards
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async getAllRewards(options?: any): Promise<Reward[]> {
    return rewardRepository.findAll(options);
  }

  /**
   * Get reward by ID
   * @param id Reward ID
   * @returns Promise resolving to reward or null if not found
   */
  async getRewardById(id: string): Promise<Reward | null> {
    return rewardRepository.findById(id);
  }

  /**
   * Create a new reward
   * @param rewardData Reward data
   * @returns Promise resolving to created reward
   */
  async createReward(rewardData: Partial<Reward>): Promise<Reward> {
    return rewardRepository.create(rewardData);
  }

  /**
   * Update an existing reward
   * @param id Reward ID
   * @param rewardData Updated reward data
   * @returns Promise resolving to updated reward or null if not found
   */
  async updateReward(
    id: string,
    rewardData: Partial<Reward>
  ): Promise<Reward | null> {
    const reward = await rewardRepository.findById(id);
    if (!reward) {
      return null;
    }

    return rewardRepository.update(id, rewardData);
  }

  /**
   * Delete a reward
   * @param id Reward ID
   * @returns Promise resolving to boolean indicating success
   */
  async deleteReward(id: string): Promise<boolean> {
    return rewardRepository.delete(id);
  }

  /**
   * Get rewards by type
   * @param type Reward type
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async getRewardsByType(type: string, options?: any): Promise<Reward[]> {
    return rewardRepository.findByRewardType(type, options);
  }

  /**
   * Get rewards by point cost range
   * @param minPoints Minimum point cost
   * @param maxPoints Maximum point cost
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async getRewardsByPointRange(
    minPoints: number,
    maxPoints: number,
    options?: any
  ): Promise<Reward[]> {
    return rewardRepository.findByPointRange(minPoints, maxPoints, options);
  }

  /**
   * Get active rewards
   * @param options Optional query options
   * @returns Promise resolving to array of active rewards
   */
  async getActiveRewards(options?: any): Promise<Reward[]> {
    return rewardRepository.findAllActive(options);
  }

  /**
   * Get rewards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async getRewardsByTierId(tierId: string, options?: any): Promise<Reward[]> {
    return rewardRepository.findByTierId(tierId, options);
  }
}
