import { Customer } from "../main/models/Customer";

declare global {
  interface Window {
    api?: {
      // Window management
      showMainWindow: () => void;
      hideMainWindow: () => void;
      showPopupWindow: () => void;
      hidePopupWindow: () => void;
      positionPopupWindow: (x: number, y: number) => void;

      // Customer operations
      lookupCustomer: (phoneNumber: string) => void;
      lookupCustomerEnhanced: (query: string) => void;
      openCustomerInMain: (customerId: string) => void;
      applyDiscount: (customerId: string, discountType: string) => void;

      // Data synchronization
      syncData: () => void;

      // Settings
      setAutoLaunch: (enabled: boolean) => void;
      getSettings: () => Promise<any>;

      // Shopify API
      shopifyTestConnection: () => Promise<any>;
      shopifySearchCustomers: (query: string) => Promise<any>;
      shopifyGetCustomer: (customerId: string) => Promise<any>;
      shopifyGetCustomerSpend: (customerId: string) => Promise<any>;

      // Customer Service API (using Shopify as data source)
      getCustomerByPhone: (phoneNumber: string) => Promise<any>;
      getCustomerById: (customerId: string) => Promise<any>;
      calculateTierProgress: (customer: any) => Promise<any>;
      getAllTiers: () => Promise<any>;

      // Event listeners
      onCustomerData: (callback: (customer: any) => void) => void;
      onNavigateToCustomer: (callback: (customerId: string) => void) => void;
      onSyncComplete: (callback: (result: any) => void) => void;
      onLookupCustomerResult: (callback: (result: any) => void) => void;
      onShopifyCustomersLoaded: (
        callback: (customers: Customer[]) => void
      ) => void;
      onError: (callback: (error: string) => void) => void;

      // Remove listeners
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {};
