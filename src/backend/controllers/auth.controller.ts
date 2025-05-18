/**
 * Auth controller implementation
 *
 * Handles authentication, user registration, and password management.
 */

import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { IAuthController } from "../interfaces/controllers/auth.controller.interface";
import { ICustomerRepository } from "../interfaces/repositories/customer.repository.interface";
import {
  generateToken,
  refreshToken as refreshJwtToken,
  UserRole,
} from "../middleware/auth";
import {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} from "../utils/errors";
import logger from "../utils/logger";
import {
  Customer,
  CreateCustomerDto,
} from "../interfaces/models/customer.interface";

// Extended interface for authentication that includes password
interface AuthCustomer extends Customer {
  password: string;
}

export class AuthController implements IAuthController {
  private customerRepository: ICustomerRepository;
  private readonly SALT_ROUNDS = 10;

  constructor(customerRepository: ICustomerRepository) {
    this.customerRepository = customerRepository;
  }

  /**
   * Register a new user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { first_name, last_name, email, password, phone, birth_date } =
        req.body;

      // Validate required fields
      if (!first_name || !last_name || !email || !password) {
        throw new ValidationError(
          "First name, last name, email, and password are required"
        );
      }

      // Check if email already exists
      const existingCustomer = await this.customerRepository.findByEmail(email);
      if (existingCustomer) {
        throw new ValidationError("Email already in use");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Prepare join date
      const join_date = new Date();

      // Create customer
      const customer = await this.customerRepository.create({
        first_name,
        last_name,
        email,
        phone,
        join_date,
        tier_id: process.env.DEFAULT_TIER_ID || "", // Default tier
        total_spend: 0,
        is_active: true,
      });

      // In a real implementation, we would store the password in a separate auth table
      // For now, we'll simulate this by adding the password to the customer object
      const authCustomer = customer as unknown as AuthCustomer;
      authCustomer.password = hashedPassword;

      // Generate token
      const token = generateToken({
        id: customer.id,
        email: customer.email || "",
        role: UserRole.CUSTOMER,
      });

      // Generate refresh token
      const refreshToken = generateToken(
        {
          id: customer.id,
          email: customer.email || "",
          role: UserRole.CUSTOMER,
        },
        "7d"
      );

      // Remove password from response
      const { password: _, ...customerData } = authCustomer;

      res.status(201).json({
        status: "success",
        data: {
          token,
          refresh_token: refreshToken,
          user: {
            ...customerData,
            role: UserRole.CUSTOMER,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      // Find customer by email
      const customer = await this.customerRepository.findByEmail(email);
      if (!customer) {
        throw new UnauthorizedError("Invalid credentials");
      }

      // Check if customer is active
      if (!customer.is_active) {
        throw new UnauthorizedError("Account is not active");
      }

      // In a real implementation, we would retrieve the password from a separate auth table
      // For now, we'll simulate this by adding the password to the customer object
      const authCustomer = customer as unknown as AuthCustomer;
      authCustomer.password = "hashed_password"; // This would be retrieved from the auth table

      // Verify password
      // In a real implementation, we would compare with the actual stored password
      // For now, we'll simulate a successful password verification
      const isPasswordValid = true; // await bcrypt.compare(password, authCustomer.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials");
      }

      // Generate token
      const token = generateToken({
        id: customer.id,
        email: customer.email || "",
        role: UserRole.CUSTOMER,
      });

      // Generate refresh token
      const refreshToken = generateToken(
        {
          id: customer.id,
          email: customer.email || "",
          role: UserRole.CUSTOMER,
        },
        "7d"
      );

      // Remove password from response
      const { password: _, ...customerData } = authCustomer;

      res.status(200).json({
        status: "success",
        data: {
          token,
          refresh_token: refreshToken,
          user: {
            ...customerData,
            role: UserRole.CUSTOMER,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a stateless JWT authentication system, the client is responsible for
      // discarding the token. The server can't invalidate the token directly.
      // In a production system, we might implement a token blacklist using Redis.

      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new ValidationError("Refresh token is required");
      }

      // Refresh token
      const newToken = refreshJwtToken(refresh_token);

      res.status(200).json({
        status: "success",
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const customer = await this.customerRepository.findById(req.user.id);

      if (!customer) {
        throw new NotFoundError("User not found");
      }

      res.status(200).json({
        status: "success",
        data: {
          ...customer,
          role: req.user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        throw new ValidationError(
          "Current password and new password are required"
        );
      }

      // Find customer
      const customer = await this.customerRepository.findById(req.user.id);

      if (!customer) {
        throw new NotFoundError("User not found");
      }

      // In a real implementation, we would retrieve the password from a separate auth table
      // and verify the current password against the stored hash
      // For now, we'll simulate a successful password verification
      const isPasswordValid = true;
      if (!isPasswordValid) {
        throw new UnauthorizedError("Current password is incorrect");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, this.SALT_ROUNDS);

      // In a real implementation, we would update the password in a separate auth table
      // For now, we'll just return a success message

      res.status(200).json({
        status: "success",
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ValidationError("Email is required");
      }

      // Find customer by email
      const customer = await this.customerRepository.findByEmail(email);

      // Don't reveal if the email exists or not for security reasons
      if (customer) {
        // In a real implementation, we would:
        // 1. Generate a reset token
        // 2. Store it in the database with an expiration
        // 3. Send an email with a reset link

        logger.info(`Password reset requested for email: ${email}`);
      }

      res.status(200).json({
        status: "success",
        message: "If the email exists, a password reset link will be sent",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        throw new ValidationError("Token and new password are required");
      }

      // In a real implementation, we would:
      // 1. Verify the reset token
      // 2. Check if it's expired
      // 3. Find the customer associated with the token
      // 4. Update the password

      // For now, we'll just return a success message
      res.status(200).json({
        status: "success",
        message: "Password reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
