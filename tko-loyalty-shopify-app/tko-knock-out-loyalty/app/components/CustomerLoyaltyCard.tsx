import React, { useCallback } from "react";
import {
  Modal,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  Icon,
  Grid,
  Divider,
} from "@shopify/polaris";
import { XIcon, StarIcon, ExternalIcon } from "@shopify/polaris-icons";

interface CustomerLoyaltyCardProps {
  customer: {
    id: string;
    name: string;
    tier: string;
    spent?: string;
    orders: number;
    // Points-related props
    spendPoints?: number;
    bonusPoints?: number;
    totalPoints?: number;
    // Additional props that will be passed when available
    email?: string;
    phone?: string;
    lastOrderDate?: string;
    firstOrderDate?: string;
    monthlySpend?: number;
    yearlySpend?: number;
    totalSpend?: number;
    spentAmount?: number; // Raw numeric amount
    consistency?: number; // 0-100 score based on order frequency
  };
  onClose: () => void;
  onCrownReigningChampion?: (customerId: string) => void;
}

export function CustomerLoyaltyCard({
  customer,
  onClose,
}: CustomerLoyaltyCardProps) {
  // Calculate loyalty level based on consistency and spending
  const getLoyaltyLevel = useCallback(() => {
    // If we don't have consistency data, use a placeholder based on tier
    if (!customer.consistency) {
      switch (customer.tier) {
        case "Reigning Champion":
          return "The Undisputed";
        case "Heavyweight":
          return "The Knockout King";
        case "Welterweight":
          return "The Contender";
        case "Lightweight":
          return "The Prospect";
        case "Featherweight":
          return "The Rookie";
        default:
          return "The Challenger";
      }
    }

    // When we have real consistency data, use more specific nicknames
    if (customer.consistency >= 90) return "The Undisputed";
    if (customer.consistency >= 80) return "The Knockout King";
    if (customer.consistency >= 70) return "The Champion";
    if (customer.consistency >= 60) return "The Contender";
    if (customer.consistency >= 50) return "The Prospect";
    if (customer.consistency >= 40) return "The Challenger";
    if (customer.consistency >= 30) return "The Slugger";
    if (customer.consistency >= 20) return "The Underdog";
    return "The Rookie";
  }, [customer]);

  // Get tier color
  const getTierColor = useCallback((tier: string) => {
    switch (tier) {
      case "Reigning Champion":
        return "success";
      case "Heavyweight":
        return "info";
      case "Welterweight":
        return "warning";
      case "Lightweight":
        return "attention";
      case "Featherweight":
        return "new";
      default:
        return "new";
    }
  }, []);

  // Calculate average monthly spend - use database field or reasonable calculation
  const getAverageMonthlySpend = useCallback(() => {
    if (customer.monthlySpend) return customer.monthlySpend.toFixed(2);

    // Safe parsing of spent amount with fallback
    let totalSpent = 0;
    if (customer.spent) {
      if (typeof customer.spent === "string") {
        totalSpent = parseFloat(
          customer.spent.replace("$", "").replace(",", ""),
        );
      } else if (typeof customer.spent === "number") {
        totalSpent = customer.spent;
      }
    } else if (customer.spentAmount) {
      totalSpent = customer.spentAmount;
    } else if (customer.totalSpend) {
      totalSpent = customer.totalSpend;
    }

    // If we have no spending data, return 0
    if (totalSpent === 0) return "0.00";

    // Use a more reasonable estimate: assume customer has been active for at least 1 month
    // and at most 24 months (2 years), with orders spread reasonably
    const minMonths = 1;
    const maxMonths = 24;
    const estimatedMonths = Math.min(
      maxMonths,
      Math.max(minMonths, customer.orders || 1),
    );

    return (totalSpent / estimatedMonths).toFixed(2);
  }, [customer]);

  const loyaltyLevel = getLoyaltyLevel();
  const avgMonthlySpend = getAverageMonthlySpend();

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Customer Loyalty Card"
      titleHidden
    >
      <Modal.Section>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingLg" as="h2">
              {customer.name}
            </Text>
            <Button
              variant="plain"
              icon={<Icon source={XIcon} />}
              onClick={onClose}
              accessibilityLabel="Close"
            />
          </InlineStack>

          <Card>
            <BlockStack gap="400">
              <InlineStack align="center" gap="200">
                <Badge tone={getTierColor(customer.tier) as any}>
                  {customer.tier}
                </Badge>
                <Text variant="headingMd" as="h3" fontWeight="semibold">
                  "{loyaltyLevel}"
                </Text>
              </InlineStack>

              <Divider />

              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Total Spent
                    </Text>
                    <Text variant="headingMd" as="p">
                      {customer.spent ||
                        (customer.spentAmount
                          ? `$${customer.spentAmount.toFixed(2)}`
                          : "$0.00")}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Total Orders
                    </Text>
                    <Text variant="headingMd" as="p">
                      {customer.orders}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Avg. Monthly Spend
                    </Text>
                    <Text variant="headingMd" as="p">
                      ${avgMonthlySpend}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Loyalty Status
                    </Text>
                    <Text variant="headingMd" as="p">
                      {customer.consistency
                        ? `${customer.consistency}%`
                        : "Active"}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
              </Grid>

              <Divider />

              <Text variant="headingSm" as="h4">
                Loyalty Points
              </Text>
              <Grid>
                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  <BlockStack gap="200">
                    <Text variant="bodySm" as="p">
                      Spend Points
                    </Text>
                    <Text variant="headingMd" as="p">
                      {customer.spendPoints !== undefined
                        ? customer.spendPoints.toLocaleString()
                        : "N/A"}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  <BlockStack gap="200">
                    <Text variant="bodySm" as="p">
                      Bonus Points
                    </Text>
                    <Text variant="headingMd" as="p">
                      {customer.bonusPoints !== undefined
                        ? customer.bonusPoints.toLocaleString()
                        : "0"}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  <BlockStack gap="200">
                    <Text variant="bodySm" as="p">
                      Total Points
                    </Text>
                    <Text variant="headingMd" as="p" fontWeight="bold">
                      {customer.totalPoints !== undefined
                        ? customer.totalPoints.toLocaleString()
                        : customer.spendPoints !== undefined &&
                            customer.bonusPoints !== undefined
                          ? (
                              customer.spendPoints + customer.bonusPoints
                            ).toLocaleString()
                          : "N/A"}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
              </Grid>

              <Divider />

              <BlockStack gap="200">
                <Text variant="headingSm" as="h4">
                  Customer Details
                </Text>
                {customer.email && (
                  <Text variant="bodyMd" as="p">
                    Email: {customer.email}
                  </Text>
                )}
                {customer.phone && (
                  <Text variant="bodyMd" as="p">
                    Phone: {customer.phone}
                  </Text>
                )}
                {customer.lastOrderDate && (
                  <Text variant="bodyMd" as="p">
                    Last Order: {customer.lastOrderDate}
                  </Text>
                )}
                {customer.firstOrderDate && (
                  <Text variant="bodyMd" as="p">
                    First Order: {customer.firstOrderDate}
                  </Text>
                )}
              </BlockStack>

              <InlineStack align="end" gap="200">
                {customer.tier !== "Reigning Champion" && (
                  <Button
                    variant="secondary"
                    icon={<Icon source={StarIcon} />}
                    onClick={() => {
                      // This would trigger the Crown Reigning Champion functionality
                      // For now, we'll show an alert
                      alert(`Crown ${customer.name} as Reigning Champion?`);
                    }}
                  >
                    Crown Reigning Champion
                  </Button>
                )}
                <Button
                  variant="primary"
                  icon={<Icon source={ExternalIcon} />}
                  url={`https://admin.shopify.com/store/82cc2c/customers/${customer.id}`}
                  target="_blank"
                >
                  View in Shopify Admin
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
