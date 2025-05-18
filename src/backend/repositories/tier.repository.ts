/**
 * Tier repository implementation
 *
 * Implements operations specific to tier entities
 */

import { Op } from "sequelize";
import { Tier as TierModel } from "../models/tier.model";
import { Tier } from "../interfaces/models/tier.interface";
import { ITierRepository } from "../interfaces/repositories/tier.repository.interface";
import { BaseRepository } from "./base.repository";

export class TierRepository
  extends BaseRepository<TierModel, Tier>
  implements ITierRepository
{
  constructor() {
    super(TierModel);
  }

  /**
   * Find tier by name
   * @param name Tier name
   * @returns Promise resolving to tier or null if not found
   */
  async findByName(name: string): Promise<Tier | null> {
    const tier = await this.model.findOne({
      where: { name },
    });
    return tier ? (tier.toJSON() as Tier) : null;
  }

  /**
   * Find tier by spend threshold
   * @param amount Spend amount
   * @returns Promise resolving to appropriate tier based on spend threshold
   */
  async findBySpendThreshold(amount: number): Promise<Tier | null> {
    // Find the tier with the highest spend threshold that is less than or equal to the amount
    const tier = await this.model.findOne({
      where: {
        spend_threshold: {
          [Op.lte]: amount,
        },
        is_active: true,
      },
      order: [["spend_threshold", "DESC"]],
    });

    return tier ? (tier.toJSON() as Tier) : null;
  }

  /**
   * Find all active tiers
   * @param options Optional query options
   * @returns Promise resolving to array of active tiers
   */
  async findAllActive(options?: any): Promise<Tier[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        is_active: true,
      },
    };

    const tiers = await this.model.findAll(queryOptions);
    return tiers.map((tier) => tier.toJSON() as Tier);
  }

  /**
   * Find next tier based on current tier
   * @param currentTierId Current tier ID
   * @returns Promise resolving to next tier or null if highest tier
   */
  async findNextTier(currentTierId: string): Promise<Tier | null> {
    const currentTier = await this.model.findByPk(currentTierId);
    if (!currentTier) {
      return null;
    }

    const nextTier = await this.model.findOne({
      where: {
        spend_threshold: {
          [Op.gt]: currentTier.spend_threshold,
        },
        is_active: true,
      },
      order: [["spend_threshold", "ASC"]],
    });

    return nextTier ? (nextTier.toJSON() as Tier) : null;
  }

  /**
   * Find previous tier based on current tier
   * @param currentTierId Current tier ID
   * @returns Promise resolving to previous tier or null if lowest tier
   */
  async findPreviousTier(currentTierId: string): Promise<Tier | null> {
    const currentTier = await this.model.findByPk(currentTierId);
    if (!currentTier) {
      return null;
    }

    const previousTier = await this.model.findOne({
      where: {
        spend_threshold: {
          [Op.lt]: currentTier.spend_threshold,
        },
        is_active: true,
      },
      order: [["spend_threshold", "DESC"]],
    });

    return previousTier ? (previousTier.toJSON() as Tier) : null;
  }

  /**
   * Get all tiers ordered by spend threshold
   * @param ascending Whether to sort in ascending order (default: true)
   * @returns Promise resolving to ordered array of tiers
   */
  async findAllOrdered(ascending: boolean = true): Promise<Tier[]> {
    const tiers = await this.model.findAll({
      order: [["spend_threshold", ascending ? "ASC" : "DESC"]],
    });

    return tiers.map((tier) => tier.toJSON() as Tier);
  }
}
