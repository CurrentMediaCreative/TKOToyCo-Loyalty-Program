/**
 * Example usage of the integration service
 *
 * This file demonstrates how to use the integration service in a controller
 * or service to fetch customer data and total spend from external systems.
 */

import { Request, Response } from "express";
import { createIntegrationService } from "./integration.service";

/**
 * Example controller that uses the integration service
 */
export class CustomerLookupController {
  private integrationService;

  constructor() {
    // Initialize the integration service with configuration
    this.integrationService = createIntegrationService({
      shopify: {
        shopUrl: process.env.SHOPIFY_SHOP_URL || "",
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN || "",
      },
      binderPOS: {
        apiUrl: process.env.BINDERPOS_API_URL || "",
        apiKey: process.env.BINDERPOS_API_KEY || "",
        storeId: process.env.BINDERPOS_STORE_ID || "",
      },
    });
  }

  /**
   * Look up a customer by identifier (email or phone)
   * @param req Express request
   * @param res Express response
   */
  async lookupCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.params;

      if (!identifier) {
        res.status(400).json({
          success: false,
          message: "Customer identifier is required",
        });
        return;
      }

      // Find customer by identifier
      const customer = await this.integrationService.findCustomerByIdentifier(
        identifier
      );

      if (!customer) {
        res.status(404).json({
          success: false,
          message: "Customer not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error("Error looking up customer:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while looking up the customer",
      });
    }
  }

  /**
   * Test connections to external systems
   * @param req Express request
   * @param res Express response
   */
  async testConnections(req: Request, res: Response): Promise<void> {
    try {
      const results = await this.integrationService.testConnections();

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error("Error testing connections:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while testing connections",
      });
    }
  }
}

/**
 * Example route setup
 */
export const setupCustomerLookupRoutes = (app: any): void => {
  const controller = new CustomerLookupController();

  app.get(
    "/api/v1/customers/lookup/:identifier",
    controller.lookupCustomer.bind(controller)
  );

  app.get(
    "/api/v1/integrations/test",
    controller.testConnections.bind(controller)
  );
};

/**
 * Example environment variables needed for the integration service
 *
 * These should be set in your .env file or environment
 *
 * SHOPIFY_SHOP_URL=your-store.myshopify.com
 * SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
 * BINDERPOS_API_URL=https://api.binderpos.com/api/v2
 * BINDERPOS_API_KEY=your-binderpos-api-key
 * BINDERPOS_STORE_ID=your-binderpos-store-id
 */
