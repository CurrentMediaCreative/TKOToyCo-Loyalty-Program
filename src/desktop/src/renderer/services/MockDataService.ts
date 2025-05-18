import { Customer, Tier, TierBenefit, TierProgress } from '../models/Customer';
import { ICustomerService } from './ICustomerService';

/**
 * Mock data service for development
 * This will be replaced with actual API calls in Phase 2
 */
export class MockDataService implements ICustomerService {
  private customers: Customer[] = [];
  private tiers: Tier[] = [];
  private tierBenefits: TierBenefit[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize mock data
   */
  private initializeMockData(): void {
    // Create tier benefits
    this.tierBenefits = [
      {
        id: '1',
        tierId: '1',
        name: '5% Discount on All Purchases',
        description: 'Receive a 5% discount on all purchases',
        isActive: true
      },
      {
        id: '2',
        tierId: '2',
        name: '10% Discount on All Purchases',
        description: 'Receive a 10% discount on all purchases',
        isActive: true
      },
      {
        id: '3',
        tierId: '2',
        name: 'Free Shipping on Orders Over $50',
        description: 'Get free shipping on any order over $50',
        isActive: true
      },
      {
        id: '4',
        tierId: '3',
        name: '10% Discount on All Purchases',
        description: 'Receive a 10% discount on all purchases',
        isActive: true
      },
      {
        id: '5',
        tierId: '3',
        name: 'Free Shipping on Orders Over $50',
        description: 'Get free shipping on any order over $50',
        isActive: true
      },
      {
        id: '6',
        tierId: '3',
        name: 'Exclusive Access to Pre-releases',
        description: 'Get early access to new product releases',
        isActive: true
      },
      {
        id: '7',
        tierId: '4',
        name: '15% Discount on All Purchases',
        description: 'Receive a 15% discount on all purchases',
        isActive: true
      },
      {
        id: '8',
        tierId: '4',
        name: 'Free Shipping on All Orders',
        description: 'Get free shipping on any order',
        isActive: true
      },
      {
        id: '9',
        tierId: '4',
        name: 'VIP Event Invitations',
        description: 'Receive invitations to exclusive VIP events',
        isActive: true
      },
      {
        id: '10',
        tierId: '5',
        name: '20% Discount on All Purchases',
        description: 'Receive a 20% discount on all purchases',
        isActive: true
      },
      {
        id: '11',
        tierId: '5',
        name: 'Free Shipping on All Orders',
        description: 'Get free shipping on any order',
        isActive: true
      },
      {
        id: '12',
        tierId: '5',
        name: 'VIP Event Invitations',
        description: 'Receive invitations to exclusive VIP events',
        isActive: true
      },
      {
        id: '13',
        tierId: '5',
        name: 'Personal Shopping Assistant',
        description: 'Get personalized shopping assistance',
        isActive: true
      }
    ];

    // Create tiers
    this.tiers = [
      {
        id: '1',
        name: 'Featherweight',
        spendThreshold: 0, // $0-$1,499
        benefits: this.tierBenefits.filter(benefit => benefit.tierId === '1')
      },
      {
        id: '2',
        name: 'Lightweight',
        spendThreshold: 1500, // $1,500-$4,999
        benefits: this.tierBenefits.filter(benefit => benefit.tierId === '2')
      },
      {
        id: '3',
        name: 'Welterweight',
        spendThreshold: 5000, // $5,000-$24,999
        benefits: this.tierBenefits.filter(benefit => benefit.tierId === '3')
      },
      {
        id: '4',
        name: 'Heavyweight',
        spendThreshold: 25000, // $25,000+
        benefits: this.tierBenefits.filter(benefit => benefit.tierId === '4')
      },
      {
        id: '5',
        name: 'Reigning Champion',
        spendThreshold: null, // Invite-only tier (no strict amount)
        benefits: this.tierBenefits.filter(benefit => benefit.tierId === '5')
      }
    ];

    // Create customers
    this.customers = [
      {
        id: '1',
        name: 'John Smith',
        phone: '555-123-4567',
        email: 'john.smith@example.com',
        joinDate: '2024-01-15',
        currentTierId: '4',
        currentTier: this.tiers.find(tier => tier.id === '4')!,
        totalSpend: 2245,
        isActive: true
      },
      {
        id: '2',
        name: 'Jane Doe',
        phone: '555-987-6543',
        email: 'jane.doe@example.com',
        joinDate: '2024-02-20',
        currentTierId: '2',
        currentTier: this.tiers.find(tier => tier.id === '2')!,
        totalSpend: 750,
        isActive: true
      },
      {
        id: '3',
        name: 'Bob Johnson',
        phone: '555-555-5555',
        email: 'bob.johnson@example.com',
        joinDate: '2024-03-10',
        currentTierId: '3',
        currentTier: this.tiers.find(tier => tier.id === '3')!,
        totalSpend: 1850,
        isActive: true
      },
      {
        id: '4',
        name: 'Alice Williams',
        phone: '555-222-3333',
        email: 'alice.williams@example.com',
        joinDate: '2024-01-05',
        currentTierId: '5',
        currentTier: this.tiers.find(tier => tier.id === '5')!,
        totalSpend: 6500,
        isActive: true
      },
      {
        id: '5',
        name: 'Charlie Brown',
        phone: '555-444-7777',
        email: 'charlie.brown@example.com',
        joinDate: '2024-04-01',
        currentTierId: '1',
        currentTier: this.tiers.find(tier => tier.id === '1')!,
        totalSpend: 250,
        isActive: true
      }
    ];
  }

  /**
   * Get a customer by phone number
   * @param phoneNumber The customer's phone number
   * @returns The customer or null if not found
   */
  public getCustomerByPhone(phoneNumber: string): Promise<Customer | null> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const customer = this.customers.find(c => c.phone === phoneNumber) || null;
        resolve(customer);
      }, 500);
    });
  }

  /**
   * Get a customer by ID
   * @param id The customer's ID
   * @returns The customer or null if not found
   */
  public getCustomerById(id: string): Promise<Customer | null> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const customer = this.customers.find(c => c.id === id) || null;
        resolve(customer);
      }, 500);
    });
  }

  /**
   * Calculate tier progress for a customer
   * @param customer The customer
   * @returns The tier progress information
   */
  public calculateTierProgress(customer: Customer): TierProgress {
    // Sort tiers by spend threshold (excluding null values or putting them at the end)
    const sortedTiers = [...this.tiers].sort((a, b) => {
      // Handle null values in sort
      if (a.spendThreshold === null) return 1; // null goes to the end
      if (b.spendThreshold === null) return -1; // null goes to the end
      return a.spendThreshold - b.spendThreshold;
    });
    
    // Find current tier
    const currentTier = customer.currentTier;
    
    // Find next tier
    const currentTierIndex = sortedTiers.findIndex(tier => tier.id === currentTier.id);
    const nextTier = currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null;
    
    // Calculate progress
    const currentSpend = customer.totalSpend;
    const nextTierThreshold = nextTier?.spendThreshold || null;
    
    let progressPercentage = 100;
    let amountToNextTier = 0;
    
    if (nextTier && nextTier.spendThreshold !== null && currentTier.spendThreshold !== null) {
      const tierDifference = nextTier.spendThreshold - currentTier.spendThreshold;
      const currentProgress = currentSpend - currentTier.spendThreshold;
      progressPercentage = Math.min(Math.round((currentProgress / tierDifference) * 100), 100);
      amountToNextTier = Math.max(nextTier.spendThreshold - currentSpend, 0);
    }
    
    // Determine if close to next tier (within 5%)
    const isCloseToNextTier = nextTier !== null && progressPercentage >= 95;
    
    return {
      currentTier,
      nextTier,
      currentSpend,
      nextTierThreshold,
      progressPercentage,
      amountToNextTier,
      isCloseToNextTier
    };
  }

  /**
   * Get all tiers
   * @returns Array of all tiers
   */
  public getAllTiers(): Promise<Tier[]> {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve([...this.tiers]);
      }, 500);
    });
  }
}

// Create singleton instance
export const mockDataService = new MockDataService();
