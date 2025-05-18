/**
 * Authentication middleware
 *
 * Provides JWT authentication and role-based access control.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import logger from "../utils/logger";

// Define user roles
export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
  CUSTOMER = "customer",
}

// Define JWT payload interface
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authenticate user using JWT
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("No authentication token provided");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new UnauthorizedError("No authentication token provided");
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "";

    if (!secret) {
      logger.error("JWT_SECRET not defined in environment variables");
      throw new Error("Internal server error");
    }

    // Decode token and set user in request
    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        next(new UnauthorizedError("Invalid authentication token"));
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        next(new UnauthorizedError("Authentication token expired"));
      } else {
        next(jwtError);
      }
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Authorize user based on roles
 * @param roles Allowed roles
 * @returns Express middleware function
 */
export function authorize(
  roles: UserRole[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not authenticated");
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError("User not authorized for this action");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Generate JWT token
 * @param payload Token payload
 * @param expiresIn Token expiration time
 * @returns JWT token
 */
export function generateToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresIn = "1d"
): string {
  const secret = process.env.JWT_SECRET || "";

  if (!secret) {
    logger.error("JWT_SECRET not defined in environment variables");
    throw new Error("Internal server error");
  }

  // Using any to bypass TypeScript errors with jsonwebtoken
  return jwt.sign(payload as any, secret, { expiresIn } as any);
}

/**
 * Refresh JWT token
 * @param token Existing token
 * @param expiresIn New token expiration time
 * @returns New JWT token
 */
export function refreshToken(token: string, expiresIn = "1d"): string {
  const secret = process.env.JWT_SECRET || "";

  if (!secret) {
    logger.error("JWT_SECRET not defined in environment variables");
    throw new Error("Internal server error");
  }

  // Verify existing token
  const decoded = jwt.verify(token, secret) as JwtPayload;

  // Create new token with same payload but new expiration
  const { iat, exp, ...payload } = decoded;

  // Using any to bypass TypeScript errors with jsonwebtoken
  return jwt.sign(payload as any, secret, { expiresIn } as any);
}
