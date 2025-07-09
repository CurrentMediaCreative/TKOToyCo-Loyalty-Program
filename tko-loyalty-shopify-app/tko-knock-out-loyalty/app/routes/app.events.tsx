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
  InlineStack,
  TextField,
  FormLayout,
  Divider,
  Modal,
  DataTable,
  Icon,
  Badge,
  Select,
  DatePicker,
  Box,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import {
  getPointEvents,
  createPointEvent,
  updatePointEvent,
  deletePointEvent,
} from "../services/pointEvent.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  try {
    // Fetch events from the database
    const events = await getPointEvents();

    return json({ events });
  } catch (error) {
    console.error("Error loading events:", error);
    return json({
      events: [],
      error: "Failed to load events. Please try again later.",
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === "createEvent") {
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const startDate = new Date(formData.get("startDate") as string);
      const endDate = new Date(formData.get("endDate") as string);
      const eventType = formData.get("eventType") as
        | "store-wide"
        | "collections"
        | "product-specific";
      const channel = formData.get("channel") as "online" | "instore" | "both";
      const bonusPercentage = parseFloat(
        formData.get("bonusPercentage") as string,
      );
      const isActive = formData.get("isActive") === "true";

      // Handle collections for collection-based events
      let collections: string[] | undefined;
      if (eventType === "collections") {
        const collectionsString = formData.get("collections") as string;
        if (collectionsString) {
          collections = collectionsString.split(",").map((id) => id.trim());
        }
      }

      // Handle product IDs for product-specific events
      let productIds: string[] | undefined;
      if (eventType === "product-specific") {
        const productIdsString = formData.get("productIds") as string;
        if (productIdsString) {
          productIds = productIdsString.split(",").map((id) => id.trim());
        }
      }

      await createPointEvent({
        name,
        description,
        startDate,
        endDate,
        eventType,
        collections,
        productIds,
        channel,
        bonusPercentage,
        isActive,
      });

      return json({ success: true });
    }

    if (action === "updateEvent") {
      const id = formData.get("id") as string;
      const name = formData.get("name") as string;
      const description = formData.get("description") as string;
      const startDate = new Date(formData.get("startDate") as string);
      const endDate = new Date(formData.get("endDate") as string);
      const eventType = formData.get("eventType") as
        | "store-wide"
        | "collections"
        | "product-specific";
      const channel = formData.get("channel") as "online" | "instore" | "both";
      const bonusPercentage = parseFloat(
        formData.get("bonusPercentage") as string,
      );
      const isActive = formData.get("isActive") === "true";

      // Handle collections for collection-based events
      let collections: string[] | undefined;
      if (eventType === "collections") {
        const collectionsString = formData.get("collections") as string;
        if (collectionsString) {
          collections = collectionsString.split(",").map((id) => id.trim());
        }
      }

      // Handle product IDs for product-specific events
      let productIds: string[] | undefined;
      if (eventType === "product-specific") {
        const productIdsString = formData.get("productIds") as string;
        if (productIdsString) {
          productIds = productIdsString.split(",").map((id) => id.trim());
        }
      }

      await updatePointEvent({
        id,
        name,
        description,
        startDate,
        endDate,
        eventType,
        collections,
        productIds,
        channel,
        bonusPercentage,
        isActive,
      });

      return json({ success: true });
    }

    if (action === "deleteEvent") {
      const id = formData.get("id") as string;
      await deletePointEvent(id);
      return json({ success: true });
    }

    return json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Error in action:", error);
    return json({ success: false, error: "An error occurred" });
  }
};

export default function EventsPage() {
  const { events = [] } = useLoaderData<typeof loader>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const submit = useSubmit();

  // Date picker state
  const [{ month, year }, setDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [selectedStartDates, setSelectedStartDates] = useState({
    start: new Date(),
    end: new Date(),
  });
  const [selectedEndDates, setSelectedEndDates] = useState({
    start: new Date(new Date().setDate(new Date().getDate() + 7)),
    end: new Date(new Date().setDate(new Date().getDate() + 7)),
  });

  const handleStartDateChange = (range: { start: Date; end: Date }) => {
    setSelectedStartDates(range);
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        startDate: range.start,
      });
    }
  };

  const handleEndDateChange = (range: { start: Date; end: Date }) => {
    setSelectedEndDates(range);
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        endDate: range.start,
      });
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    setDate({ month, year });
  };

  const handleCreateEvent = () => {
    setEditingEvent({
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      eventType: "collections",
      productIds: [],
      bonusPercentage: 10,
      isActive: true,
    });
    setSelectedStartDates({
      start: new Date(),
      end: new Date(),
    });
    setSelectedEndDates({
      start: new Date(new Date().setDate(new Date().getDate() + 7)),
      end: new Date(new Date().setDate(new Date().getDate() + 7)),
    });
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: {
    id: string;
    name: string;
    description?: string | null;
    startDate: string | Date;
    endDate: string | Date;
    eventType: string;
    productIds?: string | null;
    bonusPercentage: number;
    isActive: boolean;
  }) => {
    setEditingEvent({
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      productIds: event.productIds ? JSON.parse(event.productIds) : [],
    });
    setSelectedStartDates({
      start: new Date(event.startDate),
      end: new Date(event.startDate),
    });
    setSelectedEndDates({
      start: new Date(event.endDate),
      end: new Date(event.endDate),
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    setDeletingEventId(id);
    setIsDeleteModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (editingEvent) {
      const formData = new FormData();
      formData.append(
        "action",
        editingEvent.id ? "updateEvent" : "createEvent",
      );

      if (editingEvent.id) {
        formData.append("id", editingEvent.id);
      }

      formData.append("name", editingEvent.name);
      formData.append("description", editingEvent.description || "");
      formData.append("startDate", editingEvent.startDate.toISOString());
      formData.append("endDate", editingEvent.endDate.toISOString());
      formData.append("eventType", editingEvent.eventType);
      formData.append(
        "bonusPercentage",
        editingEvent.bonusPercentage.toString(),
      );
      formData.append("isActive", editingEvent.isActive.toString());

      if (
        editingEvent.eventType === "collections" &&
        editingEvent.collections &&
        editingEvent.collections.length > 0
      ) {
        formData.append("collections", editingEvent.collections.join(","));
      }

      if (
        editingEvent.eventType === "product-specific" &&
        editingEvent.productIds &&
        editingEvent.productIds.length > 0
      ) {
        formData.append("productIds", editingEvent.productIds.join(","));
      }

      formData.append("channel", editingEvent.channel || "both");

      submit(formData, { method: "post" });
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingEventId) {
      const formData = new FormData();
      formData.append("action", "deleteEvent");
      formData.append("id", deletingEventId);

      submit(formData, { method: "post" });
      setIsDeleteModalOpen(false);
      setDeletingEventId(null);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusBadge = (event: {
    startDate: string | Date;
    endDate: string | Date;
    isActive: boolean;
  }) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (!event.isActive) {
      return <Badge tone="critical">Inactive</Badge>;
    }

    if (now < startDate) {
      return <Badge tone="attention">Upcoming</Badge>;
    }

    if (now > endDate) {
      return <Badge tone="info">Expired</Badge>;
    }

    return <Badge tone="success">Active</Badge>;
  };

  const rows = events.map(
    (event: {
      id: string;
      name: string;
      eventType: string;
      bonusPercentage: number;
      startDate: string | Date;
      endDate: string | Date;
      isActive: boolean;
      usageCount?: number;
      pointsAwarded?: number;
      lastUsed?: string | Date | null;
    }) => [
      <Text
        key={`name-${event.id}`}
        variant="bodyMd"
        fontWeight="bold"
        as="span"
      >
        {event.name}
      </Text>,
      <Text key={`type-${event.id}`} variant="bodyMd" as="span">
        {event.eventType === "store-wide" ? "Store-wide" : "Product-specific"}
      </Text>,
      <Text key={`bonus-${event.id}`} variant="bodyMd" as="span">
        {event.bonusPercentage}%
      </Text>,
      <div key={`dates-${event.id}`}>
        <div>{formatDate(event.startDate)}</div>
        <div>to</div>
        <div>{formatDate(event.endDate)}</div>
      </div>,
      <div key={`status-${event.id}`}>{getStatusBadge(event)}</div>,
      <div key={`usage-${event.id}`}>
        <Text variant="bodyMd" as="span">
          {event.usageCount || 0} uses
        </Text>
        {event.lastUsed && (
          <Text variant="bodySm" as="p" tone="subdued">
            Last: {formatDate(event.lastUsed)}
          </Text>
        )}
      </div>,
      <Text key={`points-${event.id}`} variant="bodyMd" as="span">
        {event.pointsAwarded ? event.pointsAwarded.toFixed(0) : "0"}
      </Text>,
      <InlineStack key={`actions-${event.id}`} gap="200" align="end">
        <Button
          variant="tertiary"
          onClick={() => handleEditEvent(event)}
          icon={<Icon source={EditIcon} />}
        >
          Edit
        </Button>
        <Button
          variant="tertiary"
          tone="critical"
          onClick={() => handleDeleteEvent(event.id)}
          icon={<Icon source={DeleteIcon} />}
        >
          Delete
        </Button>
      </InlineStack>,
    ],
  );

  return (
    <Page fullWidth>
      <TitleBar
        title="Bonus Point Events"
        primaryAction={{
          content: "Create Event",
          onAction: handleCreateEvent,
        }}
      />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Point Events
                </Text>
                <Text as="p" variant="bodyMd">
                  Create and manage bonus point events to reward your customers.
                  Events can be store-wide or for specific products.
                </Text>

                {events.length === 0 ? (
                  <EmptyState
                    heading="No point events yet"
                    action={{
                      content: "Create Event",
                      onAction: handleCreateEvent,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      Create bonus point events to reward your customers with
                      extra points during special promotions.
                    </p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "Event Name",
                      "Type",
                      "Bonus",
                      "Date Range",
                      "Status",
                      "Usage",
                      "Points Awarded",
                      "Actions",
                    ]}
                    rows={rows}
                  />
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        title={editingEvent?.id ? "Edit Point Event" : "Create Point Event"}
        primaryAction={{
          content: "Save",
          onAction: handleSaveEvent,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setIsModalOpen(false);
              setEditingEvent(null);
            },
          },
        ]}
      >
        <Modal.Section>
          {editingEvent && (
            <FormLayout>
              <TextField
                label="Event Name"
                value={editingEvent.name}
                onChange={(value) =>
                  setEditingEvent({ ...editingEvent, name: value })
                }
                autoComplete="off"
              />

              <TextField
                label="Description"
                value={editingEvent.description || ""}
                onChange={(value) =>
                  setEditingEvent({ ...editingEvent, description: value })
                }
                multiline={3}
                autoComplete="off"
              />

              <Select
                label="Event Type"
                options={[
                  { label: "Store-wide", value: "store-wide" },
                  { label: "Collection-based", value: "collections" },
                  { label: "Product-specific", value: "product-specific" },
                ]}
                value={editingEvent.eventType}
                onChange={(value) =>
                  setEditingEvent({ ...editingEvent, eventType: value })
                }
              />

              {editingEvent.eventType === "collections" && (
                <TextField
                  label="Collection IDs"
                  value={editingEvent.collections?.join(", ") || ""}
                  onChange={(value) =>
                    setEditingEvent({
                      ...editingEvent,
                      collections: value
                        .split(",")
                        .map((id: string) => id.trim())
                        .filter(Boolean),
                    })
                  }
                  helpText="Enter comma-separated collection IDs (e.g., 123456789, 987654321)"
                  autoComplete="off"
                />
              )}

              {editingEvent.eventType === "product-specific" && (
                <TextField
                  label="Product IDs"
                  value={editingEvent.productIds?.join(", ") || ""}
                  onChange={(value) =>
                    setEditingEvent({
                      ...editingEvent,
                      productIds: value
                        .split(",")
                        .map((id: string) => id.trim())
                        .filter(Boolean),
                    })
                  }
                  helpText="Enter comma-separated product IDs (e.g., 123456789, 987654321)"
                  autoComplete="off"
                />
              )}

              <Select
                label="Channel"
                options={[
                  { label: "Both Online & In-store", value: "both" },
                  { label: "Online Only", value: "online" },
                  { label: "In-store Only", value: "instore" },
                ]}
                value={editingEvent.channel || "both"}
                onChange={(value) =>
                  setEditingEvent({ ...editingEvent, channel: value })
                }
              />

              <TextField
                label="Bonus Percentage"
                value={editingEvent.bonusPercentage.toString()}
                onChange={(value) =>
                  setEditingEvent({
                    ...editingEvent,
                    bonusPercentage: parseFloat(value) || 0,
                  })
                }
                type="number"
                suffix="%"
                autoComplete="off"
              />

              <Divider />

              <Text variant="headingSm" as="h3">
                Event Duration
              </Text>

              <BlockStack gap="400">
                <Box>
                  <Text variant="bodyMd" as="p">
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
                  <Text variant="bodyMd" as="p">
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
                  label="Status"
                  options={[
                    { label: "Active", value: "true" },
                    { label: "Inactive", value: "false" },
                  ]}
                  value={editingEvent.isActive.toString()}
                  onChange={(value) =>
                    setEditingEvent({
                      ...editingEvent,
                      isActive: value === "true",
                    })
                  }
                />
              </BlockStack>
            </FormLayout>
          )}
        </Modal.Section>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingEventId(null);
        }}
        title="Delete Point Event"
        primaryAction={{
          content: "Delete",
          onAction: handleConfirmDelete,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setIsDeleteModalOpen(false);
              setDeletingEventId(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodyMd">
            Are you sure you want to delete this point event? This action cannot
            be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
