import { useState, useCallback, useMemo } from "react";
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
import { getCustomerByShopifyId } from "../services/customer.server";
import { adjustCustomerBonusPoints } from "../services/pointTransaction.server";
import { CustomerLoyaltyCard } from "../components/CustomerLoyaltyCard";

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
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);

  // Get query parameters
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("search") || "";
  const tier = url.searchParams.get("tier") || "";
  const sort = url.searchParams.get("sort") || "totalPoints";
  const direction = url.searchParams.get("direction") || "desc";
  const forceSync = url.searchParams.get("sync") === "true";

  try {
    console.log(
      `Customers loader: page=${page}, search="${search}", tier="${tier}", sort=${sort}, direction=${direction}, forceSync=${forceSync}`,
    );
    const startTime = Date.now();

    // Import the customer service
    const { getCustomersPaginated, syncRecentCustomers, getSyncStats } =
      await import("../services/customer.server");

    // Check if we need to sync recent customers
    if (forceSync) {
      console.log("Force syncing customers...");
      await syncRecentCustomers(admin, 24); // Sync last 24 hours
    } else {
      // Check sync status and auto-sync if needed
      const syncStats = await getSyncStats();
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      if (!syncStats.lastSyncAt || syncStats.lastSyncAt < oneHourAgo) {
        console.log("Auto-syncing recent customers...");
        await syncRecentCustomers(admin, 1); // Sync last hour
      }
    }

    // Get customers from local database with pagination
    const customersPerPage = 50;
    const offset = (page - 1) * customersPerPage;

    const result = await getCustomersPaginated({
      limit: customersPerPage,
      offset,
      search,
      tier,
      sortBy: sort as any,
      sortDirection: direction as "asc" | "desc",
    });

    const loadTime = Date.now() - startTime;
    console.log(`Customers loaded in ${loadTime}ms`);

    return json({
      customers: result.customers,
      totalCount: result.totalCount,
      currentPage: page,
      totalPages: Math.ceil(result.totalCount / customersPerPage),
      hasNextPage: page < Math.ceil(result.totalCount / customersPerPage),
      hasPrevPage: page > 1,
      loadTime,
      success: true,
      error: null,
    });
  } catch (error) {
    console.error("Error in loader:", error);
    return json({
      customers: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      loadTime: 0,
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

  // Function to determine customer tier based on total points
  const getCustomerTier = (amountSpent: any, bonusPoints: number = 0) => {
    const spent = parseFloat(amountSpent?.amount || "0");
    const totalPoints = spent + bonusPoints; // $1 = 1 point, plus any bonus points

    if (totalPoints >= 100000) return "Reigning Champion";
    if (totalPoints >= 25000) return "Heavyweight";
    if (totalPoints >= 5000) return "Welterweight";
    if (totalPoints >= 1500) return "Lightweight";
    return "Featherweight";
  };

  // Function to get tier color
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

  // Handle sorting when a column header is clicked
  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        // Toggle direction if clicking the same field
        setSortDirection(
          sortDirection === "ascending" ? "descending" : "ascending",
        );
      } else {
        // Set new field and default to ascending
        setSortField(field);
        setSortDirection("ascending");
      }
    },
    [sortField, sortDirection],
  );

  // Get sort indicator for column headers
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return "";
    return sortDirection === "ascending" ? " ↑" : " ↓";
  };

  // Filter customers by search term and selected tab
  const filteredCustomers = customers
    .map((customer: any) => {
      // Calculate points
      const spentAmount = parseFloat(customer.amountSpent?.amount || "0");
      const bonusPoints = 0; // We'll get this from the database in the future
      const totalPoints = spentAmount + bonusPoints;

      // Add tier and points to each customer object
      return {
        ...customer,
        tier: getCustomerTier(customer.amountSpent, bonusPoints),
        name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        location: customer.defaultAddress
          ? `${customer.defaultAddress.city || ""}, ${customer.defaultAddress.province || ""} ${customer.defaultAddress.country || ""}`
          : "No address",
        spent: `$${spentAmount.toFixed(2)}`, // Format as string for CustomerLoyaltyCard compatibility
        spentAmount: spentAmount,
        spendPoints: spentAmount,
        bonusPoints: bonusPoints,
        totalPoints: totalPoints,
        orders: customer.numberOfOrders || 0, // Ensure orders is available
      };
    })
    .filter((customer: any) => {
      // Filter by tier if a tab other than "All" is selected
      if (selectedTab > 0 && customer.tier !== tabs[selectedTab].content) {
        return false;
      }

      // Filter by search term
      if (!searchValue) return true;

      const searchRegex = new RegExp(searchValue, "i");
      return (
        searchRegex.test(customer.name) ||
        searchRegex.test(customer.email || "") ||
        searchRegex.test(customer.phone || "")
      );
    });

  // Sort the filtered customers
  const sortedCustomers = useMemo(
    () =>
      [...filteredCustomers].sort((a, b) => {
        let valueA, valueB;

        switch (sortField) {
          case "name":
            valueA = a.name || "";
            valueB = b.name || "";
            break;
          case "email":
            valueA = a.email || "";
            valueB = b.email || "";
            break;
          case "tier":
            // Custom tier sorting by level instead of alphabetically
            const tierOrder: Record<string, number> = {
              Featherweight: 1,
              Lightweight: 2,
              Welterweight: 3,
              Heavyweight: 4,
              "Reigning Champion": 5,
            };
            valueA = tierOrder[a.tier as string] || 0;
            valueB = tierOrder[b.tier as string] || 0;
            break;
          case "points":
            valueA = a.totalPoints || 0;
            valueB = b.totalPoints || 0;
            break;
          case "bonus":
            valueA = a.bonusPoints || 0;
            valueB = b.bonusPoints || 0;
            break;
          case "spent":
            valueA = a.spentAmount;
            valueB = b.spentAmount;
            break;
          case "orders":
            valueA = a.numberOfOrders || 0;
            valueB = b.numberOfOrders || 0;
            break;
          case "location":
            valueA = a.location || "";
            valueB = b.location || "";
            break;
          default:
            valueA = a.name || "";
            valueB = b.name || "";
        }

        // For string comparisons
        if (typeof valueA === "string" && typeof valueB === "string") {
          return sortDirection === "ascending"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }

        // For numeric comparisons
        return sortDirection === "ascending"
          ? (valueA as number) - (valueB as number)
          : (valueB as number) - (valueA as number);
      }),
    [filteredCustomers, sortField, sortDirection],
  );

  // Get current page customers
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = sortedCustomers.slice(
    indexOfFirstCustomer,
    indexOfLastCustomer,
  );

  // Calculate total pages
  const totalPages = Math.ceil(sortedCustomers.length / customersPerPage);

  // Change page
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle bonus points editing
  const handleBonusPointsEdit = (
    customerId: string,
    currentBonusPoints: number,
  ) => {
    setEditingBonusPoints(customerId);
    setBonusPointsValue(currentBonusPoints.toString());
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
