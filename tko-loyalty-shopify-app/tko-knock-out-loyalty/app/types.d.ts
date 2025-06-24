// Type declarations for modules without type definitions

// Define Admin type for use in our services
export type Admin = {
  graphql: (query: string, options?: { variables?: any }) => Promise<Response>;
  rest: any;
};

// Extend Prisma types to include PointEvent model and Customer orderBy fields
declare module "@prisma/client" {
  export interface PrismaClient {
    pointEvent: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args?: any) => Promise<any | null>;
      create: (args?: any) => Promise<any>;
      update: (args?: any) => Promise<any>;
      delete: (args?: any) => Promise<any>;
    };
    pointTransaction: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args?: any) => Promise<any | null>;
      create: (args?: any) => Promise<any>;
      update: (args?: any) => Promise<any>;
      delete: (args?: any) => Promise<any>;
    };
  }

  // Extend the Customer model with the additional fields
  export interface Customer {
    spendPoints: number;
    bonusPoints: number;
    totalPoints: number;
    transactions?: PointTransaction[];
  }

  export interface PointEvent {
    id: string;
    name: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    eventType: string; // "store-wide" or "product-specific"
    productIds?: string | null; // JSON array of product IDs for product-specific events
    bonusPercentage: number;
    isActive: boolean;
    usageCount: number;
    pointsAwarded: number;
    lastUsed?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    transactions?: PointTransaction[];
  }

  export interface PointTransaction {
    id: string;
    customerId: string;
    customer: Customer;
    type: string; // "spend" or "bonus"
    amount: number;
    orderId?: string | null;
    eventId?: string | null;
    event?: PointEvent | null;
    description?: string | null;
    createdAt: Date;
  }

  export namespace Prisma {
    export interface CustomerOrderByWithRelationInput {
      totalPoints?: SortOrder;
      spendPoints?: SortOrder;
      bonusPoints?: SortOrder;
    }

    export interface CustomerSelect {
      bonusPoints?: boolean;
      spendPoints?: boolean;
      totalPoints?: boolean;
    }

    export interface CustomerUpdateInput {
      spendPoints?: number | NullableFloatFieldUpdateOperationsInput;
      bonusPoints?: number | NullableFloatFieldUpdateOperationsInput;
      totalPoints?: number | NullableFloatFieldUpdateOperationsInput;
    }

    export interface CustomerUncheckedUpdateInput {
      spendPoints?: number | NullableFloatFieldUpdateOperationsInput;
      bonusPoints?: number | NullableFloatFieldUpdateOperationsInput;
      totalPoints?: number | NullableFloatFieldUpdateOperationsInput;
    }

    export interface CustomerCreateInput {
      spendPoints?: number;
      bonusPoints?: number;
      totalPoints?: number;
    }

    export interface CustomerUncheckedCreateInput {
      spendPoints?: number;
      bonusPoints?: number;
      totalPoints?: number;
    }

    export interface NullableFloatFieldUpdateOperationsInput {
      set?: number | null;
      increment?: number;
      decrement?: number;
      multiply?: number;
      divide?: number;
    }

    export enum SortOrder {
      asc = "asc",
      desc = "desc",
    }
  }
}

declare module "@shopify/shopify-app-remix/server" {
  export const ApiVersion: {
    January25: string;
    // Add other API versions as needed
  };
  export const AppDistribution: {
    ShopifyAdmin: string;
    // Add other distributions as needed
  };
  export function shopifyApp(options: any): any;
  export const LATEST_API_VERSION: string;
  export const boundary: {
    error: (error: any) => any;
    headers: (args: any) => Headers;
  };
}

declare module "@shopify/shopify-app-remix/adapters/node" {}

declare module "@shopify/shopify-app-session-storage-prisma" {
  export class PrismaSessionStorage {
    constructor(prismaClient: any);
  }
}

declare module "@shopify/hydrogen" {
  export function useNonce(): string;
}

declare module "@shopify/app-bridge-react" {
  export interface TitleBarProps {
    title: string;
    primaryAction?: any;
    secondaryActions?: any[];
    actionGroups?: any[];
    breadcrumbs?: any[];
  }

  export function TitleBar(props: TitleBarProps): JSX.Element;

  export interface NavMenuProps {
    children?: React.ReactNode;
  }

  export function NavMenu(props: NavMenuProps): JSX.Element;
}
