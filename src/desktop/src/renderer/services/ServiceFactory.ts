import { ICustomerService } from './ICustomerService';
import { mockDataService } from './MockDataService';

/**
 * Service factory for providing service implementations
 * This allows us to easily switch between mock and real implementations
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private customerService: ICustomerService;
  
  private constructor() {
    // In Phase 1, we use the mock data service
    // In Phase 2, this will be replaced with the real API service
    this.customerService = mockDataService;
  }
  
  /**
   * Get the singleton instance of the service factory
   * @returns The service factory instance
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }
  
  /**
   * Get the customer service implementation
   * @returns The customer service
   */
  public getCustomerService(): ICustomerService {
    return this.customerService;
  }
  
  /**
   * Set the customer service implementation
   * This is useful for testing or switching implementations at runtime
   * @param service The customer service implementation
   */
  public setCustomerService(service: ICustomerService): void {
    this.customerService = service;
  }
}

// Export a convenience function to get the customer service
export const getCustomerService = (): ICustomerService => {
  return ServiceFactory.getInstance().getCustomerService();
};
