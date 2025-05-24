// Type declarations for modules without type definitions

// Define Admin type for use in our services
export type Admin = {
  graphql: (query: string, options?: { variables?: any }) => Promise<Response>;
  rest: any;
};

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
