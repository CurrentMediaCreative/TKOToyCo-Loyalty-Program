import { useState, useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

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
        const queryVariables: { first: number; after?: string } = cursor
          ? { first: PER_PAGE, after: cursor }
          : { first: PER_PAGE };

        const response: any = await admin.graphql(
          `#graphql
            query GetCustomers($first: Int!, $after: String) {
              customers(first: $first, after: $after) {
                edges {
                  node {
                    id
                    firstName
                    lastName
                    email
                    phone
                    numberOfOrders
                    amountSpent {
                      amount
                    }
                    tags
                    createdAt
                    defaultAddress {
                      city
                      province
                      country
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
        const pageCustomers = customersData.edges.map((edge: any) => edge.node);
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

  try {
    const customers = await fetchAllCustomers();
    return json({
      customers,
      success: true,
      error: null, // Add error property with null value for success case
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
  const [searchValue, setSearchValue] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortField, setSortField] = useState("spent");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("descending");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 50;

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

  // Function to determine customer tier based on total spent
  const getCustomerTier = (amountSpent: any) => {
    const spent = parseFloat(amountSpent?.amount || "0");
    if (spent >= 100000) return "Reigning Champion"; // Added top tier with high spend threshold
    if (spent >= 25000) return "Heavyweight";
    if (spent >= 5000) return "Welterweight";
    if (spent >= 1500) return "Lightweight";
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
      // Add tier to each customer object
      return {
        ...customer,
        tier: getCustomerTier(customer.amountSpent),
        name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        location: customer.defaultAddress
          ? `${customer.defaultAddress.city || ""}, ${customer.defaultAddress.province || ""} ${customer.defaultAddress.country || ""}`
          : "No address",
        spentAmount: parseFloat(customer.amountSpent?.amount || "0"),
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
        <IndexTable.Cell>${customer.spentAmount.toFixed(2)}</IndexTable.Cell>
        <IndexTable.Cell>{customer.numberOfOrders || 0}</IndexTable.Cell>
        <IndexTable.Cell>{customer.location}</IndexTable.Cell>
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
            <div style={{ padding: "16px", display: "flex" }}>
              <div style={{ flex: 1 }}>
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
              <div style={{ marginLeft: "16px" }}>
                <Button variant="primary">Add to tier</Button>
              </div>
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
                { title: `Total spent${getSortIndicator("spent")}` },
                { title: `Orders${getSortIndicator("orders")}` },
                { title: `Location${getSortIndicator("location")}` },
              ]}
              sortable={[true, true, true, true, true, true]}
              sortDirection={sortDirection}
              sortColumnIndex={
                sortField === "name"
                  ? 0
                  : sortField === "email"
                    ? 1
                    : sortField === "tier"
                      ? 2
                      : sortField === "spent"
                        ? 3
                        : sortField === "orders"
                          ? 4
                          : sortField === "location"
                            ? 5
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
                          ? "spent"
                          : index === 4
                            ? "orders"
                            : index === 5
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
