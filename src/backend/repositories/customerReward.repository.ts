/**
 * Customer Reward repository implementation
 *
 * Implements operations specific to customer reward entities
 */

import { Op } from "sequelize";
import { CustomerReward as CustomerRewardModel } from "../models/customerReward.model";
import { CustomerReward } from "../interfaces/models/customerReward.interface";
import { ICustomerRewardRepository } from "../interfaces/repositories/customerReward.repository.interface";
import { BaseRepository } from "./base.repository";

export class CustomerRewardRepository
  extends BaseRepository<CustomerRewardModel, CustomerReward>
  implements ICustomerRewardRepository
{
  constructor() {
    super(CustomerRewardModel);
  }

  /**
   * Find customer rewards by customer ID
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async findByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        customer_id: customerId,
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Find customer rewards by reward ID
   * @param rewardId Reward ID
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async findByRewardId(
    rewardId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        reward_id: rewardId,
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Find customer rewards by redemption status
   * @param isRedeemed Whether the reward is redeemed
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async findByStatus(
    isRedeemed: boolean,
    options?: any
  ): Promise<CustomerReward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        is_redeemed: isRedeemed,
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Find customer rewards by date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<CustomerReward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Find customer rewards by expiration date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Optional query options
   * @returns Promise resolving to array of customer rewards
   */
  async findByExpirationDateRange(
    startDate: Date,
    endDate: Date,
    options?: any
  ): Promise<CustomerReward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        expiry_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Find active (non-expired, non-redeemed) rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of active customer rewards
   */
  async findActiveByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    const now = new Date();

    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        customer_id: customerId,
        is_redeemed: false,
        expiry_date: {
          [Op.or]: [{ [Op.gt]: now }, { [Op.eq]: null }],
        },
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Find redeemed rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of redeemed customer rewards
   */
  async findRedeemedByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        customer_id: customerId,
        is_redeemed: true,
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Find expired rewards for a customer
   * @param customerId Customer ID
   * @param options Optional query options
   * @returns Promise resolving to array of expired customer rewards
   */
  async findExpiredByCustomerId(
    customerId: string,
    options?: any
  ): Promise<CustomerReward[]> {
    const now = new Date();

    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        customer_id: customerId,
        is_redeemed: false,
        expiry_date: {
          [Op.ne]: null,
          [Op.lt]: now,
        },
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }

  /**
   * Mark a customer reward as redeemed
   * @param id Customer reward ID
   * @param redeemedDate Date of redemption (defaults to current date)
   * @returns Promise resolving to updated customer reward or null if not found
   */
  async markAsRedeemed(
    id: string,
    redeemedDate?: Date
  ): Promise<CustomerReward | null> {
    const customerReward = await this.model.findByPk(id);
    if (!customerReward) {
      return null;
    }

    customerReward.is_redeemed = true;
    customerReward.redeemed_date = redeemedDate || new Date();
    await customerReward.save();

    return customerReward.toJSON() as CustomerReward;
  }

  /**
   * Find rewards expiring soon for a customer
   * @param customerId Customer ID
   * @param daysThreshold Number of days to consider "soon" (default: 30)
   * @param options Optional query options
   * @returns Promise resolving to array of soon-to-expire customer rewards
   */
  async findExpiringSoon(
    customerId: string,
    daysThreshold: number = 30,
    options?: any
  ): Promise<CustomerReward[]> {
    const now = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(now.getDate() + daysThreshold);

    const queryOptions = {
      ...options,
      where: {
        ...(options?.where || {}),
        customer_id: customerId,
        is_redeemed: false,
        expiry_date: {
          [Op.ne]: null,
          [Op.between]: [now, expirationDate],
        },
      },
    };

    const customerRewards = await this.model.findAll(queryOptions);
    return customerRewards.map(
      (customerReward) => customerReward.toJSON() as CustomerReward
    );
  }
}
