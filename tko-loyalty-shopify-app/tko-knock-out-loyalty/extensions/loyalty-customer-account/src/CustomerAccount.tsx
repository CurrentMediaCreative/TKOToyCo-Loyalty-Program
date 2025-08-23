import {
  reactExtension,
  useSettings,
  useCustomer,
  useAppMetafields,
  Banner,
  BlockStack,
  Text,
  InlineLayout,
  Divider,
  Progress,
  Card,
} from "@shopify/ui-extensions-react/customer-account";
import { useState, useEffect } from "react";

// Tier configuration matching the database
const TIER_CONFIG = {
  1: { name: "Featherweight", minPoints: 0, maxPoints: 499 },
  2: { name: "Lightweight", minPoints: 500, maxPoints: 999 },
  3: { name: "Welterweight", minPoints: 1000, maxPoints: 2499 },
  4: { name: "Heavyweight", minPoints: 2500, maxPoints: 4999 },
  5: { name: "Reigning Champion", minPoints: 5000, maxPoints: 999999 },
};

interface LoyaltyData {
  tierName: string;
  tierLevel: number;
  totalSpend: number;
  spendPoints: number;
  bonusPoints: number;
  totalPoints: number;
  tierBenefits: string[];
  tierProgress: {
    percentage: number;
    current: number;
    needed: number;
    nextTier: string | null;
  };
}

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <CustomerAccountLoyaltyCard />,
);

function CustomerAccountLoyaltyCard() {
  const settings = useSettings();
  const customer = useCustomer();
  const metafields = useAppMetafields();

  // State for loyalty data
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get settings
  const title = settings.title || "Your Loyalty Status";
  const showTierProgress = settings.show_tier_progress !== false;
  const showUnfulfilledPoints = settings.show_unfulfilled_points !== false;

  // Calculate tier progress
  const calculateTierProgress = (currentPoints: number, tierLevel: number) => {
    const currentTier = TIER_CONFIG[tierLevel as keyof typeof TIER_CONFIG];
    const nextTierLevel = tierLevel + 1;
    const nextTier = TIER_CONFIG[nextTierLevel as keyof typeof TIER_CONFIG];

    if (!nextTier || tierLevel >= 5) {
      // Already at highest tier
      return {
        percentage: 100,
        current: currentPoints,
        needed: 0,
        nextTier: null,
      };
    }

    const pointsInCurrentTier = currentPoints - currentTier.minPoints;
    const pointsNeededForNextTier = nextTier.minPoints - currentTier.minPoints;
    const percentage = Math.min(
      (pointsInCurrentTier / pointsNeededForNextTier) * 100,
      100,
    );

    return {
      percentage: Math.max(percentage, 0),
      current: currentPoints,
      needed: nextTier.minPoints - currentPoints,
      nextTier: nextTier.name,
    };
  };

  // Process metafields data
  useEffect(() => {
    if (!customer?.email) {
      setLoading(false);
      return;
    }

    try {
      console.log("[Loyalty Extension] Processing metafields:", metafields);

      // Extract loyalty data from metafields
      const tierName = String(
        metafields.find(
          (m) =>
            m.metafield.namespace === "tko_loyalty" &&
            m.metafield.key === "tier_name",
        )?.metafield.value || "Featherweight",
      );

      const tierLevel = parseInt(
        String(
          metafields.find(
            (m) =>
              m.metafield.namespace === "tko_loyalty" &&
              m.metafield.key === "tier_level",
          )?.metafield.value || "1",
        ),
      );

      const totalSpend = parseFloat(
        String(
          metafields.find(
            (m) =>
              m.metafield.namespace === "tko_loyalty" &&
              m.metafield.key === "total_spend",
          )?.metafield.value || "0",
        ),
      );

      const spendPoints = parseFloat(
        String(
          metafields.find(
            (m) =>
              m.metafield.namespace === "tko_loyalty" &&
              m.metafield.key === "spend_points",
          )?.metafield.value || "0",
        ),
      );

      const bonusPoints = parseFloat(
        String(
          metafields.find(
            (m) =>
              m.metafield.namespace === "tko_loyalty" &&
              m.metafield.key === "bonus_points",
          )?.metafield.value || "0",
        ),
      );

      const totalPoints = parseFloat(
        String(
          metafields.find(
            (m) =>
              m.metafield.namespace === "tko_loyalty" &&
              m.metafield.key === "total_points",
          )?.metafield.value || "0",
        ),
      );

      const tierBenefitsRaw = String(
        metafields.find(
          (m) =>
            m.metafield.namespace === "tko_loyalty" &&
            m.metafield.key === "tier_benefits",
        )?.metafield.value || "",
      );

      let tierBenefits: string[] = [];
      if (tierBenefitsRaw) {
        try {
          tierBenefits = JSON.parse(tierBenefitsRaw);
        } catch {
          tierBenefits = [];
        }
      }

      // Calculate tier progress
      const tierProgress = calculateTierProgress(totalPoints, tierLevel);

      const processedData: LoyaltyData = {
        tierName,
        tierLevel,
        totalSpend,
        spendPoints,
        bonusPoints,
        totalPoints,
        tierBenefits,
        tierProgress,
      };

      console.log("[Loyalty Extension] Processed loyalty data:", processedData);
      setLoyaltyData(processedData);
      setError(null);
    } catch (err) {
      console.error("[Loyalty Extension] Error processing metafields:", err);
      setError("Failed to process loyalty data");
    } finally {
      setLoading(false);
    }
  }, [customer?.email, metafields]);

  // Don't show if no customer
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
            <BlockStack spacing="tight">
              <Text>Unable to load loyalty information</Text>
              <Text size="small" appearance="subdued">
                Error: {error}
              </Text>
              <Text size="small" appearance="subdued">
                Customer Email: {customer?.email || "Not available"}
              </Text>
              <Text size="small" appearance="subdued">
                Metafields Count: {metafields.length}
              </Text>
            </BlockStack>
          </Banner>
        </BlockStack>
      </Card>
    );
  }

  // Show if no loyalty data found
  if (!loyaltyData || loyaltyData.totalPoints === 0) {
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

  // Get customer name
  const customerName =
    customer.firstName && customer.lastName
      ? `${customer.firstName} ${customer.lastName}`.trim()
      : customer.firstName || customer.lastName || "Valued Customer";

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
                {customerName}
              </Text>
            </BlockStack>
            <BlockStack spacing="extraTight">
              <Text size="small" appearance="subdued">
                Current Tier
              </Text>
              <Text emphasis="bold" appearance="accent" size="medium">
                {loyaltyData.tierName}
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
                {loyaltyData.totalPoints.toLocaleString()}
              </Text>
            </BlockStack>
            {showUnfulfilledPoints && loyaltyData.bonusPoints > 0 && (
              <BlockStack spacing="extraTight">
                <Text size="small" appearance="subdued">
                  Bonus Points
                </Text>
                <Text emphasis="bold" appearance="subdued">
                  +{loyaltyData.bonusPoints.toLocaleString()}
                </Text>
              </BlockStack>
            )}
          </InlineLayout>
        </BlockStack>

        {/* Points Breakdown */}
        {loyaltyData.bonusPoints > 0 && (
          <BlockStack spacing="extraTight">
            <Divider />
            <Banner status="info">
              <Text size="small">
                You have {loyaltyData.bonusPoints.toLocaleString()} bonus points
                from special promotions and events!
              </Text>
            </Banner>
          </BlockStack>
        )}

        {/* Tier Progress - Enhanced */}
        {showTierProgress && loyaltyData.tierProgress.nextTier && (
          <BlockStack spacing="base">
            <Divider />
            <BlockStack spacing="tight">
              <InlineLayout columns={["fill", "auto"]}>
                <Text emphasis="bold" size="medium">
                  Progress to {loyaltyData.tierProgress.nextTier}
                </Text>
                <Text emphasis="bold" appearance="accent">
                  {loyaltyData.tierProgress.percentage.toFixed(0)}%
                </Text>
              </InlineLayout>

              <Progress value={loyaltyData.tierProgress.percentage / 100} />

              <InlineLayout columns={["fill", "auto"]}>
                <Text size="small" appearance="subdued">
                  {loyaltyData.tierProgress.needed.toLocaleString()} more points
                  needed
                </Text>
                <Text size="small" appearance="subdued">
                  {loyaltyData.tierProgress.current.toLocaleString()} current
                </Text>
              </InlineLayout>
            </BlockStack>
          </BlockStack>
        )}

        {/* Tier Achievement Message - Enhanced */}
        {showTierProgress && !loyaltyData.tierProgress.nextTier && (
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

        {/* Tier Benefits */}
        {loyaltyData.tierBenefits.length > 0 && (
          <BlockStack spacing="tight">
            <Divider />
            <Text emphasis="bold" size="medium">
              Your {loyaltyData.tierName} Benefits
            </Text>
            <BlockStack spacing="extraTight">
              {loyaltyData.tierBenefits.slice(0, 3).map((benefit, index) => (
                <Text key={index} size="small" appearance="subdued">
                  ✓ {benefit}
                </Text>
              ))}
            </BlockStack>
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
          <Text size="small" appearance="subdued">
            🎯 Total Spend: ${loyaltyData.totalSpend.toLocaleString()}
          </Text>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
