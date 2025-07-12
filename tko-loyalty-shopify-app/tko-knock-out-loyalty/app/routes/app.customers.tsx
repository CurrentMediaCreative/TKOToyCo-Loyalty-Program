import { useState, useMemo } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  EmptyState,
  Badge,
  IndexTable,
  useIndexResourceState,
  Tabs,
  Banner,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  getCustomerByShopifyId,
  getCustomers,
} from "../services/customer.server";
import { adjustCustomerBonusPoints } from "../services/pointTransaction.server";
import { CustomerLoyaltyCard } from "../components/CustomerLoyaltyCard";
import { serializeBigInt } from "../utils/serialization";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    if (action === "updateBonusPoints") {
      const customerId = formData.get("customerId") as string;
      const newBonusPoints = parseFloat(formData.get("bonusPoints") as string);

      if (isNaN(newBonusPoints) || newBonusPoints < 0) {
        return json({ success: false, error: "Invalid bonus points value" });
      }

      // Get the customer from our database using Shopify ID
      const customer = await getCustomerByShopifyId(parseInt(customerId));

      if (!customer) {
        return json({ success: false, error: "Customer not found" });
      }

      // Calculate the difference to create a transaction record
      const currentBonusPoints = customer.bonusPoints || 0;
      const difference = newBonusPoints - currentBonusPoints;

      if (difference !== 0) {
        // Create a transaction record for the adjustment
        await adjustCustomerBonusPoints({
          customerId: customer.id,
          amount: difference,
          reason: `Admin adjustment: Set bonus points to ${newBonusPoints}`,
          admin,
        });
      }

      return json({ success: true });
    }

    return json({ success: false, error: "Invalid action" });
  } catch (error) {
    console.error("Error in action:", error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    });
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  try {
    // Fetch customers from our database only - no more API calls!
    const dbCustomers = await getCustomers();

    // Transform database customers to match the expected format
    const customers = dbCustomers.map((dbCustomer: any) => {
      // Convert database customer to expected format
      const shopifyId = dbCustomer.shopifyId.toString();

      return {
        // Shopify-like ID format for compatibility
        id: `gid://shopify/Customer/${shopifyId}`,
        firstName: dbCustomer.firstName,
        lastName: dbCustomer.lastName,
        email: dbCustomer.email,
        phone: dbCustomer.phone,
        numberOfOrders: dbCustomer.numberOfOrders,
        amountSpent: {
          amount: dbCustomer.totalSpend.toString(),
        },
        tags: dbCustomer.tags
          ? dbCustomer.tags.split(",").map((tag: string) => tag.trim())
          : [],
        createdAt: dbCustomer.createdAt,
        defaultAddress: {
          city: dbCustomer.city,
          province: dbCustomer.province,
          country: dbCustomer.country,
        },
        // Database fields
        dbData: dbCustomer,
        bonusPoints: dbCustomer.bonusPoints || 0,
        totalPoints: dbCustomer.totalPoints || 0,
        spendPoints: dbCustomer.spendPoints || 0,
        tier: dbCustomer.tier || null,
      };
    });

    console.log(
      `✅ Loaded ${customers.length} customers from database cache (no API calls)`,
    );

    return json({
      customers: serializeBigInt(customers),
      success: true,
      error: null,
    });
  } catch (error) {
    console.error("Error in loader:", error);
    return json({
      customers: [],
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export default function CustomersPage() {
  interface LoaderData {
    customers: any[];
    success: boolean;
    error: string | null;
  }

  const { customers, success, error } = useLoaderData<LoaderData>();
  const submit = useSubmit();
  const [searchValue, setSearchValue] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortField, setSortField] = useState("spent");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("descending");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 50;
  const [editingBonusPoints, setEditingBonusPoints] = useState<string | null>(
    null,
  );
  const [bonusPointsValue, setBonusPointsValue] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const resourceName = {
    singular: "customer",
    plural: "customers",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(customers);

  const tabs = [
    {
      id: "all-customers",
      content: "All",
      accessibilityLabel: "All customers",
      panelID: "all-customers-content",
    },
    {
      id: "featherweight",
      content: "Featherweight",
      accessibilityLabel: "Featherweight tier customers",
      panelID: "featherweight-customers-content",
    },
    {
      id: "lightweight",
      content: "Lightweight",
      accessibilityLabel: "Lightweight tier customers",
      panelID: "lightweight-customers-content",
    },
    {
      id: "welterweight",
      content: "Welterweight",
      accessibilityLabel: "Welterweight tier customers",
      panelID: "welterweight-customers-content",
    },
    {
      id: "heavyweight",
      content: "Heavyweight",
      accessibilityLabel: "Heavyweight tier customers",
      panelID: "heavyweight-customers-content",
    },
    {
      id: "reigning-champion",
      content: "Reigning Champion",
      accessibilityLabel: "Reigning Champion tier customers",
      panelID: "reigning-champion-customers-content",
    },
  ];

  const handleTabChange = (selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex);
  };

  // Function to determine customer tier based on total points from our database
  const getCustomerTierFromPoints = (
    totalPoints: number,
    tags: string[] = [],
  ) => {
    // Check if customer has "Reigning Champion" tag (invite-only tier)
    const hasReigningChampionTag = tags.some(
      (tag: string) => tag.toLowerCase() === "reigning champion",
    );

    if (hasReigningChampionTag) {
      return "Reigning Champion"; // Manually assigned tier overrides points tier
    } else if (totalPoints >= 30000) {
      return "Heavyweight";
    } else if (totalPoints >= 5000) {
      return "Welterweight";
    } else if (totalPoints >= 1500) {
      return "Lightweight";
    } else {
      return "Featherweight";
    }
  };

  // Function to get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Reigning Champion":
        return "success";
      case "Heavyweight":
        return "attention";
      case "Welterweight":
        return "warning";
      case "Lightweight":
        return "info";
      default:
        return "subdued";
    }
  };

  // Process customers to add calculated fields
  const processedCustomers = useMemo(() => {
    return customers.map((customer: any) => {
      const spentAmount = parseFloat(customer.amountSpent?.amount || "0");

      // Use database data if available, otherwise calculate from points
      const dbData = customer.dbData;
      const totalPoints = dbData?.totalPoints || Math.round(spentAmount);
      const bonusPoints = dbData?.bonusPoints || 0;
      const spendPoints = dbData?.spendPoints || Math.round(spentAmount);

      // Calculate tier using our points-based system
      const tier =
        dbData?.tier?.name ||
        getCustomerTierFromPoints(totalPoints, customer.tags || []);

      // Format location
      const address = customer.defaultAddress;
      const location = address
        ? `${address.city || ""}, ${address.province || ""}, ${address.country || ""}`.replace(
            /^,\s*|,\s*$/g,
            "",
          )
        : "No address";

      return {
        ...customer,
        tier,
        totalPoints,
        bonusPoints,
        spendPoints,
        spentAmount,
        location,
        name:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Unknown",
      };
    });
  }, [customers]);

  // Filter customers based on search and selected tab
  const filteredCustomers = useMemo(() => {
    let filtered = processedCustomers;

    // Filter by search
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(
        (customer: any) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.phone?.toLowerCase().includes(searchLower),
      );
    }

    // Filter by tier tab
    if (selectedTab > 0) {
      const tierMap = [
        "all",
        "Featherweight",
        "Lightweight",
        "Welterweight",
        "Heavyweight",
        "Reigning Champion",
      ];
      const selectedTier = tierMap[selectedTab];
      if (selectedTier !== "all") {
        filtered = filtered.filter(
          (customer: any) => customer.tier === selectedTier,
        );
      }
    }

    return filtered;
  }, [processedCustomers, searchValue, selectedTab]);

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    sorted.sort((a: any, b: any) => {
      let aValue, bValue;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "tier":
          aValue = a.tier;
          bValue = b.tier;
          break;
        case "points":
          aValue = a.totalPoints;
          bValue = b.totalPoints;
          break;
        case "bonus":
          aValue = a.bonusPoints;
          bValue = b.bonusPoints;
          break;
        case "spent":
          aValue = a.spentAmount;
          bValue = b.spentAmount;
          break;
        case "orders":
          aValue = a.numberOfOrders || 0;
          bValue = b.numberOfOrders || 0;
          break;
        case "location":
          aValue = a.location.toLowerCase();
          bValue = b.location.toLowerCase();
          break;
        default:
          aValue = a.spentAmount;
          bValue = b.spentAmount;
      }

      if (typeof aValue === "string") {
        return sortDirection === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      }
    });

    return sorted;
  }, [filteredCustomers, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const currentCustomers = sortedCustomers.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === "ascending" ? "descending" : "ascending",
      );
    } else {
      setSortField(field);
      setSortDirection("descending");
    }
  };

  const getSortIndicator = (field: string) => {
    if (sortField !== field) return "";
    return sortDirection === "ascending" ? " ↑" : " ↓";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBonusPointsEdit = (customerId: string, currentValue: number) => {
    setEditingBonusPoints(customerId);
    setBonusPointsValue(currentValue.toString());
  };

  const handleBonusPointsSave = (customerId: string) => {
    const formData = new FormData();
    formData.append("action", "updateBonusPoints");
    formData.append("customerId", customerId);
    formData.append("bonusPoints", bonusPointsValue);

    submit(formData, { method: "post" });
    setEditingBonusPoints(null);
    setBonusPointsValue("");
  };

  const handleBonusPointsCancel = () => {
    setEditingBonusPoints(null);
    setBonusPointsValue("");
  };

  // Handle viewing customer details
  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handleCloseCustomerModal = () => {
    setSelectedCustomer(null);
  };

  const rowMarkup = currentCustomers.map((customer: any, index: number) => {
    const id = customer.id.replace("gid://shopify/Customer/", "");

    return (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {customer.name || "Unknown"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{customer.email || "No email"}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={getTierColor(customer.tier) as any}>
            {customer.tier}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {customer.totalPoints.toLocaleString()}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {editingBonusPoints === id ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <TextField
                value={bonusPointsValue}
                onChange={setBonusPointsValue}
                type="number"
                autoComplete="off"
                label=""
                size="slim"
              />
              <Button
                size="micro"
                onClick={() => handleBonusPointsSave(id)}
                variant="primary"
              >
                Save
              </Button>
              <Button
                size="micro"
                onClick={handleBonusPointsCancel}
                variant="tertiary"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div
              style={{ cursor: "pointer" }}
              onClick={() => handleBonusPointsEdit(id, customer.bonusPoints)}
            >
              <Text as="span">{customer.bonusPoints.toLocaleString()}</Text>
              <Text as="span" tone="subdued" variant="bodySm">
                {" "}
                (click to edit)
              </Text>
            </div>
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>${customer.spentAmount.toFixed(2)}</IndexTable.Cell>
        <IndexTable.Cell>{customer.numberOfOrders || 0}</IndexTable.Cell>
        <IndexTable.Cell>{customer.location}</IndexTable.Cell>
        <IndexTable.Cell>
          <Button
            variant="tertiary"
            icon={<Icon source={ViewIcon} />}
            onClick={() => handleViewCustomer(customer)}
            accessibilityLabel={`View ${customer.name} details`}
          >
            View
          </Button>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  const emptyStateMarkup = (
    <EmptyState
      heading="No customers found"
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>
        No customers match the current search criteria or there are no customers
        in this tier.
      </p>
    </EmptyState>
  );

  return (
    <Page fullWidth>
      {selectedCustomer && (
        <CustomerLoyaltyCard
          customer={selectedCustomer}
          onClose={handleCloseCustomerModal}
        />
      )}
      <TitleBar title="Customers" />
      <Layout>
        <Layout.Section>
          {!success && (
            <Banner tone="critical">
              <p>Error loading customers: {error || "Unknown error"}</p>
            </Banner>
          )}

          <Card>
            <Tabs
              tabs={tabs}
              selected={selectedTab}
              onSelect={handleTabChange}
            />
            <div style={{ padding: "16px" }}>
              <TextField
                label=""
                value={searchValue}
                onChange={setSearchValue}
                placeholder="Search customers"
                clearButton
                onClearButtonClick={() => setSearchValue("")}
                autoComplete="off"
              />
            </div>

            <InlineStack align="space-between" gap="400">
              <Text as="p" variant="bodyMd">
                {customers.length} total customers, {sortedCustomers.length}{" "}
                filtered, showing page {currentPage} of {totalPages}
              </Text>
              <div>
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="tertiary"
                >
                  Previous
                </Button>
                <span style={{ margin: "0 10px" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  variant="tertiary"
                >
                  Next
                </Button>
              </div>
            </InlineStack>

            <IndexTable
              resourceName={resourceName}
              itemCount={rowMarkup.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: `Name${getSortIndicator("name")}` },
                { title: `Email${getSortIndicator("email")}` },
                { title: `Tier${getSortIndicator("tier")}` },
                { title: `Total Points${getSortIndicator("points")}` },
                { title: `Bonus Points${getSortIndicator("bonus")}` },
                { title: `Total Spent${getSortIndicator("spent")}` },
                { title: `Orders${getSortIndicator("orders")}` },
                { title: `Location${getSortIndicator("location")}` },
                { title: "Actions" },
              ]}
              sortable={[true, true, true, true, true, true, true]}
              sortDirection={sortDirection}
              sortColumnIndex={
                sortField === "name"
                  ? 0
                  : sortField === "email"
                    ? 1
                    : sortField === "tier"
                      ? 2
                      : sortField === "points"
                        ? 3
                        : sortField === "bonus"
                          ? 4
                          : sortField === "spent"
                            ? 5
                            : sortField === "orders"
                              ? 6
                              : sortField === "location"
                                ? 7
                                : 0
              }
              onSort={(index) => {
                const field =
                  index === 0
                    ? "name"
                    : index === 1
                      ? "email"
                      : index === 2
                        ? "tier"
                        : index === 3
                          ? "points"
                          : index === 4
                            ? "bonus"
                            : index === 5
                              ? "spent"
                              : index === 6
                                ? "orders"
                                : index === 7
                                  ? "location"
                                  : "name";
                handleSort(field);
              }}
              emptyState={emptyStateMarkup}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
