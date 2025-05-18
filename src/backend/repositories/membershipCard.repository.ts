/**
 * Membership Card repository implementation
 *
 * Implements operations specific to membership card entities
 */

import { Op } from "sequelize";
import { MembershipCard as MembershipCardModel } from "../models/membershipCard.model";
import { MembershipCard } from "../interfaces/models/membershipCard.interface";
import { IMembershipCardRepository } from "../interfaces/repositories/membershipCard.repository.interface";
import { BaseRepository } from "./base.repository";

export class MembershipCardRepository
  extends BaseRepository<MembershipCardModel, MembershipCard>
  implements IMembershipCardRepository
{
  constructor() {
    super(MembershipCardModel);
  }

  /**
   * Find membership card by customer ID
   * @param customerId Customer ID
   * @returns Promise resolving to membership card or null if not found
   */
  async findByCustomerId(customerId: string): Promise<MembershipCard | null> {
    const membershipCard = await this.model.findOne({
      where: { customer_id: customerId },
    });
    return membershipCard ? (membershipCard.toJSON() as MembershipCard) : null;
  }

  /**
   * Find membership card by card number
   * @param cardNumber Card number
   * @returns Promise resolving to membership card or null if not found
   */
  async findByCardNumber(cardNumber: string): Promise<MembershipCard | null> {
    const membershipCard = await this.model.findOne({
      where: { card_number: cardNumber },
    });
    return membershipCard ? (membershipCard.toJSON() as MembershipCard) : null;
  }

  /**
   * Find active cards
   * @param options Optional query options
   * @returns Promise resolving to array of active membership cards
   */
  async findAllActive(options?: any): Promise<MembershipCard[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        is_active: true,
      },
    };

    const membershipCards = await this.model.findAll(queryOptions);
    return membershipCards.map(
      (membershipCard) => membershipCard.toJSON() as MembershipCard
    );
  }

  /**
   * Find inactive membership cards
   * @param options Optional query options
   * @returns Promise resolving to array of inactive membership cards
   */
  async findInactive(options?: any): Promise<MembershipCard[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        is_active: false,
      },
    };

    const membershipCards = await this.model.findAll(queryOptions);
    return membershipCards.map(
      (membershipCard) => membershipCard.toJSON() as MembershipCard
    );
  }

  /**
   * Find membership cards by issue date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of membership cards
   */
  async findByIssueDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<MembershipCard[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        issue_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    };

    const membershipCards = await this.model.findAll(queryOptions);
    return membershipCards.map(
      (membershipCard) => membershipCard.toJSON() as MembershipCard
    );
  }

  /**
   * Activate a membership card
   * @param id Membership card ID
   * @param activationDate Date of activation (defaults to current date)
   * @returns Promise resolving to updated membership card or null if not found
   */
  async activate(
    id: string,
    activationDate?: Date
  ): Promise<MembershipCard | null> {
    const membershipCard = await this.model.findByPk(id);
    if (!membershipCard) {
      return null;
    }

    membershipCard.is_active = true;
    await membershipCard.save();

    return membershipCard.toJSON() as MembershipCard;
  }

  /**
   * Deactivate a membership card
   * @param id Membership card ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  async deactivate(id: string): Promise<MembershipCard | null> {
    const membershipCard = await this.model.findByPk(id);
    if (!membershipCard) {
      return null;
    }

    membershipCard.is_active = false;
    await membershipCard.save();

    return membershipCard.toJSON() as MembershipCard;
  }

  /**
   * Generate a unique card number
   * @returns Promise resolving to unique card number
   */
  async generateUniqueCardNumber(): Promise<string> {
    // Generate a random 16-digit card number
    const generateNumber = (): string => {
      const prefix = "TKO";
      const randomDigits = Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, "0");
      return `${prefix}${randomDigits}`;
    };

    // Check if the generated number is unique
    let isUnique = false;
    let cardNumber = "";

    while (!isUnique) {
      cardNumber = generateNumber();
      const existingCard = await this.findByCardNumber(cardNumber);
      isUnique = !existingCard;
    }

    return cardNumber;
  }

  /**
   * Find membership cards by NFC ID
   * @param nfcId NFC ID
   * @returns Promise resolving to membership card or null if not found
   */
  async findByNfcId(nfcId: string): Promise<MembershipCard | null> {
    const membershipCard = await this.model.findOne({
      where: { nfc_id: nfcId },
    });
    return membershipCard ? (membershipCard.toJSON() as MembershipCard) : null;
  }

  /**
   * Update NFC ID for a membership card
   * @param id Membership card ID
   * @param nfcId NFC ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  async updateNfcId(id: string, nfcId: string): Promise<MembershipCard | null> {
    const membershipCard = await this.model.findByPk(id);
    if (!membershipCard) {
      return null;
    }

    membershipCard.nfc_id = nfcId;
    await membershipCard.save();

    return membershipCard.toJSON() as MembershipCard;
  }

  /**
   * Update card tier
   * @param id Membership card ID
   * @param tierId New tier ID
   * @returns Promise resolving to updated membership card or null if not found
   */
  async updateTier(id: string, tierId: string): Promise<MembershipCard | null> {
    const membershipCard = await this.model.findByPk(id);
    if (!membershipCard) {
      return null;
    }

    membershipCard.tier_id = tierId;
    await membershipCard.save();

    return membershipCard.toJSON() as MembershipCard;
  }

  /**
   * Find cards by tier ID
   * @param tierId Tier ID
   * @param options Optional query options
   * @returns Promise resolving to array of membership cards
   */
  async findByTierId(tierId: string, options?: any): Promise<MembershipCard[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        tier_id: tierId,
      },
    };

    const membershipCards = await this.model.findAll(queryOptions);
    return membershipCards.map(
      (membershipCard) => membershipCard.toJSON() as MembershipCard
    );
  }
}
