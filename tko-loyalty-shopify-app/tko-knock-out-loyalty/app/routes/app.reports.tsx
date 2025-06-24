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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getPointEvents } from "../services/pointEvent.server";
import { getCustomers } from "../services/customer.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  try {
    // Fetch events for the event-based report
    const events = await getPointEvents();

    // Fetch customers for customer summary
    const customers = await getCustomers();

    return json({ events, customers });
  } catch (error) {
    console.error("Error loading data for reports:", error);
    return json({
      events: [],
      customers: [],
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
  const { events = [], customers = [] } = useLoaderData<typeof loader>();
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
