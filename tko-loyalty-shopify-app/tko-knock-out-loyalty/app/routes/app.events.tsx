import { useState, useEffect, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useFetcher } from "@remix-run/react";
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
  Box,
  EmptyState,
  Tag,
  Autocomplete,
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

      let collections: string[] | undefined;
      if (eventType === "collections") {
        const collectionsString = formData.get("collections") as string;
        if (collectionsString) {
          collections = collectionsString.split(",").map((id) => id.trim());
        }
      }

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

      let collections: string[] | undefined;
      if (eventType === "collections") {
        const collectionsString = formData.get("collections") as string;
        if (collectionsString) {
          collections = collectionsString.split(",").map((id) => id.trim());
        }
      }

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

interface Collection {
  id: string;
  title: string;
  handle: string;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  status: string;
  image?: string;
}

export default function EventsPage() {
  const { events = [] } = useLoaderData<typeof loader>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const submit = useSubmit();

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>(
    [],
  );
  const [collectionQuery, setCollectionQuery] = useState("");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productQuery, setProductQuery] = useState("");

  const collectionsFetcher = useFetcher();
  const productsFetcher = useFetcher();

  // Load collections on mount
  useEffect(() => {
    collectionsFetcher.load("/api/collections");
  }, [collectionsFetcher]);

  // Handle collections data
  useEffect(() => {
    if (
      collectionsFetcher.data &&
      typeof collectionsFetcher.data === "object" &&
      "collections" in collectionsFetcher.data
    ) {
      setCollections((collectionsFetcher.data as any).collections);
    }
  }, [collectionsFetcher.data]);

  // Handle products search with debouncing
  useEffect(() => {
    if (productQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        productsFetcher.load(
          `/api/products?query=${encodeURIComponent(productQuery)}`,
        );
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setProducts([]);
    }
  }, [productQuery, productsFetcher]);

  // Handle products data
  useEffect(() => {
    if (
      productsFetcher.data &&
      typeof productsFetcher.data === "object" &&
      "products" in productsFetcher.data
    ) {
      setProducts((productsFetcher.data as any).products);
    }
  }, [productsFetcher.data]);

  const handleCreateEvent = () => {
    setEditingEvent({
      name: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 7))
        .toISOString()
        .split("T")[0],
      eventType: "collections",
      collections: [],
      productIds: [],
      bonusPercentage: 10,
      isActive: true,
      channel: "both",
    });
    setSelectedCollections([]);
    setSelectedProducts([]);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: any) => {
    const startDate = new Date(event.startDate).toISOString().split("T")[0];
    const endDate = new Date(event.endDate).toISOString().split("T")[0];

    setEditingEvent({
      ...event,
      startDate,
      endDate,
      collections: event.collections ? JSON.parse(event.collections) : [],
      productIds: event.productIds ? JSON.parse(event.productIds) : [],
    });

    // Set selected collections/products for display
    if (event.eventType === "collections" && event.collections) {
      const collectionIds = JSON.parse(event.collections);
      const selected = collections.filter((c) => collectionIds.includes(c.id));
      setSelectedCollections(selected);
    }

    if (event.eventType === "product-specific" && event.productIds) {
      const productIds = JSON.parse(event.productIds);
      setSelectedProducts(
        productIds.map((id: string) => ({
          id,
          title: `Product ${id}`,
          handle: "",
          status: "active",
        })),
      );
    }

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
      formData.append(
        "startDate",
        new Date(editingEvent.startDate).toISOString(),
      );
      formData.append("endDate", new Date(editingEvent.endDate).toISOString());
      formData.append("eventType", editingEvent.eventType);
      formData.append(
        "bonusPercentage",
        editingEvent.bonusPercentage.toString(),
      );
      formData.append("isActive", editingEvent.isActive.toString());
      formData.append("channel", editingEvent.channel || "both");

      if (
        editingEvent.eventType === "collections" &&
        selectedCollections.length > 0
      ) {
        formData.append(
          "collections",
          selectedCollections.map((c) => c.id).join(","),
        );
      }

      if (
        editingEvent.eventType === "product-specific" &&
        selectedProducts.length > 0
      ) {
        formData.append(
          "productIds",
          selectedProducts.map((p) => p.id).join(","),
        );
      }

      submit(formData, { method: "post" });
      setIsModalOpen(false);
      setEditingEvent(null);
      setSelectedCollections([]);
      setSelectedProducts([]);
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

  const getStatusBadge = (event: any) => {
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

  // Collection selection handlers
  const handleCollectionSelect = useCallback(
    (selected: string[]) => {
      if (selected.length > 0) {
        const value = selected[0];
        const collection = collections.find((c) => c.id === value);
        if (
          collection &&
          !selectedCollections.find((c) => c.id === collection.id)
        ) {
          setSelectedCollections([...selectedCollections, collection]);
        }
        setCollectionQuery("");
      }
    },
    [collections, selectedCollections],
  );

  const handleCollectionRemove = useCallback(
    (collectionId: string) => {
      setSelectedCollections(
        selectedCollections.filter((c) => c.id !== collectionId),
      );
    },
    [selectedCollections],
  );

  // Product selection handlers
  const handleProductSelect = useCallback(
    (selected: string[]) => {
      if (selected.length > 0) {
        const value = selected[0];
        const product = products.find((p) => p.id === value);
        if (product && !selectedProducts.find((p) => p.id === product.id)) {
          setSelectedProducts([...selectedProducts, product]);
        }
        setProductQuery("");
      }
    },
    [products, selectedProducts],
  );

  const handleProductRemove = useCallback(
    (productId: string) => {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
    },
    [selectedProducts],
  );

  const collectionOptions = collections
    .filter((collection) =>
      collection.title.toLowerCase().includes(collectionQuery.toLowerCase()),
    )
    .map((collection) => ({
      value: collection.id,
      label: collection.title,
    }));

  const productOptions = products.map((product) => ({
    value: product.id,
    label: product.title,
  }));

  const rows = events.map((event: any) => [
    <Text key={`name-${event.id}`} variant="bodyMd" fontWeight="bold" as="span">
      {event.name}
    </Text>,
    <Text key={`type-${event.id}`} variant="bodyMd" as="span">
      {event.eventType === "store-wide"
        ? "Store-wide"
        : event.eventType === "collections"
          ? "Collections"
          : "Product-specific"}
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
  ]);

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
                  Events can be store-wide, collection-based, or for specific
                  products.
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
          setSelectedCollections([]);
          setSelectedProducts([]);
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
              setSelectedCollections([]);
              setSelectedProducts([]);
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
                onChange={(value) => {
                  setEditingEvent({ ...editingEvent, eventType: value });
                  setSelectedCollections([]);
                  setSelectedProducts([]);
                }}
              />

              {editingEvent.eventType === "collections" && (
                <Box>
                  <Text variant="bodyMd" as="p">
                    Collections
                  </Text>
                  <BlockStack gap="200">
                    <Autocomplete
                      options={collectionOptions}
                      selected={[]}
                      onSelect={handleCollectionSelect}
                      textField={
                        <Autocomplete.TextField
                          onChange={setCollectionQuery}
                          label=""
                          value={collectionQuery}
                          placeholder="Search collections..."
                          autoComplete="off"
                        />
                      }
                    />

                    {selectedCollections.length > 0 && (
                      <InlineStack gap="100" wrap>
                        {selectedCollections.map((collection) => (
                          <Tag
                            key={collection.id}
                            onRemove={() =>
                              handleCollectionRemove(collection.id)
                            }
                          >
                            {collection.title}
                          </Tag>
                        ))}
                      </InlineStack>
                    )}
                  </BlockStack>
                </Box>
              )}

              {editingEvent.eventType === "product-specific" && (
                <Box>
                  <Text variant="bodyMd" as="p">
                    Products
                  </Text>
                  <BlockStack gap="200">
                    <Autocomplete
                      options={productOptions}
                      selected={[]}
                      onSelect={handleProductSelect}
                      textField={
                        <Autocomplete.TextField
                          onChange={setProductQuery}
                          label=""
                          value={productQuery}
                          placeholder="Search products..."
                          autoComplete="off"
                        />
                      }
                    />

                    {selectedProducts.length > 0 && (
                      <InlineStack gap="100" wrap>
                        {selectedProducts.map((product) => (
                          <Tag
                            key={product.id}
                            onRemove={() => handleProductRemove(product.id)}
                          >
                            {product.title}
                          </Tag>
                        ))}
                      </InlineStack>
                    )}
                  </BlockStack>
                </Box>
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

              <InlineStack gap="400">
                <TextField
                  label="Start Date"
                  type="date"
                  value={editingEvent.startDate}
                  onChange={(value) =>
                    setEditingEvent({ ...editingEvent, startDate: value })
                  }
                  autoComplete="off"
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={editingEvent.endDate}
                  onChange={(value) =>
                    setEditingEvent({ ...editingEvent, endDate: value })
                  }
                  autoComplete="off"
                />
              </InlineStack>

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
