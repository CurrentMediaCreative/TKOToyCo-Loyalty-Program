/**
 * Membership Card controller implementation
 *
 * Handles membership card-related API endpoints.
 */

import { Request, Response, NextFunction } from "express";
import { IMembershipCardController } from "../interfaces/controllers/membershipCard.controller.interface";
import { IMembershipCardRepository } from "../interfaces/repositories/membershipCard.repository.interface";
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import { ITierRepository } from "../interfaces/repositories/tier.repository.interface";
import { IMembershipCardService } from "../interfaces/services/membershipCard.service.interface";
import { BaseController } from "./base.controller";
import {
  MembershipCard,
  CreateMembershipCardDto,
  CardActivityType,
} from "../interfaces/models/membershipCard.interface";
import { ValidationError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export class MembershipCardController
  extends BaseController<MembershipCard>
  implements IMembershipCardController
{
  private customerRepository: ICustomerRepository;
  private tierRepository: ITierRepository;
  private membershipCardService: IMembershipCardService;

  constructor(
    membershipCardRepository: IMembershipCardRepository,
    customerRepository: ICustomerRepository,
    tierRepository: ITierRepository,
    membershipCardService: IMembershipCardService
  ) {
    super(membershipCardRepository, "MembershipCard");
    this.customerRepository = customerRepository;
    this.tierRepository = tierRepository;
    this.membershipCardService = membershipCardService;
  }

  /**
   * Get cards by customer
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const customerId = req.params.customerId;

      if (!customerId) {
        throw new ValidationError("Customer ID is required");
      }

      // Check if customer exists
      const customer = await this.customerRepository.findById(customerId);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Get membership card by customer ID
      const membershipCard =
        await this.membershipCardService.getMembershipCardByCustomerId(
          customerId
        );

      if (!membershipCard) {
        res.status(404).json({
          status: "error",
          message: "No membership card found for this customer",
        });
        return;
      }

      // Get tier information
      const tier = await this.tierRepository.findById(membershipCard.tier_id);

      res.status(200).json({
        status: "success",
        data: {
          ...membershipCard,
          tier_name: tier ? tier.name : null,
          customer_name: customer.first_name + " " + customer.last_name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get card by number
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByNumber(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const cardNumber = req.params.cardNumber;

      if (!cardNumber) {
        throw new ValidationError("Card number is required");
      }

      // Get membership card by card number
      const membershipCard =
        await this.membershipCardService.getMembershipCardByCardNumber(
          cardNumber
        );

      if (!membershipCard) {
        res.status(404).json({
          status: "error",
          message: "Membership card not found",
        });
        return;
      }

      // Get customer information
      const customer = await this.customerRepository.findById(
        membershipCard.customer_id
      );

      // Get tier information
      const tier = await this.tierRepository.findById(membershipCard.tier_id);

      res.status(200).json({
        status: "success",
        data: {
          ...membershipCard,
          tier_name: tier ? tier.name : null,
          customer_name: customer
            ? customer.first_name + " " + customer.last_name
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get card by status
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = req.params.status;

      if (!status) {
        throw new ValidationError("Status is required");
      }

      // Validate status
      if (!["active", "inactive"].includes(status)) {
        throw new ValidationError("Invalid status. Use 'active' or 'inactive'");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get membership cards by status
      let membershipCards: MembershipCard[] = [];

      if (status === "active") {
        membershipCards =
          await this.membershipCardService.getActiveMembershipCards({
            limit,
            offset,
          });
      } else {
        // For inactive, we need to get all and filter
        const allCards =
          await this.membershipCardService.getAllMembershipCards();
        const inactiveCards = allCards.filter((card) => !card.is_active);
        membershipCards = inactiveCards.slice(offset, offset + limit);
      }

      // Get total count
      let count = 0;
      if (status === "active") {
        const allActiveCards =
          await this.membershipCardService.getActiveMembershipCards();
        count = allActiveCards.length;
      } else {
        const allCards =
          await this.membershipCardService.getAllMembershipCards();
        count = allCards.filter((card) => !card.is_active).length;
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: membershipCards,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate card
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async activateCard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { card_number, customer_id } = req.body;

      if (!card_number) {
        throw new ValidationError("Card number is required");
      }

      if (!customer_id) {
        throw new ValidationError("Customer ID is required");
      }

      // Check if customer exists
      const customer = await this.customerRepository.findById(customer_id);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Get membership card by card number
      const membershipCard =
        await this.membershipCardService.getMembershipCardByCardNumber(
          card_number
        );

      if (!membershipCard) {
        throw new NotFoundError("Membership card not found");
      }

      // Check if card is already active
      if (membershipCard.is_active) {
        throw new ValidationError("Card is already active");
      }

      // Check if card belongs to the customer
      if (membershipCard.customer_id !== customer_id) {
        throw new ValidationError(
          "Card does not belong to the specified customer"
        );
      }

      // Activate the card
      const activatedCard =
        await this.membershipCardService.activateMembershipCard(
          membershipCard.id
        );

      res.status(200).json({
        status: "success",
        data: activatedCard,
        message: "Card activated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate card
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async deactivateCard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { card_number, reason } = req.body;

      if (!card_number) {
        throw new ValidationError("Card number is required");
      }

      // Get membership card by card number
      const membershipCard =
        await this.membershipCardService.getMembershipCardByCardNumber(
          card_number
        );

      if (!membershipCard) {
        throw new NotFoundError("Membership card not found");
      }

      // Check if card is already inactive
      if (!membershipCard.is_active) {
        throw new ValidationError("Card is already inactive");
      }

      // Deactivate the card
      const deactivatedCard =
        await this.membershipCardService.deactivateMembershipCard(
          membershipCard.id
        );

      // Log the reason if provided
      if (reason) {
        logger.info(`Card ${card_number} deactivated. Reason: ${reason}`, {
          card_id: membershipCard.id,
          activity_type: CardActivityType.DEACTIVATED,
          details: reason,
        });
      }

      res.status(200).json({
        status: "success",
        data: deactivatedCard,
        message: "Card deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Replace card
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async replaceCard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { old_card_number, new_card_number, new_nfc_id, reason } = req.body;

      if (!old_card_number) {
        throw new ValidationError("Old card number is required");
      }

      if (!new_card_number) {
        throw new ValidationError("New card number is required");
      }

      // Get old membership card
      const oldCard =
        await this.membershipCardService.getMembershipCardByCardNumber(
          old_card_number
        );

      if (!oldCard) {
        throw new NotFoundError("Old membership card not found");
      }

      // Check if new card number already exists
      const existingCard =
        await this.membershipCardService.getMembershipCardByCardNumber(
          new_card_number
        );

      if (existingCard) {
        throw new ValidationError("New card number already exists");
      }

      // Deactivate old card
      await this.membershipCardService.deactivateMembershipCard(oldCard.id);

      // Create new card with same customer and tier
      const newCard = await this.membershipCardService.createMembershipCard({
        customer_id: oldCard.customer_id,
        tier_id: oldCard.tier_id,
        card_number: new_card_number,
        nfc_id: new_nfc_id || null,
        is_active: true,
        activation_date: new Date(),
      } as CreateMembershipCardDto);

      // Log the replacement
      logger.info(
        `Card ${old_card_number} replaced with ${new_card_number}. Reason: ${
          reason || "Not specified"
        }`,
        {
          old_card_id: oldCard.id,
          new_card_id: newCard.id,
          activity_type: CardActivityType.REPLACED,
          details: reason,
        }
      );

      res.status(200).json({
        status: "success",
        data: {
          old_card: oldCard,
          new_card: newCard,
        },
        message: "Card replaced successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Link card to customer
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async linkToCustomer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { card_number, customer_id, tier_id } = req.body;

      if (!card_number) {
        throw new ValidationError("Card number is required");
      }

      if (!customer_id) {
        throw new ValidationError("Customer ID is required");
      }

      if (!tier_id) {
        throw new ValidationError("Tier ID is required");
      }

      // Check if customer exists
      const customer = await this.customerRepository.findById(customer_id);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Check if tier exists
      const tier = await this.tierRepository.findById(tier_id);

      if (!tier) {
        throw new NotFoundError("Tier not found");
      }

      // Check if card number already exists
      const existingCard =
        await this.membershipCardService.getMembershipCardByCardNumber(
          card_number
        );

      if (existingCard) {
        throw new ValidationError("Card number already exists");
      }

      // Check if customer already has a card
      const existingCustomerCard =
        await this.membershipCardService.getMembershipCardByCustomerId(
          customer_id
        );

      if (existingCustomerCard) {
        throw new ValidationError("Customer already has a membership card");
      }

      // Create new card
      const newCard = await this.membershipCardService.createMembershipCard({
        customer_id,
        tier_id,
        card_number,
        is_active: true,
        activation_date: new Date(),
      } as CreateMembershipCardDto);

      res.status(201).json({
        status: "success",
        data: newCard,
        message: "Card linked to customer successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate create data
   * @param data Data to validate
   */
  protected validateCreate(data: any): void {
    super.validateCreate(data);

    const { customer_id, card_number, tier_id } = data;

    if (!customer_id) {
      throw new ValidationError("Customer ID is required");
    }

    if (!card_number) {
      throw new ValidationError("Card number is required");
    }

    if (!tier_id) {
      throw new ValidationError("Tier ID is required");
    }
  }

  /**
   * Validate update data
   * @param data Data to validate
   */
  protected validateUpdate(data: any): void {
    super.validateUpdate(data);

    // No additional validation needed for updates
  }
}
