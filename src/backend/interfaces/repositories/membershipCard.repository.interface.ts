/**
 * Membership Card repository interface
 *
 * Defines operations specific to membership card entities
 */

import { MembershipCard } from "../models/membershipCard.interface";
import { IBaseRepository } from "./base.repository.interface";

export interface IMembershipCardRepository
  extends IBaseRepository<MembershipCard> {
  /**
   * Find membership card by customer ID
   * @param customerId Customer ID
   * @returns Promise resolving to membership card or null if not found
   */
  findByCustomerId(customerId: string): Promise<MembershipCard | null>;

  /**
   * Find membership card by card number
   * @param cardNumber Card number
   * @returns Promise resolving to membership card or null if not found
   */
  findByCardNumber(cardNumber: string): Promise<MembershipCard | null>;

  /**
   * Find membership card by NFC ID
   * @param nfcId NFC identifier
   * @returns Promise resolving to membership card or null if not found
   */
  findByNfcId(nfcId: string): Promise<MembershipCard | null>;

  /**
   * Activate a membership card
   * @param id Membership card ID
   * @param activationDate Date of activation (defaults to current date)
   * @returns Promise resolving to updated membership card or null if not found
   */
  activate(id: string, activationDate?: Date): Promise<MembershipCard | null>;

  /**
   * Deactivate a membership card
   * @param id Membership card ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  deactivate(id: string): Promise<MembershipCard | null>;

  /**
   * Update card tier
   * @param id Membership card ID
   * @param tierId New tier ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  updateTier(id: string, tierId: string): Promise<MembershipCard | null>;

  /**
   * Find cards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of membership cards
   */
  findByTierId(tierId: string, options?: any): Promise<MembershipCard[]>;

  /**
   * Find active cards
   * @param options Optional query options
   * @returns Promise resolving to array of active membership cards
   */
  findAllActive(options?: any): Promise<MembershipCard[]>;
}
