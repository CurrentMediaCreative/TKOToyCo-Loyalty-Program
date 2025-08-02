import React, { useCallback, useState } from "react";
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
import { XIcon, StarIcon, ExternalIcon, ViewIcon } from "@shopify/polaris-icons";

// Unified interface for customer data - works with both dashboard and customer page
interface CustomerData {
  // Core identification
  id: string; // Shopify GID format: gid://shopify/Customer/123456
  shopifyId?: string | number; // Raw Shopify ID: 123456
  name: string;
  firstName?: string;
  lastName?: string;

  // Contact information
  email?: string;
  phone?: string;

  // Spending and orders
  totalSpend?: number; // Raw number from database
  spent?: string; // Formatted string like "$1,234.56"
  spentAmount?: number; // Raw number
  numberOfOrders?: number;
  orders?: number; // Alternative field name

  // Points system - use database values ONLY
  spendPoints?: number; // From database
  bonusPoints?: number; // From database
  totalPoints?: number; // From database

  // Store credit tracking
  totalStoreCreditUsed?: number; // From database
  loyaltyEligibleSpend?: number; // From database

  // Tier information
  tier: string;

  // Dates
  lastOrderDate?: string;
  firstOrderDate?: string;
  createdAt?: string;
  shopifyCreatedAt?: string;

  // Additional data
  tags?: string[];
  consistency?: number; // 0-100 score

  // Period-specific data (for dashboard leaderboards)
  periodSpending?: number;

  // Legacy support
  amountSpent?: {
    amount: string;
  };
}

interface CustomerLoyaltyCardProps {
  customer: CustomerData;
  tiers: any[];
  onClose: () => void;
  onCrownReigningChampion?: (customerId: string) => void;
}

export function CustomerLoyaltyCard({
  customer,
  tiers,
  onClose,
}: CustomerLoyaltyCardProps) {
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  // Extract Shopify ID from various possible formats
  const getShopifyId = useCallback((): string => {
    // Try shopifyId field first
    if (customer.shopifyId) {
      return customer.shopifyId.toString();
    }

    // Extract from GID format: gid://shopify/Customer/123456
    if (customer.id && customer.id.includes("gid://shopify/Customer/")) {
      return customer.id.replace("gid://shopify/Customer/", "");
    }

    // Fallback to ID as-is
    return customer.id || "unknown";
  }, [customer]);

  // Get customer name with proper fallbacks
  const getCustomerName = useCallback((): string => {
    if (customer.name && customer.name !== "Unknown") {
      return customer.name;
    }

    const firstName = customer.firstName || "";
    const lastName = customer.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || "Unknown Customer";
  }, [customer]);

  // Get total spending amount with proper fallbacks and validation
  const getTotalSpending = useCallback((): {
    amount: number;
    formatted: string;
  } => {
    let amount = 0;

    // Priority order for spending data
    if (customer.totalSpend && customer.totalSpend > 0) {
      amount = customer.totalSpend;
    } else if (customer.spentAmount && customer.spentAmount > 0) {
      amount = customer.spentAmount;
    } else if (customer.spent) {
      // Parse formatted string like "$1,234.56"
      const parsed = parseFloat(customer.spent.replace(/[$,]/g, ""));
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    } else if (customer.amountSpent?.amount) {
      const parsed = parseFloat(customer.amountSpent.amount);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
      }
    }

    return {
      amount,
      formatted: `$${amount.toFixed(2)}`,
    };
  }, [customer]);

  // Get order count with fallbacks
  const getOrderCount = useCallback((): number => {
    return customer.numberOfOrders || customer.orders || 0;
  }, [customer]);

  // Get points data - just use database values directly, no calculations
  const getPointsData = useCallback(() => {
    return {
      spendPoints: customer.spendPoints || 0,
      bonusPoints: customer.bonusPoints || 0,
      totalPoints: customer.totalPoints || 0,
      isValid: true, // Always valid since we're using database values
    };
  }, [customer]);

  // Calculate average monthly spend with realistic estimation
  const getAverageMonthlySpend = useCallback((): string => {
    const { amount: totalSpent } = getTotalSpending();
    const orderCount = getOrderCount();

    if (totalSpent === 0) return "0.00";

    // Estimate active months based on order frequency
    // Assume minimum 1 month, maximum 24 months
    // More orders = longer customer relationship
    const estimatedMonths = Math.min(
      24,
      Math.max(1, Math.ceil(orderCount / 2)),
    );
    const monthlyAverage = totalSpent / estimatedMonths;

    return monthlyAverage.toFixed(2);
  }, [getTotalSpending, getOrderCount]);

  // Get loyalty level nickname based on tier and consistency
  const getLoyaltyLevel = useCallback((): string => {
    const tier = customer.tier || "Featherweight";
    const consistency = customer.consistency;

    // If we have consistency data, use more specific nicknames
    if (consistency !== undefined) {
      if (consistency >= 90) return "The Undisputed";
      if (consistency >= 80) return "The Knockout King";
      if (consistency >= 70) return "The Champion";
      if (consistency >= 60) return "The Contender";
      if (consistency >= 50) return "The Prospect";
      if (consistency >= 40) return "The Challenger";
      if (consistency >= 30) return "The Slugger";
      if (consistency >= 20) return "The Underdog";
      return "The Rookie";
    }

    // Default nicknames based on tier
    switch (tier) {
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
  }, [customer]);

  // Get tier color for badge
  const getTierColor = useCallback((tier: string) => {
    switch (tier) {
      case "Reigning Champion":
        return "success";
      case "Heavyweight":
        return "critical";
      case "Welterweight":
        return "warning";
      case "Lightweight":
        return "info";
      case "Featherweight":
        return "subdued";
      default:
        return "subdued";
    }
  }, []);

  // Get tier benefits for the customer's current tier
  const getTierBenefits = useCallback(() => {
    if (!tiers || tiers.length === 0) {
      console.log("No tiers available");
      return [];
    }
    
    console.log("Customer tier:", customer.tier);
    console.log("Available tiers:", tiers.map(t => t.name));
    
    // Normalize tier names by removing emojis and extra spaces
    const normalizeTierName = (name: string) => 
      name.replace(/[^\w\s]/gi, '').trim().toLowerCase();
    
    const customerTierNormalized = normalizeTierName(customer.tier || '');
    
    // Find the tier that matches the customer's tier
    const matchingTier = tiers.find(tier => {
      const tierNameNormalized = normalizeTierName(tier.name || '');
      return tierNameNormalized === customerTierNormalized;
    });
    
    console.log("Matching tier found:", matchingTier?.name);
    console.log("Benefits:", matchingTier?.benefits);
    
    if (!matchingTier || !matchingTier.benefits || matchingTier.benefits.length === 0) {
      console.log("No matching tier or benefits found");
      return [];
    }
    
    return matchingTier.benefits.map((benefit: any) => benefit.name);
  }, [tiers, customer.tier]);

  // Check if it's customer's birthday (for birthday gift highlighting)
  const isBirthday = useCallback((): boolean => {
    // This would need to be implemented with actual customer birthday data
    // For now, return false as we don't have birthday data in the current schema
    return false;
  }, []);

  // Categorize benefits into purchase-relevant and other
  const categorizeBenefits = useCallback(() => {
    const allBenefits = getTierBenefits();
    const isCustomerBirthday = isBirthday();
    
    const purchaseRelevant = allBenefits.filter((benefit: string) => {
      const lowerBenefit = benefit.toLowerCase();
      return (
        lowerBenefit.includes('discount') ||
        lowerBenefit.includes('points per $1') ||
        lowerBenefit.includes('x points') ||
        lowerBenefit.includes('1.25x') ||
        lowerBenefit.includes('1.5x') ||
        lowerBenefit.includes('2x') ||
        lowerBenefit.includes('singles') ||
        lowerBenefit.includes('sealed') ||
        lowerBenefit.includes('supplies') ||
        lowerBenefit.includes('toys') ||
        lowerBenefit.includes('board games') ||
        lowerBenefit.includes('pricing') ||
        lowerBenefit.includes('price') ||
        (isCustomerBirthday && lowerBenefit.includes('birthday'))
      );
    });
    
    const otherBenefits = allBenefits.filter((benefit: string) => {
      const lowerBenefit = benefit.toLowerCase();
      return !(
        lowerBenefit.includes('discount') ||
        lowerBenefit.includes('points per $1') ||
        lowerBenefit.includes('x points') ||
        lowerBenefit.includes('1.25x') ||
        lowerBenefit.includes('1.5x') ||
        lowerBenefit.includes('2x') ||
        lowerBenefit.includes('singles') ||
        lowerBenefit.includes('sealed') ||
        lowerBenefit.includes('supplies') ||
        lowerBenefit.includes('toys') ||
        lowerBenefit.includes('board games') ||
        lowerBenefit.includes('pricing') ||
        lowerBenefit.includes('price') ||
        (isCustomerBirthday && lowerBenefit.includes('birthday'))
      );
    });
    
    return { purchaseRelevant, otherBenefits };
  }, [getTierBenefits, isBirthday]);

  // Build correct Shopify admin URL
  const getShopifyAdminUrl = useCallback((): string => {
    const shopifyId = getShopifyId();
    // Use the correct format: https://admin.shopify.com/store/STORE_ID/customers/CUSTOMER_ID
    return `https://admin.shopify.com/store/82cc2c/customers/${shopifyId}`;
  }, [getShopifyId]);

  // Get computed values
  const customerName = getCustomerName();
  const { amount: totalSpent, formatted: formattedSpent } = getTotalSpending();
  const orderCount = getOrderCount();
  const { spendPoints, bonusPoints, totalPoints, isValid } = getPointsData();
  const avgMonthlySpend = getAverageMonthlySpend();
  const loyaltyLevel = getLoyaltyLevel();
  const shopifyAdminUrl = getShopifyAdminUrl();
  const { purchaseRelevant, otherBenefits } = categorizeBenefits();

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
              {customerName}
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
                {!isValid && <Badge tone="critical">Data Issue</Badge>}
              </InlineStack>

              <Divider />

              <Grid>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Total Spent (Shopify)
                    </Text>
                    <Text variant="headingMd" as="p">
                      {formattedSpent}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Store Credit Used
                    </Text>
                    <Text variant="headingMd" as="p">
                      ${(customer.totalStoreCreditUsed || 0).toFixed(2)}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Loyalty-Eligible Spending
                    </Text>
                    <Text variant="headingMd" as="p">
                      ${(customer.loyaltyEligibleSpend || Math.max(0, totalSpent - (customer.totalStoreCreditUsed || 0))).toFixed(2)}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Total Orders
                    </Text>
                    <Text variant="headingMd" as="p">
                      {orderCount}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
              </Grid>

              <Divider />

              <Grid>
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
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Spend Points
                    </Text>
                    <Text variant="headingMd" as="p">
                      {Math.floor(customer.loyaltyEligibleSpend || Math.max(0, totalSpent - (customer.totalStoreCreditUsed || 0))).toLocaleString()}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h4">
                      Points Calculation
                    </Text>
                    <Text variant="headingMd" as="p">
                      1 point per $1 spent
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
                      {spendPoints.toLocaleString()}
                    </Text>
                    {!isValid && (
                      <Text variant="bodySm" as="p" tone="critical">
                        Expected: ~{Math.floor(totalSpent).toLocaleString()}
                      </Text>
                    )}
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  <BlockStack gap="200">
                    <Text variant="bodySm" as="p">
                      Bonus Points
                    </Text>
                    <Text variant="headingMd" as="p">
                      {bonusPoints.toLocaleString()}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  <BlockStack gap="200">
                    <Text variant="bodySm" as="p">
                      Total Points
                    </Text>
                    <Text variant="headingMd" as="p" fontWeight="bold">
                      {totalPoints.toLocaleString()}
                    </Text>
                  </BlockStack>
                </Grid.Cell>
              </Grid>

              <Divider />

              {/* Tier Benefits Section */}
              {(purchaseRelevant.length > 0 || getTierBenefits().length > 0) && (
                <>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text variant="headingSm" as="h4">
                        {purchaseRelevant.length > 0 ? "Purchase Benefits" : "Tier Benefits"}
                      </Text>
                      {otherBenefits.length > 0 && (
                        <Button
                          variant="plain"
                          icon={<Icon source={ViewIcon} />}
                          onClick={() => setShowAllBenefits(true)}
                        >
                          See All Benefits
                        </Button>
                      )}
                    </InlineStack>
                    <BlockStack gap="100">
                      {purchaseRelevant.length > 0 
                        ? purchaseRelevant.map((benefit: string, index: number) => (
                            <Text key={index} variant="bodyMd" as="p">
                              • {benefit}
                            </Text>
                          ))
                        : getTierBenefits().map((benefit: string, index: number) => (
                            <Text key={index} variant="bodyMd" as="p">
                              • {benefit}
                            </Text>
                          ))
                      }
                    </BlockStack>
                  </BlockStack>
                  <Divider />
                </>
              )}

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
                <Text variant="bodyMd" as="p">
                  <strong>Customer Since:</strong>{" "}
                  {customer.shopifyCreatedAt
                    ? new Date(customer.shopifyCreatedAt).toLocaleDateString()
                    : customer.firstOrderDate
                      ? new Date(customer.firstOrderDate).toLocaleDateString()
                      : customer.createdAt
                        ? new Date(customer.createdAt).toLocaleDateString()
                        : "Unknown"}
                </Text>
              </BlockStack>

              <InlineStack align="end" gap="200">
                {customer.tier !== "Reigning Champion" && (
                  <Button
                    variant="secondary"
                    icon={<Icon source={StarIcon} />}
                    onClick={() => {
                      // This would trigger the Crown Reigning Champion functionality
                      alert(`Crown ${customerName} as Reigning Champion?`);
                    }}
                  >
                    Crown Reigning Champion
                  </Button>
                )}
                <Button
                  variant="primary"
                  icon={<Icon source={ExternalIcon} />}
                  url={shopifyAdminUrl}
                  target="_blank"
                >
                  View in Shopify Admin
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </Modal.Section>

      {/* Secondary Modal for All Tier Benefits */}
      {showAllBenefits && (
        <Modal
          open={showAllBenefits}
          onClose={() => setShowAllBenefits(false)}
          title={`All ${customer.tier} Benefits`}
          primaryAction={{
            content: "Close",
            onAction: () => setShowAllBenefits(false),
          }}
        >
          <Modal.Section>
            <BlockStack gap="300">
              <Text variant="bodyMd" as="p">
                Complete list of benefits for the {customer.tier} tier:
              </Text>
              
              {purchaseRelevant.length > 0 && (
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h4">
                    Purchase Benefits
                  </Text>
                  <BlockStack gap="100">
                    {purchaseRelevant.map((benefit: string, index: number) => (
                      <Text key={index} variant="bodyMd" as="p">
                        • {benefit}
                      </Text>
                    ))}
                  </BlockStack>
                </BlockStack>
              )}

              {otherBenefits.length > 0 && (
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h4">
                    Additional Benefits
                  </Text>
                  <BlockStack gap="100">
                    {otherBenefits.map((benefit: string, index: number) => (
                      <Text key={index} variant="bodyMd" as="p">
                        • {benefit}
                      </Text>
                    ))}
                  </BlockStack>
                </BlockStack>
              )}

              {purchaseRelevant.length === 0 && otherBenefits.length === 0 && (
                <Text variant="bodyMd" as="p" tone="subdued">
                  No specific benefits configured for this tier.
                </Text>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Modal>
  );
}
