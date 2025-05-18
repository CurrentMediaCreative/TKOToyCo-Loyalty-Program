/**
 * Membership Card service interface
 *
 * Defines operations for membership card business logic
 */

import { MembershipCard } from "../models/membershipCard.interface";

export interface IMembershipCardService {
  /**
   * Get all membership cards
   * @param options Optional query options
   * @returns Promise resolving to array of membership cards
   */
  getAllMembershipCards(options?: any): Promise<MembershipCard[]>;

  /**
   * Get membership card by ID
   * @param id Membership card ID
   * @returns Promise resolving to membership card or null if not found
   */
  getMembershipCardById(id: string): Promise<MembershipCard | null>;

  /**
   * Create a new membership card
   * @param membershipCardData Membership card data
   * @returns Promise resolving to created membership card
   */
  createMembershipCard(
    membershipCardData: Partial<MembershipCard>
  ): Promise<MembershipCard>;

  /**
   * Update an existing membership card
   * @param id Membership card ID
   * @param membershipCardData Updated membership card data
   * @returns Promise resolving to updated membership card or null if not found
   */
  updateMembershipCard(
    id: string,
    membershipCardData: Partial<MembershipCard>
  ): Promise<MembershipCard | null>;

  /**
   * Delete a membership card
   * @param id Membership card ID
   * @returns Promise resolving to boolean indicating success
   */
  deleteMembershipCard(id: string): Promise<boolean>;

  /**
   * Get membership card by customer ID
   * @param customerId Customer ID
   * @returns Promise resolving to membership card or null if not found
   */
  getMembershipCardByCustomerId(
    customerId: string
  ): Promise<MembershipCard | null>;

  /**
   * Get membership card by card number
   * @param cardNumber Card number
   * @returns Promise resolving to membership card or null if not found
   */
  getMembershipCardByCardNumber(
    cardNumber: string
  ): Promise<MembershipCard | null>;

  /**
   * Get membership card by NFC ID
   * @param nfcId NFC ID
   * @returns Promise resolving to membership card or null if not found
   */
  getMembershipCardByNfcId(nfcId: string): Promise<MembershipCard | null>;

  /**
   * Activate a membership card
   * @param id Membership card ID
   * @param activationDate Date of activation (defaults to current date)
   * @returns Promise resolving to updated membership card or null if not found
   */
  activateMembershipCard(
    id: string,
    activationDate?: Date
  ): Promise<MembershipCard | null>;

  /**
   * Deactivate a membership card
   * @param id Membership card ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  deactivateMembershipCard(id: string): Promise<MembershipCard | null>;

  /**
   * Update card tier
   * @param id Membership card ID
   * @param tierId New tier ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  updateMembershipCardTier(
    id: string,
    tierId: string
  ): Promise<MembershipCard | null>;

  /**
   * Get membership cards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of membership cards
   */
  getMembershipCardsByTierId(
    tierId: string,
    options?: any
  ): Promise<MembershipCard[]>;

  /**
   * Get active membership cards
   * @param options Optional query options
   * @returns Promise resolving to array of active membership cards
   */
  getActiveMembershipCards(options?: any): Promise<MembershipCard[]>;

  /**
   * Generate a new card number
   * @returns Promise resolving to unique card number
   */
  generateCardNumber(): Promise<string>;

  /**
   * Issue a new membership card to a customer
   * @param customerId Customer ID
   * @param tierId Tier ID
   * @param nfcId Optional NFC ID
   * @returns Promise resolving to created membership card
   */
  issueMembershipCard(
    customerId: string,
    tierId: string,
    nfcId?: string
  ): Promise<MembershipCard>;

  /**
   * Update NFC ID for a membership card
   * @param id Membership card ID
   * @param nfcId NFC ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  updateNfcId(id: string, nfcId: string): Promise<MembershipCard | null>;
}
