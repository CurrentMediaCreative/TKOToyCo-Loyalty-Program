import { useState } from "react";
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
  Box,
  Grid,
  LegacyCard,
  DataTable,
  EmptyState,
  SkeletonBodyText,
  SkeletonDisplayText,
  Divider,
} from "@shopify/polaris";
import {
  PlusIcon,
  DeleteIcon,
  EditIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // In a real implementation, we would fetch data from the database
  // For now, we'll use mock data
  const stats = {
    totalCustomers: 1245,
    activeCustomers: 876,
    totalPointsIssued: 124500,
    totalPointsRedeemed: 78900,
    redemptionRate: 63.4,
    averagePointsPerCustomer: 100,
    topTier: "Reigning Champion",
    topTierCustomers: 12,
  };

  const recentRedemptions = [
    {
      id: "1",
      customer: "John Smith",
      reward: "10% Off Next Purchase",
      points: 100,
      date: "2025-05-18",
    },
    {
      id: "2",
      customer: "Sarah Johnson",
      reward: "Free Shipping",
      points: 150,
      date: "2025-05-17",
    },
    {
      id: "3",
      customer: "Michael Brown",
      reward: "$25 Store Credit",
      points: 250,
      date: "2025-05-16",
    },
  ];

  const topCustomers = [
    {
      id: "1",
      name: "Emily Davis",
      points: 2450,
      tier: "Reigning Champion",
      spent: "$105,230",
    },
    {
      id: "2",
      name: "Robert Wilson",
      points: 1875,
      tier: "Heavyweight",
      spent: "$30,120",
    },
    {
      id: "3",
      name: "Jennifer Lee",
      points: 1540,
      tier: "Welterweight",
      spent: "$12,890",
    },
  ];

  return json({
    stats,
    recentRedemptions,
    topCustomers,
  });
};

export default function Index() {
  const { stats, recentRedemptions, topCustomers } = useLoaderData<typeof loader>();

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

  const customerRows = topCustomers.map((customer) => [
    <Text key={`name-${customer.id}`} variant="bodyMd" as="span">
      {customer.name}
    </Text>,
    <Text key={`points-${customer.id}`} variant="bodyMd" as="span">
      {customer.points}
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
                  <Button
                    variant="primary"
                  >
                    Send Loyalty Update
                  </Button>
                </InlineStack>
                <Text as="p" variant="bodyMd">
                  Welcome to your loyalty program dashboard. Here you can manage your customers, tiers, rewards, and view key metrics.
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
                      Total Points Issued
                    </Text>
                    <Text variant="headingXl" as="p">
                      {stats.totalPointsIssued.toLocaleString()}
                    </Text>
                    <Text variant="bodySm" as="p">
                      {stats.averagePointsPerCustomer} avg. per customer
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Points Redeemed
                    </Text>
                    <Text variant="headingXl" as="p">
                      {stats.totalPointsRedeemed.toLocaleString()}
                    </Text>
                    <Text variant="bodySm" as="p">
                      {stats.redemptionRate}% redemption rate
                    </Text>
                  </BlockStack>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Card>
                  <BlockStack gap="200">
                    <Text variant="headingSm" as="h3">
                      Top Tier Customers
                    </Text>
                    <Text variant="headingXl" as="p">
                      {stats.topTierCustomers}
                    </Text>
                    <Text variant="bodySm" as="p">
                      {stats.topTier} tier members
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
                        columnContentTypes={["text", "text", "text", "text", "text"]}
                        headings={["Customer", "Reward", "Points", "Date", "Actions"]}
                        rows={redemptionRows}
                      />
                    ) : (
                      <EmptyState
                        heading="No recent redemptions"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>
                          No customers have redeemed rewards recently.
                        </p>
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
                        columnContentTypes={["text", "text", "text", "text", "text"]}
                        headings={["Customer", "Points", "Tier", "Total Spent", "Actions"]}
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
                      <Button fullWidth>
                        Manage Customers
                      </Button>
                    </Link>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <Link to="/app/tiers">
                      <Button fullWidth>
                        Configure Tiers
                      </Button>
                    </Link>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <Link to="/app/rewards">
                      <Button fullWidth>
                        Manage Rewards
                      </Button>
                    </Link>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                    <Button fullWidth>
                      View Reports
                    </Button>
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
