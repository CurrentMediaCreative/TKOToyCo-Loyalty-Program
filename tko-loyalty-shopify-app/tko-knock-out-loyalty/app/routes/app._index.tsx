import type { LoaderFunctionArgs } from "@remix-run/node";
import { defer } from "@remix-run/node";
import { useLoaderData, Link, Await } from "@remix-run/react";
import { useState, useCallback, Suspense } from "react";
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
  SkeletonBodyText,
  SkeletonDisplayText,
} from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { CustomerLoyaltyCard } from "../components/CustomerLoyaltyCard";

// Fast function to get basic stats and top competitors
async function getQuickDashboardData(admin: any) {
  try {
    // Get first page of customers sorted by spending (top spenders)
    const response: any = await admin.graphql(
      `#graphql
        query GetTopCustomers {
          customers(first: 50, sortKey: TOTAL_SPENT, reverse: true) {
            edges {
              node {
                id
                firstName
                lastName
                email
                amountSpent {
                  amount
                }
                numberOfOrders
                tags
                lastOrder {
                  createdAt
                }
                orders(first: 10, sortKey: CREATED_AT, reverse: true) {
                  edges {
                    node {
                      id
                      createdAt
                      totalPriceSet {
                        shopMoney {
                          amount
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
    );

    const responseJson: any = await response.json();
    const customersData: any = responseJson.data?.customers;

    if (!customersData) {
      throw new Error("No customer data returned from API");
    }

    const customers = customersData.edges.map((edge: any) => edge.node);

    // Calculate basic stats from top 50 customers
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    today.setHours(0, 0, 0, 0);

    // Process customers to add tier and spending calculations
    const processedCustomers = customers.map((customer: any) => {
      const spent = parseFloat(customer.amountSpent?.amount || "0");
      let tier = "Featherweight";

      // Check if customer has "Reigning Champion" tag
      const hasReigningChampionTag =
        customer.tags &&
        customer.tags.some(
          (tag: string) => tag.toLowerCase() === "reigning champion",
        );

      if (hasReigningChampionTag) {
        tier = "Reigning Champion";
      } else if (spent >= 25000) {
        tier = "Heavyweight";
      } else if (spent >= 5000) {
        tier = "Welterweight";
      } else if (spent >= 1500) {
        tier = "Lightweight";
      }

      // Calculate today's and month's spending
      const orders =
        customer.orders?.edges?.map((edge: any) => edge.node) || [];

      const todaySpending = orders.reduce((sum: number, order: any) => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= today) {
          return (
            sum + parseFloat(order.totalPriceSet?.shopMoney?.amount || "0")
          );
        }
        return sum;
      }, 0);

      const monthSpending = orders.reduce((sum: number, order: any) => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= firstDayOfMonth) {
          return (
            sum + parseFloat(order.totalPriceSet?.shopMoney?.amount || "0")
          );
        }
        return sum;
      }, 0);

      return {
        ...customer,
        tier,
        todaySpending,
        monthSpending,
      };
    });

    // Get top 5 competitors today
    const topCompetitorsToday = [...processedCustomers]
      .filter((customer) => customer.todaySpending > 0)
      .sort((a, b) => b.todaySpending - a.todaySpending)
      .slice(0, 5)
      .map((customer: any) => ({
        id: customer.id.replace("gid://shopify/Customer/", ""),
        name:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Unknown",
        tier: customer.tier,
        spent: `$${customer.todaySpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        orders: customer.numberOfOrders || 0,
      }));

    // Get top 5 competitors this month
    const topCompetitorsMonth = [...processedCustomers]
      .filter((customer) => customer.monthSpending > 0)
      .sort((a, b) => b.monthSpending - a.monthSpending)
      .slice(0, 5)
      .map((customer: any) => ({
        id: customer.id.replace("gid://shopify/Customer/", ""),
        name:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Unknown",
        tier: customer.tier,
        spent: `$${customer.monthSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        orders: customer.numberOfOrders || 0,
      }));

    // Count reigning champions from top customers
    const reigningChampions = processedCustomers.filter(
      (customer: any) => customer.tier === "Reigning Champion",
    ).length;

    // Estimate total customers (we'll get exact count in background)
    const estimatedTotalCustomers =
      customers.length >= 50 ? "50+" : customers.length.toString();

    return {
      topCompetitorsToday,
      topCompetitorsMonth,
      estimatedStats: {
        totalCustomers: estimatedTotalCustomers,
        reigningChampions,
        currentYear: today.getFullYear(),
      },
    };
  } catch (error) {
    console.error("Error fetching quick dashboard data:", error);
    return {
      topCompetitorsToday: [],
      topCompetitorsMonth: [],
      estimatedStats: {
        totalCustomers: "0",
        reigningChampions: 0,
        currentYear: new Date().getFullYear(),
      },
    };
  }
}

// Slow function to get complete stats (runs in background)
async function getCompleteStats(admin: any) {
  try {
    // This is the heavy operation that runs in background
    let allCustomers: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let pageCount = 0;
    const MAX_PAGES = 20;
    const PER_PAGE = 250;

    while (hasNextPage && pageCount < MAX_PAGES) {
      const queryVariables: {
        first: number;
        after?: string;
        sortKey: string;
        reverse: boolean;
      } = cursor
        ? {
            first: PER_PAGE,
            after: cursor,
            sortKey: "UPDATED_AT",
            reverse: true,
          }
        : { first: PER_PAGE, sortKey: "UPDATED_AT", reverse: true };

      const response: any = await admin.graphql(
        `#graphql
          query GetAllCustomers($first: Int!, $after: String, $sortKey: CustomerSortKeys!, $reverse: Boolean!) {
            customers(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
              edges {
                node {
                  id
                  firstName
                  lastName
                  amountSpent {
                    amount
                  }
                  numberOfOrders
                  tags
                  lastOrder {
                    createdAt
                  }
                  orders(first: 20, sortKey: CREATED_AT, reverse: true) {
                    edges {
                      node {
                        createdAt
                        totalPriceSet {
                          shopMoney {
                            amount
                          }
                        }
                      }
                    }
                  }
                }
                cursor
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }`,
        { variables: queryVariables },
      );

      const responseJson: any = await response.json();
      const customersData: any = responseJson.data?.customers;

      if (!customersData) break;

      const pageCustomers = customersData.edges.map((edge: any) => edge.node);
      allCustomers = [...allCustomers, ...pageCustomers];

      hasNextPage = customersData.pageInfo.hasNextPage;
      cursor = customersData.pageInfo.endCursor;
      pageCount++;
    }

    // Calculate complete stats
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalSpent = allCustomers.reduce(
      (sum: number, customer: any) =>
        sum + parseFloat(customer.amountSpent?.amount || "0"),
      0,
    );

    let monthSpending = 0;
    let yearSpending = 0;

    allCustomers.forEach((customer: any) => {
      const orders =
        customer.orders?.edges?.map((edge: any) => edge.node) || [];
      orders.forEach((order: any) => {
        const orderDate = new Date(order.createdAt);
        const orderAmount = parseFloat(
          order.totalPriceSet?.shopMoney?.amount || "0",
        );

        if (orderDate >= firstDayOfMonth) {
          monthSpending += orderAmount;
        }
        if (orderDate >= firstDayOfYear) {
          yearSpending += orderAmount;
        }
      });
    });

    const activeCustomers = allCustomers.filter((customer: any) => {
      if (!customer.lastOrder) return false;
      const orderDate = new Date(customer.lastOrder.createdAt);
      return orderDate >= thirtyDaysAgo;
    }).length;

    // Count tier distribution
    const tierCounts = { Heavyweight: 0, "Reigning Champion": 0 };
    allCustomers.forEach((customer: any) => {
      const spent = parseFloat(customer.amountSpent?.amount || "0");
      const hasReigningChampionTag = customer.tags?.some(
        (tag: string) => tag.toLowerCase() === "reigning champion",
      );

      if (hasReigningChampionTag) {
        tierCounts["Reigning Champion"]++;
      } else if (spent >= 25000) {
        tierCounts["Heavyweight"]++;
      }
    });

    return {
      totalCustomers: allCustomers.length,
      activeCustomers,
      totalSpent: totalSpent.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      monthSpent: monthSpending.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      yearSpent: yearSpending.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      currentYear: today.getFullYear(),
      heavyweightCustomers: tierCounts.Heavyweight,
      reigningChampions: tierCounts["Reigning Champion"],
    };
  } catch (error) {
    console.error("Error fetching complete stats:", error);
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Get quick data immediately
  const quickData = await getQuickDashboardData(admin);

  // Defer the heavy stats calculation
  const completeStatsPromise = getCompleteStats(admin);

  return defer({
    quickData,
    completeStats: completeStatsPromise,
  });
};

// Loading skeleton component
function StatsSkeleton() {
  return (
    <Grid>
      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
        <Card>
          <BlockStack gap="200">
            <SkeletonDisplayText size="small" />
            <SkeletonDisplayText size="large" />
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </Card>
      </Grid.Cell>
      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
        <Card>
          <BlockStack gap="200">
            <SkeletonDisplayText size="small" />
            <SkeletonDisplayText size="large" />
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </Card>
      </Grid.Cell>
      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
        <Card>
          <BlockStack gap="200">
            <SkeletonDisplayText size="small" />
            <SkeletonDisplayText size="large" />
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </Card>
      </Grid.Cell>
      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
        <Card>
          <BlockStack gap="200">
            <SkeletonDisplayText size="small" />
            <SkeletonDisplayText size="large" />
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </Card>
      </Grid.Cell>
    </Grid>
  );
}

// Complete stats component
function CompleteStatsGrid({
  completeStats,
  spendingFilter,
  setSpendingFilter,
}: any) {
  if (!completeStats) {
    return <StatsSkeleton />;
  }

  const displayedSpending =
    spendingFilter === "month"
      ? completeStats.monthSpent
      : spendingFilter === "year"
        ? completeStats.yearSpent
        : completeStats.totalSpent;

  return (
    <Grid>
      <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
        <Card>
          <BlockStack gap="200">
            <Text variant="headingSm" as="h3">
              Total Customers
            </Text>
            <Text variant="headingXl" as="p">
              {completeStats.totalCustomers}
            </Text>
            <Text variant="bodySm" as="p">
              {completeStats.activeCustomers} active in last 30 days
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
                  variant={spendingFilter === "month" ? "primary" : "tertiary"}
                  onClick={() => setSpendingFilter("month")}
                >
                  Month
                </Button>
                <Button
                  size="micro"
                  variant={spendingFilter === "year" ? "primary" : "tertiary"}
                  onClick={() => setSpendingFilter("year")}
                >
                  {completeStats.currentYear.toString()}
                </Button>
                <Button
                  size="micro"
                  variant={spendingFilter === "total" ? "primary" : "tertiary"}
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
                  ? `Year ${completeStats.currentYear}`
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
              {completeStats.heavyweightCustomers}
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
              {completeStats.reigningChampions}
            </Text>
            <Text variant="bodySm" as="p">
              Invite-only tier
            </Text>
          </BlockStack>
        </Card>
      </Grid.Cell>
    </Grid>
  );
}

export default function Index() {
  const { quickData, completeStats } = useLoaderData<typeof loader>();
  const [spendingFilter, setSpendingFilter] = useState<
    "month" | "year" | "total"
  >("month");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleViewCustomer = useCallback((customer: any) => {
    setSelectedCustomer(customer);
  }, []);

  const handleCloseCustomerCard = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

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

  const todayCompetitorRows = quickData.topCompetitorsToday.map(
    (customer: any) => [
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
    ],
  );

  const monthCompetitorRows = quickData.topCompetitorsMonth.map(
    (customer: any) => [
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
    ],
  );

  return (
    <Page fullWidth>
      {selectedCustomer && (
        <CustomerLoyaltyCard
          customer={selectedCustomer}
          onClose={handleCloseCustomerCard}
        />
      )}
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    TKO Loyalty Program Dashboard
                  </Text>
                </InlineStack>
                <Text as="p" variant="bodyMd">
                  Welcome to your loyalty program dashboard. Here you can manage
                  your customers, tiers, rewards, and view key metrics.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Suspense fallback={<StatsSkeleton />}>
              <Await resolve={completeStats}>
                {(resolvedStats) => (
                  <CompleteStatsGrid
                    completeStats={resolvedStats}
                    spendingFilter={spendingFilter}
                    setSpendingFilter={setSpendingFilter}
                  />
                )}
              </Await>
            </Suspense>
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
                          "Customer",
                          "Tier",
                          "Spent This Month",
                          "Orders",
                          "Actions",
                        ]}
                        rows={monthCompetitorRows}
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
