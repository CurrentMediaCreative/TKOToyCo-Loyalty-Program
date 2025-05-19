import axios from "axios";
import { Customer, Tier, Transaction, TierProgress } from "../models/Customer";
import { ICustomerService } from "./ICustomerService";

/**
 * ShopifyService
 *
 * Service for interacting with the Shopify API to retrieve customer data
 * and implement the ICustomerService interface.
 */
export class ShopifyService implements ICustomerService {
  private apiKey: string;
  private apiPassword: string;
  private shopName: string;
  private apiVersion: string;
  private baseUrl: string;
  private tiers: Tier[] = [];

  constructor() {
    // Use environment variables for API credentials
    this.apiKey = process.env.SHOPIFY_API_KEY || "YOUR_API_KEY";
    this.apiPassword = process.env.SHOPIFY_API_PASSWORD || "YOUR_API_PASSWORD"; // Using access token as password
    this.shopName = process.env.SHOPIFY_SHOP_NAME || "tkotoyco";
    this.apiVersion = process.env.SHOPIFY_API_VERSION || "2023-04"; // Use the specified API version

    // Construct the base URL for API requests using the access token directly
    this.baseUrl = `https://${this.shopName}.myshopify.com/admin/api/${this.apiVersion}`;

    // Set up axios defaults for authentication
    axios.defaults.headers.common["X-Shopify-Access-Token"] = this.apiPassword;

    // Initialize tiers
    this.initializeTiers();
  }

  /**
   * Initialize loyalty tiers based on the TKO Toy Co boxing weight class theme
   */
  private initializeTiers(): void {
    this.tiers = [
      {
        id: "1",
        name: "Featherweight",
        spendThreshold: 0, // $0-$1,499
        benefits: [
          {
            id: "1",
            tierId: "1",
            name: "5% Discount on All Purchases",
            description: "Receive a 5% discount on all purchases",
          },
        ],
      },
      {
        id: "2",
        name: "Lightweight",
        spendThreshold: 1500, // $1,500-$4,999
        benefits: [
          {
            id: "2",
            tierId: "2",
            name: "10% Discount on All Purchases",
            description: "Receive a 10% discount on all purchases",
          },
          {
            id: "3",
            tierId: "2",
            name: "Free Shipping on Orders Over $50",
            description: "Get free shipping on any order over $50",
          },
        ],
      },
      {
        id: "3",
        name: "Welterweight",
        spendThreshold: 5000, // $5,000-$24,999
        benefits: [
          {
            id: "4",
            tierId: "3",
            name: "10% Discount on All Purchases",
            description: "Receive a 10% discount on all purchases",
          },
          {
            id: "5",
            tierId: "3",
            name: "Free Shipping on Orders Over $50",
            description: "Get free shipping on any order over $50",
          },
          {
            id: "6",
            tierId: "3",
            name: "Exclusive Access to Pre-releases",
            description: "Get early access to new product releases",
          },
        ],
      },
      {
        id: "4",
        name: "Heavyweight",
        spendThreshold: 25000, // $25,000+
        benefits: [
          {
            id: "7",
            tierId: "4",
            name: "15% Discount on All Purchases",
            description: "Receive a 15% discount on all purchases",
          },
          {
            id: "8",
            tierId: "4",
            name: "Free Shipping on All Orders",
            description: "Get free shipping on any order",
          },
          {
            id: "9",
            tierId: "4",
            name: "VIP Event Invitations",
            description: "Receive invitations to exclusive VIP events",
          },
        ],
      },
      {
        id: "5",
        name: "Reigning Champion",
        spendThreshold: 999999999, // Invite-only tier (admin assigned)
        benefits: [
          {
            id: "10",
            tierId: "5",
            name: "20% Discount on All Purchases",
            description: "Receive a 20% discount on all purchases",
          },
          {
            id: "11",
            tierId: "5",
            name: "Free Shipping on All Orders",
            description: "Get free shipping on any order",
          },
          {
            id: "12",
            tierId: "5",
            name: "VIP Event Invitations",
            description: "Receive invitations to exclusive VIP events",
          },
          {
            id: "13",
            tierId: "5",
            name: "Personal Shopping Assistant",
            description: "Get personalized shopping assistance",
          },
        ],
      },
    ];
  }

  /**
   * Test the connection to the Shopify API
   * @returns Promise resolving to true if connection is successful, false otherwise
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/shop.json`);
      return response.status === 200;
    } catch (error) {
      console.error("Error testing Shopify connection:", error);
      return false;
    }
  }

  /**
   * Get a customer by their ID
   * @param id The customer ID
   * @returns Promise resolving to the customer or null if not found
   */
  public async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/customers/${id}.json`);
      if (response.data && response.data.customer) {
        return this.mapToCustomer(response.data.customer);
      }
      return null;
    } catch (error) {
      console.error(`Error getting customer by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Get a customer by their phone number
   * @param phone The phone number
   * @returns Promise resolving to the customer or null if not found
   */
  public async getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      // Format phone number for search (remove non-numeric characters)
      const formattedPhone = phone.replace(/\D/g, "");

      // Search for customers with the given phone number
      const response = await axios.get(
        `${this.baseUrl}/customers/search.json?query=phone:${formattedPhone}`
      );

      if (
        response.data &&
        response.data.customers &&
        response.data.customers.length > 0
      ) {
        return this.mapToCustomer(response.data.customers[0]);
      }
      return null;
    } catch (error) {
      console.error(`Error getting customer by phone ${phone}:`, error);
      return null;
    }
  }

  /**
   * Search for customers by name, email, or phone
   * @param query The search query
   * @returns Promise resolving to an array of matching customers
   */
  public async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/customers/search.json?query=${encodeURIComponent(
          query
        )}`
      );

      if (response.data && response.data.customers) {
        const customers: Customer[] = [];
        for (const customer of response.data.customers) {
          const mappedCustomer = await this.mapToCustomer(customer);
          customers.push(mappedCustomer);
        }
        return customers;
      }
      return [];
    } catch (error) {
      console.error(`Error searching customers with query ${query}:`, error);
      return [];
    }
  }

  /**
   * Get all customers
   * @param limit Maximum number of customers to return
   * @returns Promise resolving to an array of customers
   */
  public async getAllCustomers(limit: number = 50): Promise<Customer[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/customers.json?limit=${limit}`
      );

      if (response.data && response.data.customers) {
        const customers: Customer[] = [];
        for (const customer of response.data.customers) {
          const mappedCustomer = await this.mapToCustomer(customer);
          customers.push(mappedCustomer);
        }
        return customers;
      }
      return [];
    } catch (error) {
      console.error("Error getting all customers:", error);
      return [];
    }
  }

  /**
   * Get all loyalty tiers
   * @returns Promise resolving to an array of tiers
   */
  public async getAllTiers(): Promise<Tier[]> {
    // Return the predefined tiers
    return Promise.resolve(this.tiers);
  }

  /**
   * Get a tier by its ID
   * @param id The tier ID
   * @returns Promise resolving to the tier or null if not found
   */
  public async getTierById(id: string): Promise<Tier | null> {
    const tier = this.tiers.find((t) => t.id === id);
    return Promise.resolve(tier || null);
  }

  /**
   * Get transactions for a customer
   * @param customerId The customer ID
   * @returns Promise resolving to an array of transactions
   */
  public async getCustomerTransactions(
    customerId: string
  ): Promise<Transaction[]> {
    try {
      // Get orders for the customer
      const response = await axios.get(
        `${this.baseUrl}/orders.json?customer_id=${customerId}&status=any`
      );

      if (response.data && response.data.orders) {
        return response.data.orders.map((order: any) => ({
          id: order.id.toString(),
          customerId: customerId,
          date: order.created_at,
          total: parseFloat(order.total_price),
          source: "shopify",
          sourceId: order.id.toString(),
        }));
      }
      return [];
    } catch (error) {
      console.error(
        `Error getting transactions for customer ${customerId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Calculate a customer's total spend
   * @param customerId The customer ID
   * @returns Promise resolving to the total spend amount
   */
  public async getCustomerTotalSpend(customerId: string): Promise<number> {
    try {
      const transactions = await this.getCustomerTransactions(customerId);
      return transactions.reduce(
        (total, transaction) => total + transaction.total,
        0
      );
    } catch (error) {
      console.error(
        `Error calculating total spend for customer ${customerId}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Calculate a customer's progress toward the next tier
   * @param customer The customer object
   * @returns Promise resolving to tier progress information
   */
  public async calculateTierProgress(
    customer: Customer
  ): Promise<TierProgress> {
    // Get all tiers sorted by spend threshold
    const sortedTiers = [...this.tiers].sort(
      (a, b) => a.spendThreshold - b.spendThreshold
    );

    // Find current tier
    const currentTier = customer.currentTier || sortedTiers[0];

    // Find next tier
    const currentTierIndex = sortedTiers.findIndex(
      (t) => t.id === currentTier.id
    );
    const nextTier =
      currentTierIndex < sortedTiers.length - 1
        ? sortedTiers[currentTierIndex + 1]
        : null;

    // Calculate progress
    const currentSpend = customer.totalSpend || 0;
    const nextTierThreshold = nextTier ? nextTier.spendThreshold : undefined;
    const spendToNextTier = nextTierThreshold
      ? nextTierThreshold - currentSpend
      : undefined;

    // Calculate percentage to next tier
    let percentToNextTier: number | undefined = undefined;
    if (nextTierThreshold && currentTier.spendThreshold < nextTierThreshold) {
      const tierRange = nextTierThreshold - currentTier.spendThreshold;
      const progress = currentSpend - currentTier.spendThreshold;
      percentToNextTier = Math.min(
        100,
        Math.max(0, (progress / tierRange) * 100)
      );
    }

    return {
      currentTier,
      nextTier: nextTier || undefined,
      currentSpend,
      nextTierThreshold: nextTierThreshold || undefined,
      spendToNextTier: spendToNextTier || undefined,
      percentToNextTier: percentToNextTier || undefined,
    };
  }

  /**
   * Map a Shopify customer to our Customer model
   * @param shopifyCustomer The Shopify customer object
   * @returns The mapped Customer object
   */
  public async mapToCustomer(shopifyCustomer: any): Promise<Customer> {
    // Calculate total spend
    const totalSpend = await this.getCustomerTotalSpend(
      shopifyCustomer.id.toString()
    );

    // Determine tier based on total spend
    const sortedTiers = [...this.tiers].sort(
      (a, b) => b.spendThreshold - a.spendThreshold
    );
    const tier =
      sortedTiers.find((t) => totalSpend >= t.spendThreshold) || this.tiers[0];

    return {
      id: shopifyCustomer.id.toString(),
      name: `${shopifyCustomer.first_name} ${shopifyCustomer.last_name}`,
      email: shopifyCustomer.email,
      phone: shopifyCustomer.phone,
      joinDate: shopifyCustomer.created_at,
      currentTierId: tier.id,
      currentTier: tier,
      totalSpend: totalSpend,
      isActive: shopifyCustomer.state !== "disabled",
    };
  }

  /**
   * Get daily revenue data
   * @returns Promise resolving to daily revenue data
   */
  public async getDailyRevenue(): Promise<any[]> {
    try {
      // Get orders from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const response = await axios.get(
        `${
          this.baseUrl
        }/orders.json?status=any&created_at_min=${thirtyDaysAgo.toISOString()}`
      );

      if (response.data && response.data.orders) {
        // Group orders by date
        const revenueByDate: { [date: string]: number } = {};

        for (const order of response.data.orders) {
          const date = order.created_at.split("T")[0]; // Extract date part
          const amount = parseFloat(order.total_price);

          if (!revenueByDate[date]) {
            revenueByDate[date] = 0;
          }

          revenueByDate[date] += amount;
        }

        // Convert to array format
        return Object.entries(revenueByDate).map(([date, amount]) => ({
          date,
          amount,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error getting daily revenue:", error);
      return [];
    }
  }

  /**
   * Get monthly revenue data
   * @returns Promise resolving to monthly revenue data
   */
  public async getMonthlyRevenue(): Promise<any[]> {
    try {
      // Get orders from the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const response = await axios.get(
        `${
          this.baseUrl
        }/orders.json?status=any&created_at_min=${twelveMonthsAgo.toISOString()}`
      );

      if (response.data && response.data.orders) {
        // Group orders by month
        const revenueByMonth: { [month: string]: number } = {};

        for (const order of response.data.orders) {
          const date = new Date(order.created_at);
          const month = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          const amount = parseFloat(order.total_price);

          if (!revenueByMonth[month]) {
            revenueByMonth[month] = 0;
          }

          revenueByMonth[month] += amount;
        }

        // Convert to array format
        return Object.entries(revenueByMonth).map(([month, amount]) => ({
          month,
          amount,
        }));
      }

      return [];
    } catch (error) {
      console.error("Error getting monthly revenue:", error);
      return [];
    }
  }
}

// Export a singleton instance
export const shopifyService = new ShopifyService();
