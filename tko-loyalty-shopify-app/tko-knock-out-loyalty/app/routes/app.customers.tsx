import { useState } from "react";
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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Fetch customers from Shopify
  const response = await admin.graphql(
    `#graphql
      query GetCustomers($first: Int!) {
        customers(first: $first) {
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
          }
        }
      }`,
    {
      variables: {
        first: 50,
      },
    },
  );

  const responseJson = await response.json();
  const customers =
    responseJson.data?.customers?.edges.map((edge: any) => edge.node) || [];

  return json({
    customers,
  });
};

export default function CustomersPage() {
  const { customers } = useLoaderData<typeof loader>();
  const [searchValue, setSearchValue] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);

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

  const filteredCustomers = customers.filter((customer: any) => {
    const searchRegex = new RegExp(searchValue, "i");
    return (
      searchRegex.test(customer.firstName) ||
      searchRegex.test(customer.lastName) ||
      searchRegex.test(customer.email) ||
      searchRegex.test(customer.phone)
    );
  });

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

  const rowMarkup = filteredCustomers
    .map((customer: any, index: number) => {
      const tier = getCustomerTier(customer.amountSpent);

      // Filter by tier if a tab other than "All" is selected
      if (selectedTab > 0 && tier !== tabs[selectedTab].content) {
        return null;
      }

      const id = customer.id.replace("gid://shopify/Customer/", "");
      const name = `${customer.firstName} ${customer.lastName}`;
      const location = customer.defaultAddress
        ? `${customer.defaultAddress.city}, ${customer.defaultAddress.province || ""} ${customer.defaultAddress.country}`
        : "No address";

      return (
        <IndexTable.Row
          id={id}
          key={id}
          selected={selectedResources.includes(id)}
          position={index}
        >
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {name}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{customer.email}</IndexTable.Cell>
          <IndexTable.Cell>
            <Badge tone={getTierColor(tier) as any}>{tier}</Badge>
          </IndexTable.Cell>
          <IndexTable.Cell>
            ${parseFloat(customer.amountSpent?.amount || "0").toFixed(2)}
          </IndexTable.Cell>
          <IndexTable.Cell>{customer.numberOfOrders}</IndexTable.Cell>
          <IndexTable.Cell>{location}</IndexTable.Cell>
        </IndexTable.Row>
      );
    })
    .filter(Boolean); // Remove null rows (filtered out by tier)

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
            <IndexTable
              resourceName={resourceName}
              itemCount={rowMarkup.length}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Name" },
                { title: "Email" },
                { title: "Tier" },
                { title: "Total spent" },
                { title: "Orders" },
                { title: "Location" },
              ]}
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
