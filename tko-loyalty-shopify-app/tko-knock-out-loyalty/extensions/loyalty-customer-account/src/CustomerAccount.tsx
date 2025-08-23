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
          `https://tkotoyco-loyalty-program.onrender.com/api/public/customer-loyalty?customerEmail=${encodeURIComponent(customer.email || "")}&cartTotal=0`,
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
