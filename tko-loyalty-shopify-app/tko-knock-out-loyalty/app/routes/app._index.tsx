import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Icon,
  Badge,
  Grid,
  DataTable,
  EmptyState,
  Box,
  Divider,
  ProgressBar,
  Tooltip,
  Banner,
} from "@shopify/polaris";
import {
  ViewIcon,
  PersonIcon,
  SettingsIcon,
  ChartVerticalIcon,
  StarFilledIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { CustomerLoyaltyCard } from "../components/CustomerLoyaltyCard";
import { serializeBigInt } from "../utils/serialization";
import { getDashboardMetrics } from "../services/dashboardMetrics.server";
import { syncMissingOrders } from "../services/orderSync.server";
import { getTiers } from "../services/tier.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Use the optimized dashboard metrics service
    const dashboardData = await getDashboardMetrics(admin);
    
    // Fetch all tiers with their benefits for the loyalty card
    const tiers = await getTiers();

    return json({
      stats: dashboardData.stats,
      tierCounts: dashboardData.tierCounts,
      todayCompetitors: serializeBigInt(dashboardData.todayCompetitors),
      monthCompetitors: serializeBigInt(dashboardData.monthCompetitors),
      tiers: serializeBigInt(tiers),
    });
  } catch (error) {
    console.error("Dashboard loader error:", error);
    return json({
      stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        totalSpent: "0.00",
        monthSpending: "0.00",
        yearSpending: "0.00",
        currentYear: new Date().getFullYear(),
        topTierCustomers: 0,
        customerGrowth: "0.0",
        spendingGrowth: "0.0",
      },
      tierCounts: {
        Featherweight: 0,
        Lightweight: 0,
        Welterweight: 0,
        Heavyweight: 0,
        "Reigning Champion": 0,
      },
      todayCompetitors: [],
      monthCompetitors: [],
      tiers: [],
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    console.log("🔄 Starting manual order sync...");
    const syncResult = await syncMissingOrders(admin);

    return json({
      success: true,
      message: `Sync completed! Processed ${syncResult.processedOrders} orders, awarded ${syncResult.pointsAwarded} points.`,
      syncResult,
    });
  } catch (error) {
    console.error("❌ Manual sync failed:", error);
    return json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
};

export default function Index() {
  const { stats, tierCounts, todayCompetitors, monthCompetitors, tiers, error } =
    useLoaderData<typeof loader>() as any;
  const actionData = useActionData<typeof action>();

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [spendingFilter, setSpendingFilter] = useState<
    "month" | "year" | "total"
  >("month");

  const handleViewCustomer = useCallback((customer: any) => {
    setSelectedCustomer(customer);
  }, []);

  const handleCloseCustomerModal = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  // Function to get tier color with boxing theme
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Reigning Champion":
        return "success";
      case "Heavyweight":
        return "critical";
      case "Welterweight":
        return "warning";
      case "Lightweight":
        return "info";
      default:
        return "subdued";
    }
  };

  // Function to get tier icon
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Reigning Champion":
        return StarFilledIcon;
      case "Heavyweight":
        return StarIcon;
      default:
        return undefined;
    }
  };

  // Calculate displayed spending based on filter
  const displayedSpending =
    spendingFilter === "month"
      ? stats.monthSpending
      : spendingFilter === "year"
        ? stats.yearSpending
        : stats.totalSpent;

  // Format today's competitors for DataTable
  const todayCompetitorRows = todayCompetitors.map((customer: any) => [
    <InlineStack key={`name-${customer.id}`} gap="200" align="start">
      <Text variant="bodyMd" as="span" fontWeight="semibold">
        {customer.name}
      </Text>
    </InlineStack>,
    <Badge
      key={`tier-${customer.id}`}
      tone={getTierColor(customer.tier) as any}
      icon={getTierIcon(customer.tier)}
    >
      {customer.tier}
    </Badge>,
    <Text
      key={`spent-${customer.id}`}
      variant="bodyMd"
      as="span"
      fontWeight="semibold"
    >
      ${customer.periodSpending.toFixed(2)}
    </Text>,
    <Text key={`orders-${customer.id}`} variant="bodyMd" as="span">
      {customer.numberOfOrders || 0}
    </Text>,
    <Button
      key={`view-${customer.id}`}
      variant="tertiary"
      size="slim"
      icon={<Icon source={ViewIcon} />}
      onClick={() => handleViewCustomer(customer)}
    >
      View
    </Button>,
  ]);

  // Format month competitors for DataTable
  const monthCompetitorRows = monthCompetitors.map((customer: any) => [
    <InlineStack key={`name-${customer.id}`} gap="200" align="start">
      <Text variant="bodyMd" as="span" fontWeight="semibold">
        {customer.name}
      </Text>
    </InlineStack>,
    <Badge
      key={`tier-${customer.id}`}
      tone={getTierColor(customer.tier) as any}
      icon={getTierIcon(customer.tier)}
    >
      {customer.tier}
    </Badge>,
    <Text
      key={`spent-${customer.id}`}
      variant="bodyMd"
      as="span"
      fontWeight="semibold"
    >
      ${customer.periodSpending.toFixed(2)}
    </Text>,
    <Text key={`orders-${customer.id}`} variant="bodyMd" as="span">
      {customer.numberOfOrders || 0}
    </Text>,
    <Button
      key={`view-${customer.id}`}
      variant="tertiary"
      size="slim"
      icon={<Icon source={ViewIcon} />}
      onClick={() => handleViewCustomer(customer)}
    >
      View
    </Button>,
  ]);

  if (error) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Error Loading Dashboard
                </Text>
                <Text as="p">{error}</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      {selectedCustomer && (
        <CustomerLoyaltyCard
          customer={selectedCustomer}
          tiers={tiers}
          onClose={handleCloseCustomerModal}
        />
      )}

      <BlockStack gap="400">
        {/* Header Section */}
        <Box paddingBlockEnd="200">
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text variant="headingXl" as="h1">
                  🥊 TKO Loyalty Program
                </Text>
                <Text variant="bodyLg" as="p" tone="subdued">
                  Admin Dashboard
                </Text>
              </BlockStack>
              <InlineStack gap="300">
                <Form method="post">
                  <Tooltip content="Sync missing orders from Shopify store">
                    <Button
                      submit
                      variant="secondary"
                      icon={<Icon source={RefreshIcon} />}
                      tone={actionData?.success ? "success" : undefined}
                    >
                      Sync With Store
                    </Button>
                  </Tooltip>
                </Form>
                <Tooltip content="Manage customer profiles and loyalty status">
                  <a href="/app/customers">
                    <Button
                      variant="primary"
                      icon={<Icon source={PersonIcon} />}
                    >
                      Manage Customers
                    </Button>
                  </a>
                </Tooltip>
                <Tooltip content="Configure tier settings and requirements">
                  <a href="/app/tiers">
                    <Button
                      variant="secondary"
                      icon={<Icon source={SettingsIcon} />}
                    >
                      Configure Tiers
                    </Button>
                  </a>
                </Tooltip>
                <Tooltip content="View detailed analytics and reports">
                  <a href="/app/reports">
                    <Button
                      variant="tertiary"
                      icon={<Icon source={ChartVerticalIcon} />}
                    >
                      View Reports
                    </Button>
                  </a>
                </Tooltip>
              </InlineStack>
            </InlineStack>
            <Divider />
          </BlockStack>
        </Box>

        {/* Sync Result Banner */}
        {actionData && (
          <Banner
            title={actionData.success ? "Sync Successful" : "Sync Failed"}
            tone={actionData.success ? "success" : "critical"}
            onDismiss={() => {}}
          >
            <p>{actionData.message}</p>
          </Banner>
        )}

        {/* Stats Cards */}
        <Layout>
          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="start">
                      <Text variant="headingSm" as="h3" tone="subdued">
                        Total Fighters
                      </Text>
                      <Icon source={PersonIcon} tone="subdued" />
                    </InlineStack>
                    <Text variant="heading2xl" as="p">
                      {stats.totalCustomers.toLocaleString()}
                    </Text>
                    <InlineStack gap="200" align="start">
                      <InlineStack gap="100" align="center">
                        <Icon
                          source={
                            parseFloat(stats.customerGrowth) >= 0
                              ? ArrowUpIcon
                              : ArrowDownIcon
                          }
                          tone={
                            parseFloat(stats.customerGrowth) >= 0
                              ? "success"
                              : "critical"
                          }
                        />
                        <Text
                          variant="bodySm"
                          as="span"
                          tone={
                            parseFloat(stats.customerGrowth) >= 0
                              ? "success"
                              : "critical"
                          }
                        >
                          {stats.customerGrowth}%
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" as="span" tone="subdued">
                        vs last month
                      </Text>
                    </InlineStack>
                    <Text variant="bodySm" as="p" tone="subdued">
                      {stats.activeCustomers} active in last 30 days
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="start">
                      <Text variant="headingSm" as="h3" tone="subdued">
                        Revenue
                      </Text>
                      <InlineStack gap="100">
                        <Button
                          size="micro"
                          variant={
                            spendingFilter === "month" ? "primary" : "tertiary"
                          }
                          onClick={() => setSpendingFilter("month")}
                        >
                          Month
                        </Button>
                        <Button
                          size="micro"
                          variant={
                            spendingFilter === "year" ? "primary" : "tertiary"
                          }
                          onClick={() => setSpendingFilter("year")}
                        >
                          {stats.currentYear.toString()}
                        </Button>
                        <Button
                          size="micro"
                          variant={
                            spendingFilter === "total" ? "primary" : "tertiary"
                          }
                          onClick={() => setSpendingFilter("total")}
                        >
                          Total
                        </Button>
                      </InlineStack>
                    </InlineStack>
                    <Text variant="heading2xl" as="p">
                      ${parseFloat(displayedSpending).toLocaleString()}
                    </Text>
                    {spendingFilter === "month" && (
                      <InlineStack gap="200" align="start">
                        <InlineStack gap="100" align="center">
                          <Icon
                            source={
                              parseFloat(stats.spendingGrowth) >= 0
                                ? ArrowUpIcon
                                : ArrowDownIcon
                            }
                            tone={
                              parseFloat(stats.spendingGrowth) >= 0
                                ? "success"
                                : "critical"
                            }
                          />
                          <Text
                            variant="bodySm"
                            as="span"
                            tone={
                              parseFloat(stats.spendingGrowth) >= 0
                                ? "success"
                                : "critical"
                            }
                          >
                            {stats.spendingGrowth}%
                          </Text>
                        </InlineStack>
                        <Text variant="bodySm" as="span" tone="subdued">
                          vs last month
                        </Text>
                      </InlineStack>
                    )}
                    <Text variant="bodySm" as="p" tone="subdued">
                      {spendingFilter === "month"
                        ? "This month's revenue"
                        : spendingFilter === "year"
                          ? `Year ${stats.currentYear} revenue`
                          : "All-time revenue"}
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="start">
                      <Text variant="headingSm" as="h3" tone="subdued">
                        Heavyweight Division
                      </Text>
                      <Icon source={StarIcon} tone="subdued" />
                    </InlineStack>
                    <Text variant="heading2xl" as="p">
                      {tierCounts?.Heavyweight || 0}
                    </Text>
                    <ProgressBar
                      progress={
                        ((tierCounts?.Heavyweight || 0) /
                          Math.max(stats.totalCustomers, 1)) *
                        100
                      }
                      size="small"
                    />
                    <Text variant="bodySm" as="p" tone="subdued">
                      $25,000+ lifetime spending
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="start">
                      <Text variant="headingSm" as="h3" tone="subdued">
                        Reigning Champions
                      </Text>
                      <Icon source={StarFilledIcon} tone="success" />
                    </InlineStack>
                    <Text variant="heading2xl" as="p">
                      {stats.topTierCustomers}
                    </Text>
                    <ProgressBar
                      progress={
                        ((stats.topTierCustomers || 0) /
                          Math.max(stats.totalCustomers, 1)) *
                        100
                      }
                      size="small"
                      tone="success"
                    />
                    <Text variant="bodySm" as="p" tone="subdued">
                      Invite-only elite tier
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>
          </Layout.Section>

          {/* Competitor Tables */}
          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">
                          🥇 Today's Top Contenders
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          Today's top contenders
                        </Text>
                      </BlockStack>
                      <a href="/app/customers">
                        <Button
                          variant="plain"
                          icon={<Icon source={ViewIcon} />}
                        >
                          View all fighters
                        </Button>
                      </a>
                    </InlineStack>
                    {todayCompetitorRows.length > 0 ? (
                      <DataTable
                        columnContentTypes={[
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                        ]}
                        headings={[
                          "Fighter",
                          "Weight Class",
                          "Total Spent",
                          "Orders",
                          "Actions",
                        ]}
                        rows={todayCompetitorRows}
                        hoverable
                      />
                    ) : (
                      <EmptyState
                        heading="No champions today"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>
                          The ring is quiet today. No purchases have been made
                          yet.
                        </p>
                      </EmptyState>
                    )}
                  </BlockStack>
                </Card>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd">
                          🏆 Monthly Top Contenders
                        </Text>
                        <Text variant="bodySm" as="p" tone="subdued">
                          This month's top contenders
                        </Text>
                      </BlockStack>
                      <a href="/app/customers">
                        <Button
                          variant="plain"
                          icon={<Icon source={ViewIcon} />}
                        >
                          View all fighters
                        </Button>
                      </a>
                    </InlineStack>
                    {monthCompetitorRows.length > 0 ? (
                      <DataTable
                        columnContentTypes={[
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                        ]}
                        headings={[
                          "Fighter",
                          "Weight Class",
                          "Total Spent",
                          "Orders",
                          "Actions",
                        ]}
                        rows={monthCompetitorRows}
                        hoverable
                      />
                    ) : (
                      <EmptyState
                        heading="No monthly champions"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>
                          The championship belt is waiting. No purchases this
                          month yet.
                        </p>
                      </EmptyState>
                    )}
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>
          </Layout.Section>

          {/* Tier Overview */}
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  🥊 Weight Class Distribution
                </Text>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" as="span">
                          Featherweight
                        </Text>
                        <Badge>{tierCounts.Featherweight}</Badge>
                      </InlineStack>
                      <ProgressBar
                        progress={
                          (tierCounts.Featherweight /
                            Math.max(stats.totalCustomers, 1)) *
                          100
                        }
                        size="small"
                      />
                    </BlockStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" as="span">
                          Lightweight
                        </Text>
                        <Badge tone="info">{tierCounts.Lightweight}</Badge>
                      </InlineStack>
                      <ProgressBar
                        progress={
                          (tierCounts.Lightweight /
                            Math.max(stats.totalCustomers, 1)) *
                          100
                        }
                        size="small"
                      />
                    </BlockStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" as="span">
                          Welterweight
                        </Text>
                        <Badge tone="warning">{tierCounts.Welterweight}</Badge>
                      </InlineStack>
                      <ProgressBar
                        progress={
                          (tierCounts.Welterweight /
                            Math.max(stats.totalCustomers, 1)) *
                          100
                        }
                        size="small"
                      />
                    </BlockStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" as="span">
                          Heavyweight
                        </Text>
                        <Badge tone="critical">{tierCounts.Heavyweight}</Badge>
                      </InlineStack>
                      <ProgressBar
                        progress={
                          (tierCounts.Heavyweight /
                            Math.max(stats.totalCustomers, 1)) *
                          100
                        }
                        size="small"
                      />
                    </BlockStack>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" as="span">
                          Reigning Champion
                        </Text>
                        <Badge tone="success">
                          {tierCounts["Reigning Champion"]}
                        </Badge>
                      </InlineStack>
                      <ProgressBar
                        progress={
                          (tierCounts["Reigning Champion"] /
                            Math.max(stats.totalCustomers, 1)) *
                          100
                        }
                        size="small"
                        tone="success"
                      />
                    </BlockStack>
                  </Grid.Cell>
                </Grid>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
