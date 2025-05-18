/**
 * Membership Card service implementation
 *
 * Implements business logic for membership card operations
 */

import { MembershipCard } from "../../interfaces/models/membershipCard.interface";
import { IMembershipCardService } from "../../interfaces/services/membershipCard.service.interface";
import { membershipCardRepository } from "../../repositories";

export class MembershipCardService implements IMembershipCardService {
  /**
   * Get all membership cards
   * @param options Optional query options
   * @returns Promise resolving to array of membership cards
   */
  async getAllMembershipCards(options?: any): Promise<MembershipCard[]> {
    return membershipCardRepository.findAll(options);
  }

  /**
   * Get membership card by ID
   * @param id Membership card ID
   * @returns Promise resolving to membership card or null if not found
   */
  async getMembershipCardById(id: string): Promise<MembershipCard | null> {
    return membershipCardRepository.findById(id);
  }

  /**
   * Create a new membership card
   * @param membershipCardData Membership card data
   * @returns Promise resolving to created membership card
   */
  async createMembershipCard(
    membershipCardData: Partial<MembershipCard>
  ): Promise<MembershipCard> {
    // Generate a card number if not provided
    if (!membershipCardData.card_number) {
      membershipCardData.card_number = await this.generateCardNumber();
    }

    // Set active status if not provided
    if (membershipCardData.is_active === undefined) {
      membershipCardData.is_active = true;
    }

    return membershipCardRepository.create(membershipCardData);
  }

  /**
   * Update an existing membership card
   * @param id Membership card ID
   * @param membershipCardData Updated membership card data
   * @returns Promise resolving to updated membership card or null if not found
   */
  async updateMembershipCard(
    id: string,
    membershipCardData: Partial<MembershipCard>
  ): Promise<MembershipCard | null> {
    const membershipCard = await membershipCardRepository.findById(id);
    if (!membershipCard) {
      return null;
    }

    return membershipCardRepository.update(id, membershipCardData);
  }

  /**
   * Delete a membership card
   * @param id Membership card ID
   * @returns Promise resolving to boolean indicating success
   */
  async deleteMembershipCard(id: string): Promise<boolean> {
    return membershipCardRepository.delete(id);
  }

  /**
   * Get membership card by customer ID
   * @param customerId Customer ID
   * @returns Promise resolving to membership card or null if not found
   */
  async getMembershipCardByCustomerId(
    customerId: string
  ): Promise<MembershipCard | null> {
    return membershipCardRepository.findByCustomerId(customerId);
  }

  /**
   * Get membership card by card number
   * @param cardNumber Card number
   * @returns Promise resolving to membership card or null if not found
   */
  async getMembershipCardByCardNumber(
    cardNumber: string
  ): Promise<MembershipCard | null> {
    return membershipCardRepository.findByCardNumber(cardNumber);
  }

  /**
   * Get membership card by NFC ID
   * @param nfcId NFC ID
   * @returns Promise resolving to membership card or null if not found
   */
  async getMembershipCardByNfcId(
    nfcId: string
  ): Promise<MembershipCard | null> {
    return membershipCardRepository.findByNfcId(nfcId);
  }

  /**
   * Activate a membership card
   * @param id Membership card ID
   * @param activationDate Date of activation (defaults to current date)
   * @returns Promise resolving to updated membership card or null if not found
   */
  async activateMembershipCard(
    id: string,
    activationDate?: Date
  ): Promise<MembershipCard | null> {
    return membershipCardRepository.activate(id);
  }

  /**
   * Deactivate a membership card
   * @param id Membership card ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  async deactivateMembershipCard(id: string): Promise<MembershipCard | null> {
    return membershipCardRepository.deactivate(id);
  }

  /**
   * Update card tier
   * @param id Membership card ID
   * @param tierId New tier ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  async updateMembershipCardTier(
    id: string,
    tierId: string
  ): Promise<MembershipCard | null> {
    return membershipCardRepository.updateTier(id, tierId);
  }

  /**
   * Get membership cards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of membership cards
   */
  async getMembershipCardsByTierId(
    tierId: string,
    options?: any
  ): Promise<MembershipCard[]> {
    return membershipCardRepository.findByTierId(tierId, options);
  }

  /**
   * Get active membership cards
   * @param options Optional query options
   * @returns Promise resolving to array of active membership cards
   */
  async getActiveMembershipCards(options?: any): Promise<MembershipCard[]> {
    return membershipCardRepository.findAllActive(options);
  }

  /**
   * Generate a new card number
   * @returns Promise resolving to unique card number
   */
  async generateCardNumber(): Promise<string> {
    return membershipCardRepository.generateUniqueCardNumber();
  }

  /**
   * Issue a new membership card to a customer
   * @param customerId Customer ID
   * @param tierId Tier ID
   * @param nfcId Optional NFC ID
   * @returns Promise resolving to created membership card
   */
  async issueMembershipCard(
    customerId: string,
    tierId: string,
    nfcId?: string
  ): Promise<MembershipCard> {
    // Check if customer already has a card
    const existingCard = await this.getMembershipCardByCustomerId(customerId);
    if (existingCard) {
      // Deactivate existing card
      await this.deactivateMembershipCard(existingCard.id);
    }

    // Create new card data
    const cardData: Partial<MembershipCard> = {
      customer_id: customerId,
      tier_id: tierId,
      nfc_id: nfcId,
      is_active: true,
      activation_date: new Date(),
    };

    // Create new card
    return this.createMembershipCard(cardData);
  }

  /**
   * Update NFC ID for a membership card
   * @param id Membership card ID
   * @param nfcId NFC ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  async updateNfcId(id: string, nfcId: string): Promise<MembershipCard | null> {
    return membershipCardRepository.updateNfcId(id, nfcId);
  }
}
