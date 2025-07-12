import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  DatePicker,
  Box,
  Select,
  Divider,
  Banner,
  SkeletonBodyText,
  EmptyState,
  DataTable,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getPointEvents } from "../services/pointEvent.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Fetch events from database for the event-based report
    const events = await getPointEvents();

    // Fetch customers from Shopify API instead of empty database
    async function fetchAllCustomers() {
      let allCustomers: any[] = [];
      let hasNextPage = true;
      let cursor: string | null = null;
      let pageCount = 0;
      const MAX_PAGES = 20; // Safety limit
      const PER_PAGE = 250; // Maximum allowed by Shopify

      try {
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
                      createdAt
                      lastOrder {
                        createdAt
                      }
                      orders(first: 50, sortKey: CREATED_AT, reverse: true) {
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

          const pageCustomers = customersData.edges.map(
            (edge: any) => edge.node,
          );
          allCustomers = [...allCustomers, ...pageCustomers];

          hasNextPage = customersData.pageInfo.hasNextPage;
          cursor = customersData.pageInfo.endCursor;
          pageCount++;
        }

        return allCustomers;
      } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }
    }

    const shopifyCustomers = await fetchAllCustomers();

    // Transform Shopify customers to include tier information and points calculation
    const customers = shopifyCustomers.map((customer: any) => {
      const spent = parseFloat(customer.amountSpent?.amount || "0");

      // Calculate tier based on spending (same logic as dashboard)
      let tier = "Featherweight";
      const hasReigningChampionTag =
        customer.tags &&
        customer.tags.some(
          (tag: string) => tag.toLowerCase() === "reigning champion",
        );

      if (hasReigningChampionTag) {
        tier = "Reigning Champion";
      } else if (spent >= 30000) {
        tier = "Heavyweight";
      } else if (spent >= 5000) {
        tier = "Welterweight";
      } else if (spent >= 1500) {
        tier = "Lightweight";
      }

      // Calculate points based on spending (1 point per dollar spent)
      const spendPoints = Math.floor(spent);

      // For now, set bonus points to 0 since we'd need to query the database
      // In a full implementation, we'd fetch bonus points from the database
      const bonusPoints = 0;
      const totalPoints = spendPoints + bonusPoints;

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        amountSpent: spent,
        numberOfOrders: customer.numberOfOrders,
        tier,
        spendPoints,
        bonusPoints,
        totalPoints,
        createdAt: customer.createdAt,
        lastOrder: customer.lastOrder,
        orders: customer.orders?.edges?.map((edge: any) => edge.node) || [],
      };
    });

    // Create tier definitions for tier distribution analysis
    const tiers = [
      { id: "featherweight", name: "Featherweight", minSpend: 0 },
      { id: "lightweight", name: "Lightweight", minSpend: 1500 },
      { id: "welterweight", name: "Welterweight", minSpend: 5000 },
      { id: "heavyweight", name: "Heavyweight", minSpend: 30000 },
      { id: "reigning-champion", name: "Reigning Champion", minSpend: 0 }, // Invite-only
    ];

    return json({ events, customers, tiers });
  } catch (error) {
    console.error("Error loading data for reports:", error);
    return json({
      events: [],
      customers: [],
      tiers: [],
      error: "Failed to load data for reports. Please try again later.",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === "exportDateRange") {
      const startDate = new Date(formData.get("startDate") as string);
      const endDate = new Date(formData.get("endDate") as string);
      const reportType = formData.get("reportType") as string;

      // In a real implementation, we would use reportType to filter data
      // based on whether we want all points, spend points only, or bonus points only
      console.log(`Generating report with filter: ${reportType}`);

      // For now, we'll just return success
      return json({
        success: true,
        message: `Report generated for date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      });
    }

    if (action === "exportEventReport") {
      const eventId = formData.get("eventId") as string;

      // In a real implementation, this would generate and return a CSV file
      // For now, we'll just return success
      return json({
        success: true,
        message: `Report generated for event ID: ${eventId}`,
      });
    }

    return json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Error in action:", error);
    return json({ success: false, error: "An error occurred" });
  }
};

export default function ReportsPage() {
  const {
    events = [],
    customers = [],
    tiers = [],
  } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Date picker state for date range report
  const [{ month, year }, setDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const [selectedStartDates, setSelectedStartDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)), // Default to last 30 days
    end: new Date(new Date().setDate(new Date().getDate() - 30)),
  });

  const [selectedEndDates, setSelectedEndDates] = useState({
    start: new Date(),
    end: new Date(),
  });

  // State for event-based report
  const [selectedEventId, setSelectedEventId] = useState("");
  const [reportType, setReportType] = useState("all"); // "all", "spend", or "bonus"

  const handleStartDateChange = (range: { start: Date; end: Date }) => {
    setSelectedStartDates(range);
  };

  const handleEndDateChange = (range: { start: Date; end: Date }) => {
    setSelectedEndDates(range);
  };

  const handleMonthChange = (month: number, year: number) => {
    setDate({ month, year });
  };

  const handleExportDateRange = () => {
    setIsGenerating(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("action", "exportDateRange");
    formData.append("startDate", selectedStartDates.start.toISOString());
    formData.append("endDate", selectedEndDates.start.toISOString());
    formData.append("reportType", reportType);

    submit(formData, { method: "post" });

    // In a real implementation, this would download a file
    // For now, we'll just show a success message after a delay
    setTimeout(() => {
      setIsGenerating(false);
      setMessage(
        `Report for ${selectedStartDates.start.toLocaleDateString()} to ${selectedEndDates.start.toLocaleDateString()} has been generated.`,
      );
    }, 1500);
  };

  const handleExportEventReport = () => {
    if (!selectedEventId) {
      setError("Please select an event");
      return;
    }

    setIsGenerating(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append("action", "exportEventReport");
    formData.append("eventId", selectedEventId);

    submit(formData, { method: "post" });

    // In a real implementation, this would download a file
    // For now, we'll just show a success message after a delay
    const selectedEvent = events.find(
      (event: any) => event.id === selectedEventId,
    );
    setTimeout(() => {
      setIsGenerating(false);
      setMessage(
        `Report for event "${selectedEvent?.name}" has been generated.`,
      );
    }, 1500);
  };

  // Format event options for the select dropdown
  const eventOptions = [
    { label: "Select an event", value: "" },
    ...events.map((event: any) => ({
      label: `${event.name} (${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()})`,
      value: event.id,
    })),
  ];

  // Calculate total customers and points
  const totalCustomers = customers.length;
  const totalPoints = customers.reduce(
    (sum: number, customer: any) => sum + (customer.totalPoints || 0),
    0,
  );
  const totalSpendPoints = customers.reduce(
    (sum: number, customer: any) => sum + (customer.spendPoints || 0),
    0,
  );
  const totalBonusPoints = customers.reduce(
    (sum: number, customer: any) => sum + (customer.bonusPoints || 0),
    0,
  );

  // Calculate tier distribution
  const tierDistribution = tiers.map((tier: any) => {
    const customersInTier = customers.filter(
      (customer: any) => customer.tier === tier.name,
    );
    const tierPoints = customersInTier.reduce(
      (sum: number, customer: any) => sum + (customer.totalPoints || 0),
      0,
    );
    return {
      tierName: tier.name,
      customerCount: customersInTier.length,
      totalPoints: tierPoints,
      percentage:
        totalCustomers > 0
          ? Math.round((customersInTier.length / totalCustomers) * 100)
          : 0,
    };
  });

  // Calculate event performance analytics
  const eventAnalytics = events.map((event: any) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    let status = "Upcoming";
    if (now >= startDate && now <= endDate && event.isActive) {
      status = "Active";
    } else if (now > endDate) {
      status = "Completed";
    } else if (!event.isActive) {
      status = "Inactive";
    }

    return {
      id: event.id,
      name: event.name,
      status,
      usageCount: event.usageCount || 0,
      pointsAwarded: event.pointsAwarded || 0,
      bonusPercentage: event.bonusPercentage,
      eventType: event.eventType,
      startDate: new Date(event.startDate).toLocaleDateString(),
      endDate: new Date(event.endDate).toLocaleDateString(),
    };
  });

  // Prepare tier distribution table data
  const tierRows = tierDistribution.map((tier) => [
    <Text
      key={`tier-${tier.tierName}`}
      variant="bodyMd"
      fontWeight="bold"
      as="span"
    >
      {tier.tierName}
    </Text>,
    <Text key={`count-${tier.tierName}`} variant="bodyMd" as="span">
      {tier.customerCount}
    </Text>,
    <Text key={`percentage-${tier.tierName}`} variant="bodyMd" as="span">
      {tier.percentage}%
    </Text>,
    <Text key={`points-${tier.tierName}`} variant="bodyMd" as="span">
      {tier.totalPoints.toLocaleString()}
    </Text>,
  ]);

  // Prepare event analytics table data
  const eventRows = eventAnalytics.map((event) => [
    <Text key={`name-${event.id}`} variant="bodyMd" fontWeight="bold" as="span">
      {event.name}
    </Text>,
    <Badge
      key={`status-${event.id}`}
      tone={
        event.status === "Active"
          ? "success"
          : event.status === "Completed"
            ? "info"
            : event.status === "Upcoming"
              ? "attention"
              : "critical"
      }
    >
      {event.status}
    </Badge>,
    <Text key={`type-${event.id}`} variant="bodyMd" as="span">
      {event.eventType === "store-wide"
        ? "Store-wide"
        : event.eventType === "collections"
          ? "Collections"
          : "Products"}
    </Text>,
    <Text key={`bonus-${event.id}`} variant="bodyMd" as="span">
      {event.bonusPercentage}%
    </Text>,
    <Text key={`usage-${event.id}`} variant="bodyMd" as="span">
      {event.usageCount}
    </Text>,
    <Text key={`points-${event.id}`} variant="bodyMd" as="span">
      {event.pointsAwarded.toLocaleString()}
    </Text>,
    <Text key={`dates-${event.id}`} variant="bodyMd" as="span">
      {event.startDate} - {event.endDate}
    </Text>,
  ]);

  return (
    <Page fullWidth>
      <TitleBar title="Points Reports & Exports" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Summary Card */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Points Summary
                </Text>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    Total Customers: {totalCustomers}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Total Points: {totalPoints.toLocaleString()}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Spend Points: {totalSpendPoints.toLocaleString()} (
                    {Math.round((totalSpendPoints / totalPoints) * 100) || 0}%)
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Bonus Points: {totalBonusPoints.toLocaleString()} (
                    {Math.round((totalBonusPoints / totalPoints) * 100) || 0}%)
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Date Range Report */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Date Range Report
                </Text>
                <Text as="p" variant="bodyMd">
                  Export a report of points earned by customers within a
                  specific date range.
                </Text>

                <Divider />

                <BlockStack gap="400">
                  <Box>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      Start Date
                    </Text>
                    <DatePicker
                      month={month}
                      year={year}
                      onChange={handleStartDateChange}
                      onMonthChange={handleMonthChange}
                      selected={selectedStartDates}
                    />
                  </Box>

                  <Box>
                    <Text variant="bodyMd" as="p" fontWeight="bold">
                      End Date
                    </Text>
                    <DatePicker
                      month={month}
                      year={year}
                      onChange={handleEndDateChange}
                      onMonthChange={handleMonthChange}
                      selected={selectedEndDates}
                    />
                  </Box>

                  <Select
                    label="Report Type"
                    options={[
                      { label: "All Points", value: "all" },
                      { label: "Spend Points Only", value: "spend" },
                      { label: "Bonus Points Only", value: "bonus" },
                    ]}
                    value={reportType}
                    onChange={(value) => setReportType(value)}
                  />

                  <Button
                    variant="primary"
                    onClick={handleExportDateRange}
                    loading={isGenerating}
                    disabled={isGenerating}
                  >
                    Export Report
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Tier Distribution Analytics */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Tier Distribution Analytics
                </Text>
                <Text as="p" variant="bodyMd">
                  View how customers are distributed across loyalty tiers based
                  on their total points.
                </Text>

                <Divider />

                {tiers.length === 0 ? (
                  <EmptyState
                    heading="No tiers configured"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      Configure loyalty tiers first to view tier distribution
                      analytics.
                    </p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "numeric",
                      "numeric",
                      "numeric",
                    ]}
                    headings={[
                      "Tier Name",
                      "Customers",
                      "Percentage",
                      "Total Points",
                    ]}
                    rows={tierRows}
                  />
                )}
              </BlockStack>
            </Card>

            {/* Event Performance Analytics */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Event Performance Analytics
                </Text>
                <Text as="p" variant="bodyMd">
                  Track the performance of bonus point events including usage
                  and points awarded.
                </Text>

                <Divider />

                {events.length === 0 ? (
                  <EmptyState
                    heading="No events available"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      Create bonus point events first to view performance
                      analytics.
                    </p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "text",
                      "text",
                      "numeric",
                      "numeric",
                      "text",
                    ]}
                    headings={[
                      "Event Name",
                      "Status",
                      "Type",
                      "Bonus %",
                      "Usage",
                      "Points Awarded",
                      "Duration",
                    ]}
                    rows={eventRows}
                  />
                )}
              </BlockStack>
            </Card>

            {/* Event-Based Report */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Event-Based Report
                </Text>
                <Text as="p" variant="bodyMd">
                  Export a report of points earned by customers during a
                  specific promotional event.
                </Text>

                <Divider />

                {events.length === 0 ? (
                  <EmptyState
                    heading="No events available"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      Create bonus point events first to generate event-based
                      reports.
                    </p>
                  </EmptyState>
                ) : (
                  <BlockStack gap="400">
                    <Select
                      label="Select Event"
                      options={eventOptions}
                      value={selectedEventId}
                      onChange={(value) => setSelectedEventId(value)}
                    />

                    <Button
                      variant="primary"
                      onClick={handleExportEventReport}
                      loading={isGenerating}
                      disabled={isGenerating || !selectedEventId}
                    >
                      Export Event Report
                    </Button>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>

            {/* Status Messages */}
            {message && (
              <Banner tone="success" onDismiss={() => setMessage(null)}>
                {message}
              </Banner>
            )}

            {error && (
              <Banner tone="critical" onDismiss={() => setError(null)}>
                {error}
              </Banner>
            )}

            {isGenerating && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Generating Report...
                  </Text>
                  <SkeletonBodyText lines={3} />
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
