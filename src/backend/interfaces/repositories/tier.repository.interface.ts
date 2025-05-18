/**
 * Tier repository interface
 *
 * Defines operations specific to tier entities
 */

import { Tier } from "../models/tier.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface ITierRepository extends IBaseRepository<Tier> {
  /**
   * Find tier by name
   * @param name Tier name
   * @returns Promise resolving to tier or null if not found
   */
  findByName(name: string): Promise<Tier | null>;

  /**
   * Find tier by spend threshold
   * @param amount Spend amount
   * @returns Promise resolving to appropriate tier based on spend threshold
   */
  findBySpendThreshold(amount: number): Promise<Tier | null>;

  /**
   * Find all active tiers
   * @param options Optional query options
   * @returns Promise resolving to array of active tiers
   */
  findAllActive(options?: any): Promise<Tier[]>;

  /**
   * Find next tier based on current tier
   * @param currentTierId Current tier ID
   * @returns Promise resolving to next tier or null if highest tier
   */
  findNextTier(currentTierId: string): Promise<Tier | null>;

  /**
   * Find previous tier based on current tier
   * @param currentTierId Current tier ID
   * @returns Promise resolving to previous tier or null if lowest tier
   */
  findPreviousTier(currentTierId: string): Promise<Tier | null>;

  /**
   * Get all tiers ordered by spend threshold
   * @param ascending Whether to sort in ascending order (default: true)
   * @returns Promise resolving to ordered array of tiers
   */
  findAllOrdered(ascending?: boolean): Promise<Tier[]>;
}
