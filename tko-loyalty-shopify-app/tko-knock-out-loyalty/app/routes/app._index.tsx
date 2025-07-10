import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
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
  Banner,
} from "@shopify/polaris";
import { ViewIcon, RefreshIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { CustomerLoyaltyCard } from "../components/CustomerLoyaltyCard";
import {
  getDashboardMetrics,
  getDashboardCacheStatus,
} from "../services/dashboardMetrics.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";

  try {
    console.log(`Dashboard loader: forceRefresh=${forceRefresh}`);
    const startTime = Date.now();

    // Get dashboard metrics from cache or calculate fresh
    const dashboardData = await getDashboardMetrics(forceRefresh);
    const cacheStatus = await getDashboardCacheStatus();

    const loadTime = Date.now() - startTime;
    console.log(`Dashboard loaded in ${loadTime}ms`);

    // Format the data for the UI
    const stats = {
      totalCustomers: dashboardData.totalCustomers,
      activeCustomers: dashboardData.activeCustomers,
      totalSpent: dashboardData.totalSpent.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      monthSpent: dashboardData.monthSpent.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      yearSpent: dashboardData.yearSpent.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      currentYear: new Date().getFullYear(),
      topTier: "Reigning Champion",
      topTierCustomers: dashboardData.tierCounts["Reigning Champion"] || 0,
    };

    // Format top competitors for UI
    const topCompetitorsToday = dashboardData.topCompetitorsToday.map(
      (customer) => ({
        id: customer.id,
        name: customer.name,
        tier: customer.tier,
        spent: `$${customer.points.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        orders: 0, // We'll need to add this to the service if needed
      }),
    );

    const topCompetitorsMonth = dashboardData.topCompetitorsMonth.map(
      (customer) => ({
        id: customer.id,
        name: customer.name,
        tier: customer.tier,
        spent: `$${customer.points.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        orders: 0, // We'll need to add this to the service if needed
      }),
    );

    return json({
      stats,
      topCompetitorsToday,
      topCompetitorsMonth,
      tierCounts: dashboardData.tierCounts,
      cacheStatus,
      loadTime,
      lastCalculated: dashboardData.lastCalculated,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    // Return empty data in case of error
    const currentYear = new Date().getFullYear();
    return json({
      stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        totalSpent: "0.00",
        monthSpent: "0.00",
        yearSpent: "0.00",
        currentYear: currentYear,
        topTier: "Reigning Champion",
        topTierCustomers: 0,
      },
      topCompetitorsToday: [],
      topCompetitorsMonth: [],
      tierCounts: {},
      cacheStatus: {
        isCached: false,
        lastCalculated: null,
        cacheAge: null,
        isValid: false,
      },
      loadTime: 0,
      lastCalculated: new Date(),
    });
  }
};

export default function Index() {
  const {
    stats,
    topCompetitorsToday,
    topCompetitorsMonth,
    cacheStatus,
    loadTime,
    lastCalculated,
  } = useLoaderData<typeof loader>();

  // State for total spent filter and selected customer
  const [spendingFilter, setSpendingFilter] = useState<
    "month" | "year" | "total"
  >("month");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Handle opening and closing the customer loyalty card
  const handleViewCustomer = useCallback((customer: any) => {
    setSelectedCustomer(customer);
  }, []);

  const handleCloseCustomerCard = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  // Get the appropriate spending amount based on filter
  const displayedSpending =
    spendingFilter === "month"
      ? stats.monthSpent
      : spendingFilter === "year"
        ? stats.yearSpent
        : stats.totalSpent;

  // Recreate tier counts for the UI
  const tierCounts = {
    Featherweight: 0,
    Lightweight: 0,
    Welterweight: 0,
    Heavyweight: 0,
    "Reigning Champion": stats.topTierCustomers || 0,
  };

  const getTierColor = (tier: string) => {
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
  };

  const todayCompetitorRows = topCompetitorsToday.map((customer: any) => [
    <Text key={`name-${customer.id}`} variant="bodyMd" as="span">
      {customer.name}
    </Text>,
    <Badge
      key={`tier-${customer.id}`}
      tone={getTierColor(customer.tier) as any}
    >
      {customer.tier}
    </Badge>,
    <Text key={`spent-${customer.id}`} variant="bodyMd" as="span">
      {customer.spent}
    </Text>,
    <Text key={`orders-${customer.id}`} variant="bodyMd" as="span">
      {customer.orders}
    </Text>,
    <Button
      key={`view-${customer.id}`}
      variant="tertiary"
      icon={<Icon source={ViewIcon} />}
      onClick={() => handleViewCustomer(customer)}
    >
      View
    </Button>,
  ]);

  return (
    <Page fullWidth>
      {selectedCustomer && (
        <CustomerLoyaltyCard
          customer={selectedCustomer}
          onClose={handleCloseCustomerCard}
        />
      )}
      <BlockStack gap="500">
        {/* Cache Status Banner */}
        {cacheStatus && (
          <Banner
            title={
              cacheStatus.isValid
                ? `Data cached (${Math.floor((cacheStatus.cacheAge || 0) / 60)} min ago)`
                : "Data refreshed"
            }
            tone={cacheStatus.isValid ? "info" : "success"}
            action={{
              content: "Refresh Data",
              url: "?refresh=true",
            }}
          >
            <Text as="p" variant="bodySm">
              {cacheStatus.isValid
                ? `Dashboard loaded in ${loadTime}ms using cached data. Last calculated: ${new Date(lastCalculated).toLocaleTimeString()}`
                : `Dashboard refreshed in ${loadTime}ms with fresh data from Shopify.`}
            </Text>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    TKO Loyalty Program Dashboard
                  </Text>
                  <Button
                    variant="secondary"
                    icon={RefreshIcon}
                    url="?refresh=true"
                  >
                    Refresh Data
                  </Button>
                </InlineStack>
                <Text as="p" variant="bodyMd">
                  Welcome to your loyalty program dashboard. Here you can manage
                  your customers, tiers, rewards, and view key metrics.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Total Customers
                    </Text>
                    <Text variant="headingXl" as="p">
                      {stats.totalCustomers}
                    </Text>
                    <Text variant="bodySm" as="p">
                      {stats.activeCustomers} active in last 30 days
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text variant="headingSm" as="h3">
                        Total Spent
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
                    <Text variant="headingXl" as="p">
                      ${displayedSpending}
                    </Text>
                    <Text variant="bodySm" as="p">
                      {spendingFilter === "month"
                        ? "This month"
                        : spendingFilter === "year"
                          ? `Year ${stats.currentYear}`
                          : "All time"}
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Heavyweight Tier
                    </Text>
                    <Text variant="headingXl" as="p">
                      {tierCounts?.Heavyweight || 0}
                    </Text>
                    <Text variant="bodySm" as="p">
                      $25,000+ spent
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Reigning Champions
                    </Text>
                    <Text variant="headingXl" as="p">
                      {stats.topTierCustomers}
                    </Text>
                    <Text variant="bodySm" as="p">
                      Invite-only tier
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>
          </Layout.Section>

          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text as="h3" variant="headingMd">
                        Top 5 Competitors Today
                      </Text>
                      <Link to="/app/customers">
                        <Button variant="plain">View all customers</Button>
                      </Link>
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
                          "Customer",
                          "Tier",
                          "Spent Today",
                          "Orders",
                          "Actions",
                        ]}
                        rows={todayCompetitorRows}
                      />
                    ) : (
                      <EmptyState
                        heading="No competitors today"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>No customers have made purchases today.</p>
                      </EmptyState>
                    )}
                  </BlockStack>
                </Card>
              </Grid.Cell>

              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text as="h3" variant="headingMd">
                        Top 5 Competitors This Month
                      </Text>
                      <Link to="/app/customers">
                        <Button variant="plain">View all customers</Button>
                      </Link>
                    </InlineStack>
                    {topCompetitorsMonth.length > 0 ? (
                      <DataTable
                        columnContentTypes={[
                          "text",
                          "text",
                          "text",
                          "text",
                          "text",
                        ]}
                        headings={[
                          "Customer",
                          "Tier",
                          "Spent This Month",
                          "Orders",
                          "Actions",
                        ]}
                        rows={topCompetitorsMonth.map((customer: any) => [
                          <Text
                            key={`name-${customer.id}`}
                            variant="bodyMd"
                            as="span"
                          >
                            {customer.name}
                          </Text>,
                          <Badge
                            key={`tier-${customer.id}`}
                            tone={getTierColor(customer.tier) as any}
                          >
                            {customer.tier}
                          </Badge>,
                          <Text
                            key={`spent-${customer.id}`}
                            variant="bodyMd"
                            as="span"
                          >
                            {customer.spent}
                          </Text>,
                          <Text
                            key={`orders-${customer.id}`}
                            variant="bodyMd"
                            as="span"
                          >
                            {customer.orders}
                          </Text>,
                          <Button
                            key={`view-${customer.id}`}
                            variant="tertiary"
                            icon={<Icon source={ViewIcon} />}
                            onClick={() => handleViewCustomer(customer)}
                          >
                            View
                          </Button>,
                        ])}
                      />
                    ) : (
                      <EmptyState
                        heading="No competitors this month"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>No customers have made purchases this month.</p>
                      </EmptyState>
                    )}
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Quick Actions
                </Text>
                <Grid>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <Link to="/app/customers">
                      <Button fullWidth>Manage Customers</Button>
                    </Link>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <Link to="/app/tiers">
                      <Button fullWidth>Configure Tiers</Button>
                    </Link>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <Link to="/app/reports">
                      <Button fullWidth>View Reports</Button>
                    </Link>
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
