import {
  reactExtension,
  useSettings,
  useCustomer,
  Banner,
  BlockStack,
  Text,
  InlineLayout,
  Divider,
  Progress,
  Card,
} from "@shopify/ui-extensions-react/customer-account";
import { useState, useEffect } from "react";

interface CustomerLoyaltyResponse {
  success: boolean;
  customer?: {
    id: string;
    name: string;
    email: string;
    tier: string;
    totalPoints: number;
    unfulfilledPoints: number;
    tierProgress: {
      percentage: number;
      current: number;
      needed: number;
      nextTier: string | null;
    };
  };
  cartCalculation?: {
    cartTotal: number;
    basePoints: number;
    bonusPoints: number;
    totalPoints: number;
    appliedEvents: Array<{
      eventId: string;
      eventName: string;
      bonusPoints: number;
      bonusPercentage: number;
    }>;
  };
  error?: string;
}

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <CustomerAccountLoyaltyCard />,
);

function CustomerAccountLoyaltyCard() {
  const settings = useSettings();
  const customer = useCustomer();

  // State for loyalty data
  const [loyaltyData, setLoyaltyData] =
    useState<CustomerLoyaltyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get settings
  const title = settings.title || "Your Loyalty Status";
  const showTierProgress = settings.show_tier_progress !== false;
  const showUnfulfilledPoints = settings.show_unfulfilled_points !== false;

  // Get API base URL dynamically
  const getApiBaseUrl = () => {
    // Try to detect the current app URL from the browser context
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;

      // If we're in development or local environment
      if (
        currentHost.includes("localhost") ||
        currentHost.includes("127.0.0.1")
      ) {
        return "http://localhost:3000";
      }

      // If we're on the Shopify admin domain, try to construct the app URL
      if (currentHost.includes("admin.shopify.com")) {
        return "https://tkotoyco-loyalty-program.onrender.com";
      }

      // If we're on the customer account domain, use the production URL
      if (currentHost.includes("shopify.com")) {
        return "https://tkotoyco-loyalty-program.onrender.com";
      }
    }

    // Default fallback
    return "https://tkotoyco-loyalty-program.onrender.com";
  };

  // Fetch customer loyalty data with retry logic
  useEffect(() => {
    if (!customer?.email) {
      return;
    }

    const fetchLoyaltyData = async (retryCount = 0) => {
      setLoading(true);
      setError(null);

      try {
        const baseUrl = getApiBaseUrl();
        const apiUrl = `${baseUrl}/api/public/customer-loyalty?customerEmail=${encodeURIComponent(customer.email || "")}&cartTotal=0`;

        console.log(`[Loyalty Extension] Attempting to fetch from: ${apiUrl}`);

        // Make API call to get customer loyalty data
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Customer-Email": customer.email || "",
          },
        });

        console.log(`[Loyalty Extension] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `[Loyalty Extension] API Error: ${response.status} - ${errorText}`,
          );
          throw new Error(
            `API Error: ${response.status} - ${response.statusText}`,
          );
        }

        const data = await response.json();
        console.log(`[Loyalty Extension] Response data:`, data);

        if (data.success) {
          setLoyaltyData(data);
        } else {
          throw new Error(data.error || "API returned success: false");
        }
      } catch (err) {
        console.error(
          `[Loyalty Extension] Error loading loyalty data (attempt ${retryCount + 1}):`,
          err,
        );

        // Retry logic - try up to 3 times with exponential backoff
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`[Loyalty Extension] Retrying in ${delay}ms...`);
          setTimeout(() => fetchLoyaltyData(retryCount + 1), delay);
          return;
        }

        // Final error after all retries
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load loyalty data";
        setError(`${errorMessage} (after ${retryCount + 1} attempts)`);
      } finally {
        if (retryCount === 0) {
          setLoading(false);
        }
      }
    };

    fetchLoyaltyData();
  }, [customer?.email]);

  // Don't show if no customer or no loyalty data
  if (!customer?.email) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <Card>
        <BlockStack spacing="tight">
          <Text emphasis="bold">{title}</Text>
          <Text appearance="subdued">Loading your loyalty information...</Text>
        </BlockStack>
      </Card>
    );
  }

  // Show error state with debug info
  if (error) {
    return (
      <Card>
        <BlockStack spacing="tight">
          <Text emphasis="bold">{title}</Text>
          <Banner status="critical">
            <BlockStack spacing="tight">
              <Text>Unable to load loyalty information</Text>
              <Text size="small" appearance="subdued">
                Error: {error}
              </Text>
              <Text size="small" appearance="subdued">
                API URL: {getApiBaseUrl()}/api/public/customer-loyalty
              </Text>
              <Text size="small" appearance="subdued">
                Customer Email: {customer?.email || "Not available"}
              </Text>
            </BlockStack>
          </Banner>
        </BlockStack>
      </Card>
    );
  }

  // Show if no loyalty data found
  if (!loyaltyData?.customer) {
    return (
      <Card>
        <BlockStack spacing="tight">
          <Text emphasis="bold">{title}</Text>
          <Banner status="info">
            <Text>
              Join our loyalty program to start earning points on your
              purchases!
            </Text>
          </Banner>
        </BlockStack>
      </Card>
    );
  }

  const customerData = loyaltyData.customer;

  return (
    <Card>
      <BlockStack spacing="base">
        {/* Header with TKO Branding */}
        <BlockStack spacing="tight">
          <Text emphasis="bold" size="large">
            🥊 {title}
          </Text>
          <Text appearance="subdued" size="small">
            TKO Toy Co Loyalty Program
          </Text>
        </BlockStack>

        <Divider />

        {/* Customer Name and Tier - Enhanced */}
        <BlockStack spacing="base">
          <InlineLayout columns={["fill", "auto"]}>
            <BlockStack spacing="extraTight">
              <Text size="small" appearance="subdued">
                Member
              </Text>
              <Text emphasis="bold" size="medium">
                {customerData.name}
              </Text>
            </BlockStack>
            <BlockStack spacing="extraTight">
              <Text size="small" appearance="subdued">
                Current Tier
              </Text>
              <Text emphasis="bold" appearance="accent" size="medium">
                {customerData.tier}
              </Text>
            </BlockStack>
          </InlineLayout>

          {/* Points Display - Enhanced */}
          <InlineLayout columns={["fill", "auto"]}>
            <BlockStack spacing="extraTight">
              <Text size="small" appearance="subdued">
                Total Points
              </Text>
              <Text emphasis="bold" size="large">
                {customerData.totalPoints.toLocaleString()}
              </Text>
            </BlockStack>
            {showUnfulfilledPoints && customerData.unfulfilledPoints > 0 && (
              <BlockStack spacing="extraTight">
                <Text size="small" appearance="subdued">
                  Pending
                </Text>
                <Text emphasis="bold" appearance="subdued">
                  +{customerData.unfulfilledPoints.toLocaleString()}
                </Text>
              </BlockStack>
            )}
          </InlineLayout>
        </BlockStack>

        {/* Unfulfilled Points Details */}
        {showUnfulfilledPoints && customerData.unfulfilledPoints > 0 && (
          <BlockStack spacing="extraTight">
            <Divider />
            <Banner status="info">
              <Text size="small">
                You have {customerData.unfulfilledPoints.toLocaleString()}{" "}
                pending points from orders awaiting fulfillment
              </Text>
            </Banner>
          </BlockStack>
        )}

        {/* Tier Progress - Enhanced */}
        {showTierProgress && customerData.tierProgress.nextTier && (
          <BlockStack spacing="base">
            <Divider />
            <BlockStack spacing="tight">
              <InlineLayout columns={["fill", "auto"]}>
                <Text emphasis="bold" size="medium">
                  Progress to {customerData.tierProgress.nextTier}
                </Text>
                <Text emphasis="bold" appearance="accent">
                  {customerData.tierProgress.percentage.toFixed(0)}%
                </Text>
              </InlineLayout>

              <Progress value={customerData.tierProgress.percentage / 100} />

              <InlineLayout columns={["fill", "auto"]}>
                <Text size="small" appearance="subdued">
                  {customerData.tierProgress.needed.toLocaleString()} more
                  points needed
                </Text>
                <Text size="small" appearance="subdued">
                  {customerData.tierProgress.current.toLocaleString()} current
                </Text>
              </InlineLayout>
            </BlockStack>
          </BlockStack>
        )}

        {/* Tier Achievement Message - Enhanced */}
        {showTierProgress && !customerData.tierProgress.nextTier && (
          <BlockStack spacing="tight">
            <Divider />
            <Banner status="success">
              <Text emphasis="bold">
                🏆 Congratulations! You've reached the highest tier!
              </Text>
              <Text size="small">
                Keep earning points for exclusive rewards and benefits.
              </Text>
            </Banner>
          </BlockStack>
        )}

        {/* Footer Info - Enhanced */}
        <BlockStack spacing="extraTight">
          <Divider />
          <Text size="small" appearance="subdued">
            💰 Earn 1 point for every $1 spent
          </Text>
          <Text size="small" appearance="subdued">
            ⏱️ Points are added when your orders are fulfilled
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
