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
  Box,
  Divider,
  ProgressBar,
  Tooltip,
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
} from "@shopify/polaris-icons";
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

    // Calculate spending for different time periods using EST timezone
    const now = new Date();

    // Convert to EST (UTC-5) or EDT (UTC-4) - JavaScript handles DST automatically
    const estOffset = -5 * 60; // EST is UTC-5
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const estTime = new Date(utc + estOffset * 60000);

    // Use EST time for "today" calculations
    const today = new Date(
      estTime.getFullYear(),
      estTime.getMonth(),
      estTime.getDate(),
    );
    const firstDayOfMonth = new Date(
      estTime.getFullYear(),
      estTime.getMonth(),
      1,
    );
    const firstDayOfYear = new Date(estTime.getFullYear(), 0, 1);

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

    // Today is already set to beginning of day in EST
    // No need to modify hours since we created it from EST date components

    // Process customers to add today's and this month's spending
    const processedCustomers = customerTiers.map((customer: any) => {
      // Extract orders if available
      const orders =
        customer.orders?.edges?.map((edge: any) => edge.node) || [];

      // Calculate today's spending (EST timezone)
      const todaySpending = orders.reduce((sum: number, order: any) => {
        const orderDate = new Date(order.createdAt);

        // Convert order date to EST for comparison
        const orderUtc =
          orderDate.getTime() + orderDate.getTimezoneOffset() * 60000;
        const orderEst = new Date(orderUtc + estOffset * 60000);

        // Check if order was placed today (EST)
        const orderDateOnly = new Date(
          orderEst.getFullYear(),
          orderEst.getMonth(),
          orderEst.getDate(),
        );

        if (orderDateOnly.getTime() === today.getTime()) {
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
        name:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Unknown",
      };
    });

    // Get top competitors for today
    const todayCompetitors = processedCustomers
      .filter((customer: any) => customer.todaySpending > 0)
      .sort((a: any, b: any) => b.todaySpending - a.todaySpending)
      .slice(0, 5);

    // Get top competitors for this month
    const monthCompetitors = processedCustomers
      .filter((customer: any) => customer.monthSpending > 0)
      .sort((a: any, b: any) => b.monthSpending - a.monthSpending)
      .slice(0, 5);

    // Calculate growth metrics (mock data for now - you can implement real calculations)
    const lastMonthCustomers = Math.floor(customers.length * 0.9); // Mock 10% growth
    const customerGrowth =
      ((customers.length - lastMonthCustomers) / lastMonthCustomers) * 100;

    const lastMonthSpending = monthSpending * 0.85; // Mock 15% growth
    const spendingGrowth =
      ((monthSpending - lastMonthSpending) / lastMonthSpending) * 100;

    return json({
      stats: {
        totalCustomers: customers.length,
        activeCustomers,
        totalSpent: totalSpent.toFixed(2),
        monthSpending: monthSpending.toFixed(2),
        yearSpending: yearSpending.toFixed(2),
        currentYear: estTime.getFullYear(),
        topTierCustomers: tierCounts["Reigning Champion"],
        customerGrowth: customerGrowth.toFixed(1),
        spendingGrowth: spendingGrowth.toFixed(1),
      },
      tierCounts,
      todayCompetitors,
      monthCompetitors,
      customers: processedCustomers,
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
      customers: [],
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default function Index() {
  const { stats, tierCounts, todayCompetitors, monthCompetitors, error } =
    useLoaderData<typeof loader>() as any;

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
      ${customer.todaySpending.toFixed(2)}
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
      ${customer.monthSpending.toFixed(2)}
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
                <Tooltip content="Manage customer profiles and loyalty status">
                  <Link to="/app/customers">
                    <Button
                      variant="primary"
                      icon={<Icon source={PersonIcon} />}
                    >
                      Manage Customers
                    </Button>
                  </Link>
                </Tooltip>
                <Tooltip content="Configure tier settings and requirements">
                  <Link to="/app/tiers">
                    <Button
                      variant="secondary"
                      icon={<Icon source={SettingsIcon} />}
                    >
                      Configure Tiers
                    </Button>
                  </Link>
                </Tooltip>
                <Tooltip content="View detailed analytics and reports">
                  <Link to="/app/reports">
                    <Button
                      variant="tertiary"
                      icon={<Icon source={ChartVerticalIcon} />}
                    >
                      View Reports
                    </Button>
                  </Link>
                </Tooltip>
              </InlineStack>
            </InlineStack>
            <Divider />
          </BlockStack>
        </Box>

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
                      <Link to="/app/customers">
                        <Button
                          variant="plain"
                          icon={<Icon source={ViewIcon} />}
                        >
                          View all fighters
                        </Button>
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
                          "Fighter",
                          "Weight Class",
                          "Total Spent",
                          "Total Orders",
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
                      <Link to="/app/customers">
                        <Button
                          variant="plain"
                          icon={<Icon source={ViewIcon} />}
                        >
                          View all fighters
                        </Button>
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
                          "Fighter",
                          "Weight Class",
                          "Total Spent",
                          "Total Orders",
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
