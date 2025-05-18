/**
 * Transaction controller implementation
 *
 * Handles transaction-related API endpoints.
 */

import { Request, Response, NextFunction } from "express";
import { ITransactionController } from "../interfaces/controllers/transaction.controller.interface";
import { ITransactionRepository } from "../interfaces/repositories/transaction.repository.interface";
import { ITransactionItemRepository } from "../interfaces/repositories/transactionItem.repository.interface";
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import { ITransactionService } from "../interfaces/services/transaction.service.interface";
import { ITransactionItemService } from "../interfaces/services/transactionItem.service.interface";
import { BaseController } from "./base.controller";
import {
  Transaction,
  TransactionStatus,
  TransactionSource,
  CreateTransactionDto,
  TransactionItemDto,
} from "../interfaces/models/transaction.interface";
import { ValidationError, NotFoundError } from "../utils/errors";
import logger from "../utils/logger";

export class TransactionController
  extends BaseController<Transaction>
  implements ITransactionController
{
  private transactionItemRepository: ITransactionItemRepository;
  private customerRepository: ICustomerRepository;
  private transactionService: ITransactionService;
  private transactionItemService: ITransactionItemService;

  constructor(
    transactionRepository: ITransactionRepository,
    transactionItemRepository: ITransactionItemRepository,
    customerRepository: ICustomerRepository,
    transactionService: ITransactionService,
    transactionItemService: ITransactionItemService
  ) {
    super(transactionRepository, "Transaction");
    this.transactionItemRepository = transactionItemRepository;
    this.customerRepository = customerRepository;
    this.transactionService = transactionService;
    this.transactionItemService = transactionItemService;
  }

  /**
   * Get transactions by customer
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

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get transactions by customer
      const transactions = await this.transactionService.findByCustomerId(
        customerId,
        {
          limit,
          offset,
        }
      );

      // Get total count
      const allTransactions = await this.transactionService.findByCustomerId(
        customerId
      );
      const count = allTransactions.length;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: transactions,
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
   * Get transactions by date range
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getByDateRange(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError("Start date and end date are required");
      }

      // Parse dates
      const parsedStartDate = new Date(startDate as string);
      const parsedEndDate = new Date(endDate as string);

      // Validate dates
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        throw new ValidationError("Invalid date format");
      }

      if (parsedStartDate > parsedEndDate) {
        throw new ValidationError("Start date must be before end date");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get transactions by date range
      const transactions = await this.transactionService.findByDateRange(
        parsedStartDate,
        parsedEndDate,
        {
          limit,
          offset,
        }
      );

      // Get total count
      const allTransactions = await this.transactionService.findByDateRange(
        parsedStartDate,
        parsedEndDate
      );
      const count = allTransactions.length;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: transactions,
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
   * Get transactions by status
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
      if (
        !Object.values(TransactionStatus).includes(status as TransactionStatus)
      ) {
        throw new ValidationError("Invalid transaction status");
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get transactions by status
      const transactions = await this.transactionService.findByStatus(
        status as TransactionStatus,
        {
          limit,
          offset,
        }
      );

      // Get total count
      const allTransactions = await this.transactionService.findByStatus(
        status as TransactionStatus
      );
      const count = allTransactions.length;

      // Calculate pagination metadata
      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        status: "success",
        data: transactions,
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
   * Get transaction items
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getItems(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const transactionId = req.params.id;

      if (!transactionId) {
        throw new ValidationError("Transaction ID is required");
      }

      // Check if transaction exists
      const transaction = await this.repository.findById(transactionId);

      if (!transaction) {
        throw new NotFoundError("Transaction not found");
      }

      // Get transaction items
      const items = await this.transactionItemService.findByTransactionId(
        transactionId
      );

      res.status(200).json({
        status: "success",
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process transaction
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async processTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        customer_id,
        amount,
        source,
        reference_id,
        transaction_date,
        items,
      } = req.body;

      // Validate required fields
      if (!customer_id) {
        throw new ValidationError("Customer ID is required");
      }

      if (!amount) {
        throw new ValidationError("Amount is required");
      }

      if (!source) {
        throw new ValidationError("Source is required");
      }

      if (!Object.values(TransactionSource).includes(source)) {
        throw new ValidationError("Invalid transaction source");
      }

      if (!reference_id) {
        throw new ValidationError("Reference ID is required");
      }

      // Check if customer exists
      const customer = await this.customerRepository.findById(customer_id);

      if (!customer) {
        throw new NotFoundError("Customer not found");
      }

      // Check if transaction with reference ID already exists
      const existingTransaction = await (
        this.repository as ITransactionRepository
      ).findByReferenceId(reference_id);

      if (existingTransaction) {
        throw new ValidationError(
          "Transaction with this reference ID already exists"
        );
      }

      // Create transaction
      const transaction = await this.repository.create({
        customer_id,
        amount,
        source,
        reference_id,
        status: TransactionStatus.COMPLETED,
        transaction_date: transaction_date
          ? new Date(transaction_date)
          : new Date(),
      } as CreateTransactionDto);

      // Create transaction items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await this.transactionItemRepository.create({
            transaction_id: transaction.id,
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          });
        }
      }

      // Get transaction with items
      const transactionWithItems = await this.repository.findById(
        transaction.id
      );
      const transactionItems =
        await this.transactionItemService.findByTransactionId(transaction.id);

      res.status(201).json({
        status: "success",
        data: {
          ...transactionWithItems,
          items: transactionItems,
        },
        message: "Transaction processed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel transaction
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async cancelTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        throw new ValidationError("Transaction ID is required");
      }

      // Check if transaction exists
      const transaction = await this.repository.findById(id);

      if (!transaction) {
        throw new NotFoundError("Transaction not found");
      }

      // Check if transaction can be cancelled
      if (
        transaction.status === TransactionStatus.CANCELLED ||
        transaction.status === TransactionStatus.REFUNDED
      ) {
        throw new ValidationError(
          "Transaction has already been cancelled or refunded"
        );
      }

      // Update transaction status
      const updatedTransaction = await (
        this.repository as ITransactionRepository
      ).updateStatus(id, TransactionStatus.CANCELLED);

      res.status(200).json({
        status: "success",
        data: updatedTransaction,
        message: "Transaction cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction summary
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getSummary(
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

      // Get total spend
      const totalSpend = await this.transactionService.calculateTotalSpend(
        customerId
      );

      // Get transaction count
      const transactions = await this.transactionService.findByCustomerId(
        customerId
      );
      const transactionCount = transactions.length;

      // Get most recent transaction
      const recentTransactions = await this.transactionService.findByCustomerId(
        customerId,
        {
          limit: 1,
          order: [["transaction_date", "DESC"]],
        }
      );
      const mostRecentTransaction =
        recentTransactions.length > 0 ? recentTransactions[0] : null;

      // Get popular products for this customer
      const popularProducts =
        await this.transactionItemService.getPopularProducts(5);

      res.status(200).json({
        status: "success",
        data: {
          customer_id: customerId,
          total_spend: totalSpend,
          transaction_count: transactionCount,
          most_recent_transaction: mostRecentTransaction,
          popular_products: popularProducts,
        },
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

    const { customer_id, amount, source, reference_id } = data;

    if (!customer_id) {
      throw new ValidationError("Customer ID is required");
    }

    if (!amount) {
      throw new ValidationError("Amount is required");
    }

    if (!source) {
      throw new ValidationError("Source is required");
    }

    if (!Object.values(TransactionSource).includes(source)) {
      throw new ValidationError("Invalid transaction source");
    }

    if (!reference_id) {
      throw new ValidationError("Reference ID is required");
    }
  }

  /**
   * Validate update data
   * @param data Data to validate
   */
  protected validateUpdate(data: any): void {
    super.validateUpdate(data);

    const { status } = data;

    if (status && !Object.values(TransactionStatus).includes(status)) {
      throw new ValidationError("Invalid transaction status");
    }
  }
}
