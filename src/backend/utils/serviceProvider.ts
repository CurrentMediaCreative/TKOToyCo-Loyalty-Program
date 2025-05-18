/**
 * Service Provider
 *
 * Registers all repositories, services, and controllers with the dependency injection container.
 */

import container, { ServiceLifetime } from "./container";

// Controllers
import { IAuthController } from "../interfaces/controllers/auth.controller.interface";
import { ICustomerController } from "../interfaces/controllers/customer.controller.interface";
import { ITierController } from "../interfaces/controllers/tier.controller.interface";
import { IRewardController } from "../interfaces/controllers/reward.controller.interface";
import { ITransactionController } from "../interfaces/controllers/transaction.controller.interface";
import { IMembershipCardController } from "../interfaces/controllers/membershipCard.controller.interface";

import { AuthController } from "../controllers/auth.controller";
import { CustomerController } from "../controllers/customer.controller";
import { TierController } from "../controllers/tier.controller";
import { RewardController } from "../controllers/reward.controller";
import { TransactionController } from "../controllers/transaction.controller";
import { MembershipCardController } from "../controllers/membershipCard.controller";

// Repositories
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import { ITierRepository } from "../interfaces/repositories/tier.repository.interface";
import { ITierBenefitRepository } from "../interfaces/repositories/tierBenefit.repository.interface";
import { ITransactionRepository } from "../interfaces/repositories/transaction.repository.interface";
import { ITransactionItemRepository } from "../interfaces/repositories/transactionItem.repository.interface";
import { IRewardRepository } from "../interfaces/repositories/reward.repository.interface";
import { ICustomerRewardRepository } from "../interfaces/repositories/customerReward.repository.interface";
import { IMembershipCardRepository } from "../interfaces/repositories/membershipCard.repository.interface";

import { CustomerRepository } from "../repositories/customer.repository";
import { TierRepository } from "../repositories/tier.repository";
import { TierBenefitRepository } from "../repositories/tierBenefit.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { TransactionItemRepository } from "../repositories/transactionItem.repository";
import { RewardRepository } from "../repositories/reward.repository";
import { CustomerRewardRepository } from "../repositories/customerReward.repository";
import { MembershipCardRepository } from "../repositories/membershipCard.repository";

// Services
import { ITransactionService } from "../interfaces/services/transaction.service.interface";
import { ITransactionItemService } from "../interfaces/services/transactionItem.service.interface";
import { IRewardService } from "../interfaces/services/reward.service.interface";
import { ICustomerRewardService } from "../interfaces/services/customerReward.service.interface";
import { IMembershipCardService } from "../interfaces/services/membershipCard.service.interface";

import { TransactionService } from "../services/adapters/transaction.service";
import { TransactionItemService } from "../services/adapters/transactionItem.service";
import { RewardService } from "../services/adapters/reward.service";
import { CustomerRewardService } from "../services/adapters/customerReward.service";
import { MembershipCardService } from "../services/adapters/membershipCard.service";

/**
 * Register all repositories, services, and controllers with the container
 */
export function registerAll(): void {
  // Register repositories
  registerRepositories();

  // Register services
  registerAllServices();

  // Register controllers
  registerControllers();
}

/**
 * Register all repositories with the container
 */
function registerRepositories(): void {
  // Repositories are typically singletons
  container.register<ICustomerRepository>(
    "ICustomerRepository",
    CustomerRepository,
    ServiceLifetime.SINGLETON
  );

  container.register<ITierRepository>(
    "ITierRepository",
    TierRepository,
    ServiceLifetime.SINGLETON
  );

  container.register<ITierBenefitRepository>(
    "ITierBenefitRepository",
    TierBenefitRepository,
    ServiceLifetime.SINGLETON
  );

  container.register<ITransactionRepository>(
    "ITransactionRepository",
    TransactionRepository,
    ServiceLifetime.SINGLETON
  );

  container.register<ITransactionItemRepository>(
    "ITransactionItemRepository",
    TransactionItemRepository,
    ServiceLifetime.SINGLETON
  );

  container.register<IRewardRepository>(
    "IRewardRepository",
    RewardRepository,
    ServiceLifetime.SINGLETON
  );

  container.register<ICustomerRewardRepository>(
    "ICustomerRewardRepository",
    CustomerRewardRepository,
    ServiceLifetime.SINGLETON
  );

  container.register<IMembershipCardRepository>(
    "IMembershipCardRepository",
    MembershipCardRepository,
    ServiceLifetime.SINGLETON
  );
}

/**
 * Register all services with the container
 */
function registerAllServices(): void {
  // Services with dependencies on repositories
  container.register<ITransactionService>(
    "ITransactionService",
    TransactionService,
    ServiceLifetime.SINGLETON
  );

  container.register<ITransactionItemService>(
    "ITransactionItemService",
    TransactionItemService,
    ServiceLifetime.SINGLETON
  );

  container.register<IRewardService>(
    "IRewardService",
    RewardService,
    ServiceLifetime.SINGLETON
  );

  container.register<ICustomerRewardService>(
    "ICustomerRewardService",
    CustomerRewardService,
    ServiceLifetime.SINGLETON
  );

  container.register<IMembershipCardService>(
    "IMembershipCardService",
    MembershipCardService,
    ServiceLifetime.SINGLETON
  );
}

/**
 * Register all controllers with the container
 */
function registerControllers(): void {
  // Controllers with dependencies on services and repositories
  container.register<IAuthController>(
    "authController",
    AuthController,
    ServiceLifetime.SINGLETON
  );

  container.register<ICustomerController>(
    "customerController",
    CustomerController,
    ServiceLifetime.SINGLETON
  );

  container.register<ITierController>(
    "tierController",
    TierController,
    ServiceLifetime.SINGLETON
  );

  container.register<IRewardController>(
    "rewardController",
    RewardController,
    ServiceLifetime.SINGLETON
  );

  container.register<ITransactionController>(
    "transactionController",
    TransactionController,
    ServiceLifetime.SINGLETON
  );

  container.register<IMembershipCardController>(
    "membershipCardController",
    MembershipCardController,
    ServiceLifetime.SINGLETON
  );
}

/**
 * Get a service from the container
 * @param token The token to resolve
 * @returns The resolved service instance
 */
export function getService<T>(token: string): T {
  return container.resolve<T>(token);
}
