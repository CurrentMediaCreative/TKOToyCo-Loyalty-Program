/**
 * Tier Benefit repository interface
 *
 * Defines operations specific to tier benefit entities
 */

import { TierBenefit } from "../models/tierBenefit.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface ITierBenefitRepository extends IBaseRepository<TierBenefit> {
  /**
   * Find benefits by tier ID
   * @param tierId Tier ID
   * @returns Promise resolving to array of tier benefits
   */
  findByTierId(tierId: string): Promise<TierBenefit[]>;

  /**
   * Find active benefits by tier ID
   * @param tierId Tier ID
   * @returns Promise resolving to array of active tier benefits
   */
  findActiveByTierId(tierId: string): Promise<TierBenefit[]>;

  /**
   * Find benefits by type
   * @param benefitType Type of benefit
   * @param options Optional query options
   * @returns Promise resolving to array of tier benefits
   */
  findByBenefitType(benefitType: string, options?: any): Promise<TierBenefit[]>;

  /**
   * Activate a tier benefit
   * @param id Tier benefit ID
   * @returns Promise resolving to updated tier benefit or null if not found
   */
  activate(id: string): Promise<TierBenefit | null>;

  /**
   * Deactivate a tier benefit
   * @param id Tier benefit ID
   * @returns Promise resolving to updated tier benefit or null if not found
   */
  deactivate(id: string): Promise<TierBenefit | null>;

  /**
   * Find benefits by tier IDs
   * @param tierIds Array of tier IDs
   * @param options Optional query options
   * @returns Promise resolving to array of tier benefits
   */
  findByTierIds(tierIds: string[], options?: any): Promise<TierBenefit[]>;
}
