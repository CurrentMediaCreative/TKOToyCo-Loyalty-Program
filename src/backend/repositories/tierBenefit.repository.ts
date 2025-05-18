/**
 * Tier Benefit repository implementation
 *
 * Implements operations specific to tier benefit entities
 */

import { Op } from "sequelize";
import { TierBenefit as TierBenefitModel } from "../models/tierBenefit.model";
import { TierBenefit } from "../interfaces/models/tierBenefit.interface";
import { ITierBenefitRepository } from "../interfaces/repositories/tierBenefit.repository.interface";
import { BaseRepository } from "./base.repository";

export class TierBenefitRepository
  extends BaseRepository<TierBenefitModel, TierBenefit>
  implements ITierBenefitRepository
{
  constructor() {
    super(TierBenefitModel);
  }

  /**
   * Find benefits by tier ID
   * @param tierId Tier ID
   * @returns Promise resolving to array of tier benefits
   */
  async findByTierId(tierId: string): Promise<TierBenefit[]> {
    const benefits = await this.model.findAll({
      where: { tier_id: tierId },
    });
    return benefits.map((benefit) => benefit.toJSON() as TierBenefit);
  }

  /**
   * Find active benefits by tier ID
   * @param tierId Tier ID
   * @returns Promise resolving to array of active tier benefits
   */
  async findActiveByTierId(tierId: string): Promise<TierBenefit[]> {
    const benefits = await this.model.findAll({
      where: {
        tier_id: tierId,
        is_active: true,
      },
    });
    return benefits.map((benefit) => benefit.toJSON() as TierBenefit);
  }

  /**
   * Find benefits by type
   * @param benefitType Type of benefit
   * @param options Optional query options
   * @returns Promise resolving to array of tier benefits
   */
  async findByBenefitType(
    benefitType: string,
    options?: any
  ): Promise<TierBenefit[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        benefit_type: benefitType,
      },
    };

    const benefits = await this.model.findAll(queryOptions);
    return benefits.map((benefit) => benefit.toJSON() as TierBenefit);
  }

  /**
   * Activate a tier benefit
   * @param id Tier benefit ID
   * @returns Promise resolving to updated tier benefit or null if not found
   */
  async activate(id: string): Promise<TierBenefit | null> {
    const benefit = await this.model.findByPk(id);
    if (!benefit) {
      return null;
    }

    benefit.is_active = true;
    await benefit.save();

    return benefit.toJSON() as TierBenefit;
  }

  /**
   * Deactivate a tier benefit
   * @param id Tier benefit ID
   * @returns Promise resolving to updated tier benefit or null if not found
   */
  async deactivate(id: string): Promise<TierBenefit | null> {
    const benefit = await this.model.findByPk(id);
    if (!benefit) {
      return null;
    }

    benefit.is_active = false;
    await benefit.save();

    return benefit.toJSON() as TierBenefit;
  }

  /**
   * Find benefits by tier IDs
   * @param tierIds Array of tier IDs
   * @param options Optional query options
   * @returns Promise resolving to array of tier benefits
   */
  async findByTierIds(
    tierIds: string[],
    options?: any
  ): Promise<TierBenefit[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        tier_id: {
          [Op.in]: tierIds,
        },
      },
    };

    const benefits = await this.model.findAll(queryOptions);
    return benefits.map((benefit) => benefit.toJSON() as TierBenefit);
  }
}
