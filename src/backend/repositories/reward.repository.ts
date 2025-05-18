/**
 * Reward repository implementation
 *
 * Implements operations specific to reward entities
 */

import { Op } from "sequelize";
import { Reward as RewardModel } from "../models/reward.model";
import { Reward } from "../interfaces/models/reward.interface";
import { IRewardRepository } from "../interfaces/repositories/reward.repository.interface";
import { BaseRepository } from "./base.repository";

export class RewardRepository
  extends BaseRepository<RewardModel, Reward>
  implements IRewardRepository
{
  constructor() {
    super(RewardModel);
  }

  /**
   * Find reward by name
   * @param name Reward name
   * @returns Promise resolving to reward or null if not found
   */
  async findByName(name: string): Promise<Reward | null> {
    const reward = await this.model.findOne({
      where: { name },
    });
    return reward ? (reward.toJSON() as Reward) : null;
  }

  /**
   * Find rewards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async findByTierId(tierId: string, options?: any): Promise<Reward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        tier_id: tierId,
      },
    };

    const rewards = await this.model.findAll(queryOptions);
    return rewards.map((reward) => reward.toJSON() as Reward);
  }

  /**
   * Find rewards by type
   * @param rewardType Type of reward
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async findByRewardType(rewardType: string, options?: any): Promise<Reward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        type: rewardType,
      },
    };

    const rewards = await this.model.findAll(queryOptions);
    return rewards.map((reward) => reward.toJSON() as Reward);
  }

  /**
   * Find active rewards
   * @param options Optional query options
   * @returns Promise resolving to array of active rewards
   */
  async findAllActive(options?: any): Promise<Reward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        is_active: true,
      },
    };

    const rewards = await this.model.findAll(queryOptions);
    return rewards.map((reward) => reward.toJSON() as Reward);
  }

  /**
   * Find rewards by date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<Reward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    };

    const rewards = await this.model.findAll(queryOptions);
    return rewards.map((reward) => reward.toJSON() as Reward);
  }

  /**
   * Find rewards by point value range
   * @param minPoints Minimum point value
   * @param maxPoints Maximum point value
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async findByPointRange(
    minPoints: number,
    maxPoints: number,
    options?: any
  ): Promise<Reward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        point_value: {
          [Op.between]: [minPoints, maxPoints],
        },
      },
    };

    const rewards = await this.model.findAll(queryOptions);
    return rewards.map((reward) => reward.toJSON() as Reward);
  }

  /**
   * Activate a reward
   * @param id Reward ID
   * @returns Promise resolving to updated reward or null if not found
   */
  async activate(id: string): Promise<Reward | null> {
    const reward = await this.model.findByPk(id);
    if (!reward) {
      return null;
    }

    reward.is_active = true;
    await reward.save();

    return reward.toJSON() as Reward;
  }

  /**
   * Deactivate a reward
   * @param id Reward ID
   * @returns Promise resolving to updated reward or null if not found
   */
  async deactivate(id: string): Promise<Reward | null> {
    const reward = await this.model.findByPk(id);
    if (!reward) {
      return null;
    }

    reward.is_active = false;
    await reward.save();

    return reward.toJSON() as Reward;
  }

  /**
   * Find rewards available for a specific tier and all lower tiers
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of rewards
   */
  async findAvailableForTier(tierId: string, options?: any): Promise<Reward[]> {
    // First, get the tier to determine its level
    const tierModel = await this.model.sequelize?.models.Tier.findByPk(tierId);
    if (!tierModel) {
      return [];
    }

    const tier = tierModel.toJSON();

    // Find all tiers with level less than or equal to this tier's level
    const eligibleTiers = await this.model.sequelize?.models.Tier.findAll({
      where: {
        level: {
          [Op.lte]: tier.level,
        },
      },
    });

    if (!eligibleTiers || eligibleTiers.length === 0) {
      return [];
    }

    const eligibleTierIds = eligibleTiers.map((t: any) => t.get("id"));

    // Find rewards for these tiers
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        tier_id: {
          [Op.in]: eligibleTierIds,
        },
        is_active: true,
      },
    };

    const rewards = await this.model.findAll(queryOptions);
    return rewards.map((reward) => reward.toJSON() as Reward);
  }
}
