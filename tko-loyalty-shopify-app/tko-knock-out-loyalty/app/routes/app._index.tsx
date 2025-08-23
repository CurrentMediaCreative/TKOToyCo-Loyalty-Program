// @ts-nocheck
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useActionData,
  Form,
  useFetcher,
} from "@remix-run/react";
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
import { syncAllOrdersSimple } from "../services/orderSync.server";
import { getTiers } from "../services/tier.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Use the optimized dashboard metrics service
    const dashboardResult = await getDashboardMetrics(admin);

    // Check if the service call was successful
    if (!dashboardResult.success || !dashboardResult.data) {
      throw new Error(
        dashboardResult.error || "Failed to load dashboard metrics",
      );
    }

    const dashboardData = dashboardResult.data;

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
    console.log("🔄 Starting simple order sync...");
    const syncResult = await syncAllOrdersSimple(admin);

    // Create detailed message based on sync results
    let message = "";
    if (syncResult.processedOrders === 0) {
      message = "No missing orders found - your store is fully synced!";
    } else {
      const details = [];
      details.push(`${syncResult.processedOrders} orders processed`);

      if (syncResult.fulfilledOrders > 0) {
        details.push(`${syncResult.fulfilledOrders} fulfilled orders`);
      }

      if (syncResult.pointsAwarded > 0) {
        details.push(`${syncResult.pointsAwarded} points awarded`);
      }

      if (syncResult.customersUpdated > 0) {
        details.push(`${syncResult.customersUpdated} customers updated`);
      }

      if (syncResult.errors > 0) {
        details.push(`${syncResult.errors} errors encountered`);
      }

      const duration = Math.round(syncResult.duration / 1000);
      message = `Smart sync completed in ${duration}s! ${details.join(", ")}.`;

      // Add note about remaining orders if applicable
      if (syncResult.totalOrders < 500 && syncResult.processedOrders === 500) {
        message +=
          " Note: Limited to 500 orders per session to prevent timeouts. Run sync again to process remaining orders.";
      }
    }

    return json({
      success: true,
      message,
      syncResult: {
        ...syncResult,
        duration: Math.round(syncResult.duration / 1000), // Convert to seconds for display
      },
    });
  } catch (error) {
    console.error("❌ Enhanced sync failed:", error);

    // Provide more helpful error messages
    let errorMessage = "Sync failed";
    if (error instanceof Error) {
      if (
        error.message.includes("timeout") ||
        error.message.includes("Timeout")
      ) {
        errorMessage =
          "Sync timed out - try again or contact support if this persists";
      } else if (
        error.message.includes("rate limit") ||
        error.message.includes("Rate limit")
      ) {
        errorMessage =
          "API rate limit reached - please wait a few minutes before trying again";
      } else if (
        error.message.includes("network") ||
        error.message.includes("Network")
      ) {
        errorMessage =
          "Network error - please check your connection and try again";
      } else {
        errorMessage = `Sync failed: ${error.message}`;
      }
    }

    return json(
      {
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
};

export default function Index() {
  const {
    stats,
    tierCounts,
    todayCompetitors,
    monthCompetitors,
    tiers,
    error,
  } = useLoaderData<typeof loader>() as any;
  const actionData = useActionData<typeof action>();

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [spendingFilter, setSpendingFilter] = useState<
    "month" | "year" | "total"
  >("month");

  // Store credit sync fetcher
  const storeCreditFetcher = useFetcher();
  const isStoreCreditSyncing = storeCreditFetcher.state === "submitting";

  // Shopify API test fetcher
  const shopifyTestFetcher = useFetcher();
  const isShopifyTesting = shopifyTestFetcher.state === "submitting";

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
    (
      <InlineStack key={`name-${customer.id}`} gap="200" align="start">
        <Text variant="bodyMd" as="span" fontWeight="semibold">
          {customer.name}
        </Text>
      </InlineStack>
    ) as any,
    (
      <Badge
        key={`tier-${customer.id}`}
        tone={getTierColor(customer.tier) as any}
        icon={getTierIcon(customer.tier)}
      >
        {customer.tier}
      </Badge>
    ) as any,
    (
      <Text
        key={`spent-${customer.id}`}
        variant="bodyMd"
        as="span"
        fontWeight="semibold"
      >
        ${customer.periodSpending.toFixed(2)}
      </Text>
    ) as any,
    (
      <Text key={`orders-${customer.id}`} variant="bodyMd" as="span">
        {customer.numberOfOrders || 0}
      </Text>
    ) as any,
    (
      <Button
        key={`view-${customer.id}`}
        variant="tertiary"
        size="slim"
        icon={<Icon source={ViewIcon} />}
        onClick={() => handleViewCustomer(customer)}
      >
        View
      </Button>
    ) as any,
  ]);

  // Format month competitors for DataTable
  const monthCompetitorRows = monthCompetitors.map((customer: any) => [
    (
      <InlineStack key={`name-${customer.id}`} gap="200" align="start">
        <Text variant="bodyMd" as="span" fontWeight="semibold">
          {customer.name}
        </Text>
      </InlineStack>
    ) as any,
    (
      <Badge
        key={`tier-${customer.id}`}
        tone={getTierColor(customer.tier) as any}
        icon={getTierIcon(customer.tier)}
      >
        {customer.tier}
      </Badge>
    ) as any,
    (
      <Text
        key={`spent-${customer.id}`}
        variant="bodyMd"
        as="span"
        fontWeight="semibold"
      >
        ${customer.periodSpending.toFixed(2)}
      </Text>
    ) as any,
    (
      <Text key={`orders-${customer.id}`} variant="bodyMd" as="span">
        {customer.numberOfOrders || 0}
      </Text>
    ) as any,
    (
      <Button
        key={`view-${customer.id}`}
        variant="tertiary"
        size="slim"
        icon={<Icon source={ViewIcon} />}
        onClick={() => handleViewCustomer(customer)}
      >
        View
      </Button>
    ) as any,
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
                <Tooltip content="Correct customer points by accounting for store credit usage">
                  <Button
                    variant="secondary"
                    icon={<Icon source={RefreshIcon} />}
                    loading={isStoreCreditSyncing}
                    onClick={() => {
                      storeCreditFetcher.submit(
                        {},
                        { method: "post", action: "/api/sync-store-credit" },
                      );
                    }}
                  >
                    Sync Store Credit
                  </Button>
                </Tooltip>
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
            <Text as="p">{actionData.message}</Text>
          </Banner>
        )}

        {/* Store Credit Sync Result Banner */}
        {storeCreditFetcher.data && (
          <Banner
            title={
              (storeCreditFetcher.data as any)?.success
                ? "Store Credit Sync Successful"
                : "Store Credit Sync Failed"
            }
            tone={
              (storeCreditFetcher.data as any)?.success ? "success" : "critical"
            }
            onDismiss={() => {}}
          >
            <BlockStack gap="100">
              <Text as="p">
                {String((storeCreditFetcher.data as any)?.message || "")}
              </Text>
              {(storeCreditFetcher.data as any)?.data && (
                <BlockStack gap="100">
                  <Text variant="bodySm" as="p">
                    Orders processed:{" "}
                    {(storeCreditFetcher.data as any)?.data?.ordersProcessed}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Customers updated:{" "}
                    {(storeCreditFetcher.data as any)?.data?.customersAffected}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Total store credit found: $
                    {(
                      storeCreditFetcher.data as any
                    )?.data?.totalStoreCreditFound?.toFixed(2) || "0.00"}
                  </Text>
                </BlockStack>
              )}
            </BlockStack>
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
                        <Text as="p">
                          The ring is quiet today. No purchases have been made
                          yet.
                        </Text>
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
                        <Text as="p">
                          The championship belt is waiting. No purchases this
                          month yet.
                        </Text>
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
