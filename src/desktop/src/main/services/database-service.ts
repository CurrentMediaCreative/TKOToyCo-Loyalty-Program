import * as path from "path";
import * as fs from "fs";
import { app } from "electron";
import { Customer, Tier, TierBenefit } from "../models/Customer";
import initSqlJs from "sql.js";

/**
 * DatabaseService
 *
 * Handles local SQLite database operations for caching customer data
 * and enabling offline functionality.
 */
export class DatabaseService {
  private db: initSqlJs.Database | null = null;
  private initialized: boolean = false;
  private dbPath: string;

  constructor() {
    // Create the data directory if it doesn't exist
    const userDataPath = app.getPath("userData");
    const dbDir = path.join(userDataPath, "database");

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, "tko-loyalty.db");
    console.log(`Database path: ${this.dbPath}`);
  }

  /**
   * Initialize the database schema
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs();

      // Load existing database if it exists, otherwise create a new one
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(new Uint8Array(data));
      } else {
        this.db = new SQL.Database();
      }

      // Enable foreign keys
      this.db.exec("PRAGMA foreign_keys = ON;");

      // Create tables if they don't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS tiers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          spendThreshold INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tier_benefits (
          id TEXT PRIMARY KEY,
          tierId TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          FOREIGN KEY (tierId) REFERENCES tiers(id)
        );

        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          joinDate TEXT,
          currentTierId TEXT,
          totalSpend REAL DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          lastSyncTime TEXT,
          FOREIGN KEY (currentTierId) REFERENCES tiers(id)
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          customerId TEXT NOT NULL,
          date TEXT NOT NULL,
          total REAL NOT NULL,
          source TEXT NOT NULL,
          sourceId TEXT,
          FOREIGN KEY (customerId) REFERENCES customers(id)
        );

        CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      `);

      this.initialized = true;
      console.log("Database initialized successfully");

      // Save the database to disk
      this.saveDatabase();
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  /**
   * Save the database to disk
   */
  private saveDatabase(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch (error) {
      console.error("Error saving database:", error);
    }
  }

  /**
   * Save a tier to the database
   * @param tier The tier to save
   */
  public saveTier(tier: Tier): void {
    if (!this.db || !this.initialized) return;

    this.db.run(
      `
      INSERT OR REPLACE INTO tiers (id, name, spendThreshold)
      VALUES (?, ?, ?)
    `,
      [tier.id, tier.name, tier.spendThreshold]
    );

    // Save tier benefits
    if (tier.benefits && tier.benefits.length > 0) {
      for (const benefit of tier.benefits) {
        this.db.run(
          `
          INSERT OR REPLACE INTO tier_benefits (id, tierId, name, description)
          VALUES (?, ?, ?, ?)
        `,
          [benefit.id, tier.id, benefit.name, benefit.description]
        );
      }
    }

    // Save changes to disk
    this.saveDatabase();
  }

  /**
   * Get all tiers from the database
   * @returns Array of tiers with their benefits
   */
  public getAllTiers(): Tier[] {
    if (!this.db || !this.initialized) return [];

    const tiers: Tier[] = [];
    const result = this.db.exec("SELECT * FROM tiers ORDER BY spendThreshold");

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    for (const row of values) {
      const tier: any = {};
      columns.forEach((col: string, i: number) => {
        tier[col] = row[i];
      });

      // Get benefits for the tier
      const benefitsResult = this.db!.exec(
        "SELECT * FROM tier_benefits WHERE tierId = ?",
        [tier.id]
      );

      tier.benefits = [];

      if (benefitsResult.length > 0 && benefitsResult[0].values.length > 0) {
        const benefitColumns = benefitsResult[0].columns;
        const benefitValues = benefitsResult[0].values;

        for (const benefitRow of benefitValues) {
          const benefit: any = {};
          benefitColumns.forEach((col: string, i: number) => {
            benefit[col] = benefitRow[i];
          });
          tier.benefits.push(benefit);
        }
      }

      tiers.push(tier as Tier);
    }

    return tiers;
  }

  /**
   * Get a tier by ID
   * @param id The tier ID
   * @returns The tier with its benefits, or null if not found
   */
  public getTierById(id: string): Tier | null {
    if (!this.db || !this.initialized) return null;

    const result = this.db.exec("SELECT * FROM tiers WHERE id = ?", [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const columns = result[0].columns;
    const values = result[0].values[0];

    const tier: any = {};
    columns.forEach((col: string, i: number) => {
      tier[col] = values[i];
    });

    // Get benefits for the tier
    const benefitsResult = this.db.exec(
      "SELECT * FROM tier_benefits WHERE tierId = ?",
      [tier.id]
    );

    tier.benefits = [];

    if (benefitsResult.length > 0 && benefitsResult[0].values.length > 0) {
      const benefitColumns = benefitsResult[0].columns;
      const benefitValues = benefitsResult[0].values;

      for (const benefitRow of benefitValues) {
        const benefit: any = {};
        benefitColumns.forEach((col: string, i: number) => {
          benefit[col] = benefitRow[i];
        });
        tier.benefits.push(benefit);
      }
    }

    return tier as Tier;
  }

  /**
   * Save a customer to the database
   * @param customer The customer to save
   */
  public saveCustomer(customer: Customer): void {
    if (!this.db || !this.initialized) return;

    // First save the customer's tier if it exists
    if (customer.currentTier) {
      this.saveTier(customer.currentTier);
    }

    // Then save the customer
    this.db.run(
      `
      INSERT OR REPLACE INTO customers (
        id, name, email, phone, joinDate, currentTierId, totalSpend, isActive, lastSyncTime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        customer.id,
        customer.name,
        customer.email,
        customer.phone,
        customer.joinDate,
        customer.currentTierId,
        customer.totalSpend,
        customer.isActive ? 1 : 0,
        new Date().toISOString(),
      ]
    );

    // Save changes to disk
    this.saveDatabase();
  }

  /**
   * Get a customer by ID
   * @param id The customer ID
   * @returns The customer with their tier, or null if not found
   */
  public getCustomerById(id: string): Customer | null {
    if (!this.db || !this.initialized) return null;

    const result = this.db.exec("SELECT * FROM customers WHERE id = ?", [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const columns = result[0].columns;
    const values = result[0].values[0];

    const customer: any = {};
    columns.forEach((col: string, i: number) => {
      customer[col] = values[i];
    });

    return this.hydrateCustomer(customer);
  }

  /**
   * Get a customer by phone number
   * @param phone The phone number
   * @returns The customer with their tier, or null if not found
   */
  public getCustomerByPhone(phone: string): Customer | null {
    if (!this.db || !this.initialized) return null;

    const result = this.db.exec("SELECT * FROM customers WHERE phone = ?", [
      phone,
    ]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const columns = result[0].columns;
    const values = result[0].values[0];

    const customer: any = {};
    columns.forEach((col: string, i: number) => {
      customer[col] = values[i];
    });

    return this.hydrateCustomer(customer);
  }

  /**
   * Search for customers by name, email, or phone
   * @param query The search query
   * @param limit Maximum number of results to return
   * @returns Array of matching customers
   */
  public searchCustomers(query: string, limit: number = 10): Customer[] {
    if (!this.db || !this.initialized) return [];

    const searchQuery = `%${query}%`;

    const result = this.db.exec(
      `
      SELECT * FROM customers 
      WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? 
      ORDER BY name
      LIMIT ?
    `,
      [searchQuery, searchQuery, searchQuery, limit]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    const customers: Customer[] = [];

    for (const row of values) {
      const customer: any = {};
      columns.forEach((col: string, i: number) => {
        customer[col] = row[i];
      });
      customers.push(this.hydrateCustomer(customer));
    }

    return customers;
  }

  /**
   * Get all customers
   * @param limit Maximum number of results to return
   * @returns Array of customers
   */
  public getAllCustomers(limit: number = 100): Customer[] {
    if (!this.db || !this.initialized) return [];

    const result = this.db.exec(
      `
      SELECT * FROM customers 
      ORDER BY name
      LIMIT ?
    `,
      [limit]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    const customers: Customer[] = [];

    for (const row of values) {
      const customer: any = {};
      columns.forEach((col: string, i: number) => {
        customer[col] = row[i];
      });
      customers.push(this.hydrateCustomer(customer));
    }

    return customers;
  }

  /**
   * Save a transaction to the database
   * @param transaction The transaction to save
   */
  public saveTransaction(transaction: any): void {
    if (!this.db || !this.initialized) return;

    this.db.run(
      `
      INSERT OR REPLACE INTO transactions (
        id, customerId, date, total, source, sourceId
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        transaction.id,
        transaction.customerId,
        transaction.date,
        transaction.total,
        transaction.source,
        transaction.sourceId,
      ]
    );

    // Save changes to disk
    this.saveDatabase();
  }

  /**
   * Get transactions for a customer
   * @param customerId The customer ID
   * @returns Array of transactions
   */
  public getCustomerTransactions(customerId: string): any[] {
    if (!this.db || !this.initialized) return [];

    const result = this.db.exec(
      `
      SELECT * FROM transactions 
      WHERE customerId = ? 
      ORDER BY date DESC
    `,
      [customerId]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    const values = result[0].values;

    const transactions: any[] = [];

    for (const row of values) {
      const transaction: any = {};
      columns.forEach((col: string, i: number) => {
        transaction[col] = row[i];
      });
      transactions.push(transaction);
    }

    return transactions;
  }

  /**
   * Calculate total spend for a customer
   * @param customerId The customer ID
   * @returns Total spend amount
   */
  public getCustomerTotalSpend(customerId: string): number {
    if (!this.db || !this.initialized) return 0;

    const result = this.db.exec(
      `
      SELECT SUM(total) as totalSpend 
      FROM transactions 
      WHERE customerId = ?
    `,
      [customerId]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return 0;
    }

    return (result[0].values[0][0] as number) || 0;
  }

  /**
   * Clear all data from the database
   */
  public clearAllData(): void {
    if (!this.db || !this.initialized) return;

    this.db.exec(`
      DELETE FROM transactions;
      DELETE FROM customers;
      DELETE FROM tier_benefits;
      DELETE FROM tiers;
    `);

    // Save changes to disk
    this.saveDatabase();
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Helper method to hydrate a customer object with its tier
   * @param customerData Raw customer data from the database
   * @returns Fully hydrated customer object
   */
  private hydrateCustomer(customerData: any): Customer {
    const customer = {
      ...customerData,
      isActive: customerData.isActive === 1,
    } as Customer;

    // Get the customer's tier
    if (customer.currentTierId) {
      const tier = this.getTierById(customer.currentTierId);
      if (tier) {
        customer.currentTier = tier;
      }
    }

    return customer;
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();
