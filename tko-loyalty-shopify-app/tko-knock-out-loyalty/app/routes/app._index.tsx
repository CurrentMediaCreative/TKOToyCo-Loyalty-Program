import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Fetch customers from Shopify
    const customersResponse = await admin.graphql(
      `#graphql
        query GetCustomers($first: Int!) {
          customers(first: $first, sortKey: UPDATED_AT, reverse: true) {
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
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`,
      {
        variables: {
          first: 50,
        },
      },
    );

    const responseJson = await customersResponse.json();
    const customers =
      responseJson.data?.customers?.edges.map((edge: any) => edge.node) || [];

    // Calculate total spent across all customers
    const totalSpent = customers.reduce(
      (sum: number, customer: any) =>
        sum + parseFloat(customer.amountSpent?.amount || "0"),
      0,
    );

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

    // No redemptions in this system
    const recentRedemptions: any[] = [];

    // Get top customers
    const topCustomers = customerTiers.slice(0, 3).map((customer: any) => ({
      id: customer.id.replace("gid://shopify/Customer/", ""),
      name:
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        "Unknown",
      tier: customer.tier,
      spent: `$${parseFloat(customer.amountSpent?.amount || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      orders: customer.numberOfOrders || 0,
    }));

    // Calculate stats
    const stats = {
      totalCustomers: customers.length,
      activeCustomers,
      totalSpent: `$${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      topTier: "Reigning Champion",
      topTierCustomers: tierCounts["Reigning Champion"],
    };

    return json({
      stats,
      recentRedemptions,
      topCustomers,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    // Return empty data in case of error
    return json({
      stats: {
        totalCustomers: 0,
        activeCustomers: 0,
        totalSpent: "$0.00",
        topTier: "Reigning Champion",
        topTierCustomers: 0,
      },
      recentRedemptions: [],
      topCustomers: [],
    });
  }
};

export default function Index() {
  const { stats, recentRedemptions, topCustomers } =
    useLoaderData<typeof loader>();

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

  const redemptionRows = recentRedemptions.map((redemption) => [
    <Text key={`customer-${redemption.id}`} variant="bodyMd" as="span">
      {redemption.customer}
    </Text>,
    <Text key={`reward-${redemption.id}`} variant="bodyMd" as="span">
      {redemption.reward}
    </Text>,
    <Text key={`points-${redemption.id}`} variant="bodyMd" as="span">
      {redemption.points}
    </Text>,
    <Text key={`date-${redemption.id}`} variant="bodyMd" as="span">
      {new Date(redemption.date).toLocaleDateString()}
    </Text>,
    <Button
      key={`view-${redemption.id}`}
      variant="tertiary"
      icon={<Icon source={ViewIcon} />}
    >
      View
    </Button>,
  ]);

  const customerRows = topCustomers.map((customer: any) => [
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
    >
      View
    </Button>,
  ]);

  return (
    <Page fullWidth>
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
                    <Text variant="headingSm" as="h3">
                      Total Spent
                    </Text>
                    <Text variant="headingXl" as="p">
                      {stats.totalSpent}
                    </Text>
                    <Text variant="bodySm" as="p">
                      Across all customers
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
                        Recent Redemptions
                      </Text>
                      <Link to="/app/rewards">
                        <Button variant="plain">View all rewards</Button>
                      </Link>
                    </InlineStack>
                    {redemptionRows.length > 0 ? (
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
                          "Reward",
                          "Points",
                          "Date",
                          "Actions",
                        ]}
                        rows={redemptionRows}
                      />
                    ) : (
                      <EmptyState
                        heading="No recent redemptions"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>No customers have redeemed rewards recently.</p>
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
                        Top Customers
                      </Text>
                      <Link to="/app/customers">
                        <Button variant="plain">View all customers</Button>
                      </Link>
                    </InlineStack>
                    {customerRows.length > 0 ? (
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
                          "Total Spent",
                          "Orders",
                          "Actions",
                        ]}
                        rows={customerRows}
                      />
                    ) : (
                      <EmptyState
                        heading="No customers found"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>
                          No customers have joined your loyalty program yet.
                        </p>
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
                    <Link to="/app/rewards">
                      <Button fullWidth>Manage Rewards</Button>
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
