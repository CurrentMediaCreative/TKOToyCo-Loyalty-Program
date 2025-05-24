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
} from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { CustomerLoyaltyCard } from "../components/CustomerLoyaltyCard";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Function to fetch all customers using cursor-based pagination
    async function fetchAllCustomers() {
      let allCustomers: any[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;
      let pageCount = 0;
      const MAX_PAGES = 20; // Safety limit to prevent infinite loops
      const PER_PAGE = 250; // Maximum allowed by Shopify

      try {
        while (hasNextPage && pageCount < MAX_PAGES) {
          // Build the query with or without cursor
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
              query GetCustomers($first: Int!, $after: String, $sortKey: CustomerSortKeys!, $reverse: Boolean!) {
                customers(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
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
                      orders(first: 20, sortKey: CREATED_AT, reverse: true) {
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

          if (!customersData) {
            console.error("No customer data returned from API");
            break;
          }

          // Extract customers from this page
          const pageCustomers = customersData.edges.map(
            (edge: any) => edge.node,
          );
          allCustomers = [...allCustomers, ...pageCustomers];

          // Update pagination info for next iteration
          hasNextPage = customersData.pageInfo.hasNextPage;
          cursor = customersData.pageInfo.endCursor;
          pageCount++;

          console.log(
            `Fetched page ${pageCount} with ${pageCustomers.length} customers. Total: ${allCustomers.length}`,
          );
        }

        return allCustomers;
      } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }
    }

    const customers = await fetchAllCustomers();

    // Calculate spending for different time periods
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    // Calculate total spent (all time)
    const totalSpent = customers.reduce(
      (sum: number, customer: any) =>
        sum + parseFloat(customer.amountSpent?.amount || "0"),
      0,
    );

    // Calculate month and year spending from orders
    let monthSpending = 0;
    let yearSpending = 0;

    customers.forEach((customer: any) => {
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

    // Calculate active customers (with orders in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = customers.filter((customer: any) => {
      if (!customer.lastOrder) return false;
      const orderDate = new Date(customer.lastOrder.createdAt);
      return orderDate >= thirtyDaysAgo;
    }).length;

    // Determine customer tiers based on spending
    const customerTiers = customers.map((customer: any) => {
      const spent = parseFloat(customer.amountSpent?.amount || "0");
      let tier = "Featherweight";

      // Check if customer has "Reigning Champion" tag (invite-only tier)
      const hasReigningChampionTag =
        customer.tags &&
        customer.tags.some(
          (tag: string) => tag.toLowerCase() === "reigning champion",
        );

      if (hasReigningChampionTag) {
        tier = "Reigning Champion"; // Manually assigned tier overrides spending tier
      } else if (spent >= 25000) {
        tier = "Heavyweight";
      } else if (spent >= 5000) {
        tier = "Welterweight";
      } else if (spent >= 1500) {
        tier = "Lightweight";
      }

      return {
        ...customer,
        tier,
      };
    });

    // Count customers in each tier
    const tierCounts: Record<string, number> = {
      Featherweight: 0,
      Lightweight: 0,
      Welterweight: 0,
      Heavyweight: 0,
      "Reigning Champion": 0,
    };

    customerTiers.forEach((customer: any) => {
      const tier = customer.tier as string;
      if (tierCounts[tier] !== undefined) {
        tierCounts[tier]++;
      }
    });

    // Set hours to beginning of day for consistent comparison
    today.setHours(0, 0, 0, 0);

    // Process customers to add today's and this month's spending
    const processedCustomers = customerTiers.map((customer: any) => {
      // Extract orders if available
      const orders =
        customer.orders?.edges?.map((edge: any) => edge.node) || [];

      // Calculate today's spending
      const todaySpending = orders.reduce((sum: number, order: any) => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= today) {
          return (
            sum + parseFloat(order.totalPriceSet?.shopMoney?.amount || "0")
          );
        }
        return sum;
      }, 0);

      // Calculate this month's spending
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

    // Calculate stats
    const stats = {
      totalCustomers: customers.length,
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
      topTier: "Reigning Champion",
      topTierCustomers: tierCounts["Reigning Champion"],
    };

    return json({
      stats,
      topCompetitorsToday,
      topCompetitorsMonth,
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
    });
  }
};

export default function Index() {
  const { stats, topCompetitorsToday, topCompetitorsMonth } =
    useLoaderData<typeof loader>();

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
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingLg">
                    TKO Loyalty Program Dashboard
                  </Text>
                  <Button variant="primary">Send Loyalty Update</Button>
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
                    <Button fullWidth>View Reports</Button>
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
