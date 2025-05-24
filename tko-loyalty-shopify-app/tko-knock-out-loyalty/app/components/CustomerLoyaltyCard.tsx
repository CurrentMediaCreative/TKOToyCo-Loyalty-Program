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
import { XIcon } from "@shopify/polaris-icons";

interface CustomerLoyaltyCardProps {
  customer: {
    id: string;
    name: string;
    tier: string;
    spent: string;
    orders: number;
    // Additional props that will be passed when available
    email?: string;
    phone?: string;
    lastOrderDate?: string;
    firstOrderDate?: string;
    monthlySpend?: number;
    yearlySpend?: number;
    totalSpend?: number;
    consistency?: number; // 0-100 score based on order frequency
  };
  onClose: () => void;
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

  // Calculate average monthly spend (placeholder for now)
  const getAverageMonthlySpend = useCallback(() => {
    if (customer.monthlySpend) return customer.monthlySpend.toFixed(2);

    // Placeholder calculation based on total spent and orders
    const totalSpent = parseFloat(customer.spent.replace("$", ""));
    // Assume average of 3 months per order as a rough estimate
    const estimatedMonths = Math.max(1, customer.orders * 3);
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
                      {customer.spent}
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

              <InlineStack align="end">
                <Button variant="primary">View Full Profile</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
