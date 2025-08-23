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

  // Fetch customer loyalty data
  useEffect(() => {
    if (!customer?.email) {
      return;
    }

    const fetchLoyaltyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Make API call to get customer loyalty data
        const response = await fetch(
          `/api/public/customer-loyalty?customerEmail=${encodeURIComponent(customer.email || "")}&cartTotal=0`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load loyalty data");
        }

        const data = await response.json();

        if (data.success) {
          setLoyaltyData(data);
        } else {
          throw new Error(data.error || "Unknown error");
        }
      } catch (err) {
        console.error("Error loading loyalty data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load loyalty data",
        );
      } finally {
        setLoading(false);
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

  // Show error state
  if (error) {
    return (
      <Card>
        <BlockStack spacing="tight">
          <Text emphasis="bold">{title}</Text>
          <Banner status="critical">
            <Text>Unable to load loyalty information: {error}</Text>
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
        <Text emphasis="bold" size="large">
          {title}
        </Text>

        {/* Customer Name and Tier */}
        <BlockStack spacing="tight">
          <InlineLayout columns={["fill", "auto"]}>
            <Text emphasis="bold">{customerData.name}</Text>
            <Text emphasis="bold" appearance="accent">
              {customerData.tier} Tier
            </Text>
          </InlineLayout>

          <InlineLayout columns={["fill", "auto"]}>
            <Text>Total Points:</Text>
            <Text emphasis="bold">
              {customerData.totalPoints.toLocaleString()}
            </Text>
          </InlineLayout>
        </BlockStack>

        {/* Unfulfilled Points */}
        {showUnfulfilledPoints && customerData.unfulfilledPoints > 0 && (
          <BlockStack spacing="extraTight">
            <Divider />
            <InlineLayout columns={["fill", "auto"]}>
              <Text appearance="subdued">Pending Points:</Text>
              <Text appearance="subdued">
                {customerData.unfulfilledPoints.toLocaleString()}
              </Text>
            </InlineLayout>
            <Text appearance="subdued" size="small">
              Points from orders not yet fulfilled
            </Text>
          </BlockStack>
        )}

        {/* Tier Progress */}
        {showTierProgress && customerData.tierProgress.nextTier && (
          <BlockStack spacing="tight">
            <Divider />
            <Text emphasis="bold">
              Progress to {customerData.tierProgress.nextTier}
            </Text>

            <Progress value={customerData.tierProgress.percentage / 100} />

            <InlineLayout columns={["fill", "auto"]}>
              <Text size="small" appearance="subdued">
                {customerData.tierProgress.needed.toLocaleString()} points
                needed
              </Text>
              <Text size="small" appearance="subdued">
                {customerData.tierProgress.percentage.toFixed(1)}%
              </Text>
            </InlineLayout>
          </BlockStack>
        )}

        {/* Tier Achievement Message */}
        {showTierProgress && !customerData.tierProgress.nextTier && (
          <BlockStack spacing="tight">
            <Divider />
            <Banner status="success">
              <Text>
                🎉 You've reached the highest tier! Keep earning points for
                exclusive rewards.
              </Text>
            </Banner>
          </BlockStack>
        )}

        {/* Additional Info */}
        <BlockStack spacing="extraTight">
          <Divider />
          <Text size="small" appearance="subdued">
            Earn 1 point for every $1 spent • Points added when orders are
            fulfilled
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
