import { useState } from "react";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  Text,
  Banner,
  ProgressBar,
  BlockStack,
  Box,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { bulkUpdateAllCustomerMetafields } from "../services/metafields.server";

// Action function to handle the bulk update
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Perform the bulk update
    const results = await bulkUpdateAllCustomerMetafields(admin);

    return json({
      success: true,
      results,
      error: null,
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return json({
      success: false,
      results: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export default function MetafieldsPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isLoading = navigation.state === "submitting";
  const hasResults = actionData?.results !== null && actionData?.success;
  const hasError = actionData?.error !== null && !actionData?.success;

  // Handle the bulk update button click
  const handleBulkUpdate = () => {
    if (showConfirmation) {
      submit({}, { method: "post" });
      setShowConfirmation(false);
    } else {
      setShowConfirmation(true);
    }
  };

  return (
    <Page>
      <TitleBar title="Customer Metafields" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Sync Customer Tier Information to Shopify
                </Text>
                <Text as="p" variant="bodyMd">
                  This will update all customers' metafields in Shopify with
                  their current tier information from our database. This process
                  may take several minutes depending on the number of customers.
                </Text>
              </BlockStack>

              {showConfirmation && !isLoading && !hasResults && (
                <Banner tone="warning">
                  <p>
                    Are you sure you want to update metafields for all
                    customers? This will overwrite any existing metafield
                    values.
                  </p>
                </Banner>
              )}

              {isLoading && (
                <BlockStack gap="400">
                  <Text as="p" variant="bodyMd">
                    Updating customer metafields... This may take a few minutes.
                  </Text>
                  <ProgressBar progress={50} size="small" />
                </BlockStack>
              )}

              {hasResults && (
                <Banner tone="success">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      Metafields update completed!
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Total customers: {actionData?.results?.total}
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Successfully updated: {actionData?.results?.successful}
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Failed updates: {actionData?.results?.failed}
                    </Text>
                  </BlockStack>
                </Banner>
              )}

              {hasError && (
                <Banner tone="critical">
                  <p>Error: {actionData?.error}</p>
                </Banner>
              )}

              {actionData?.results?.errors &&
                actionData.results.errors.length > 0 && (
                  <Card>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Errors ({actionData.results.errors.length})
                      </Text>
                      <Box paddingBlockStart="400">
                        {actionData.results.errors.map((error, index) => (
                          <Banner key={index} tone="critical">
                            <Text as="p" variant="bodyMd">
                              Customer ID: {error.customerId}
                            </Text>
                            <Text as="p" variant="bodyMd">
                              Error: {error.error}
                            </Text>
                          </Banner>
                        ))}
                      </Box>
                    </BlockStack>
                  </Card>
                )}

              <Box paddingBlockStart="400">
                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    onClick={handleBulkUpdate}
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {showConfirmation
                      ? "Confirm Update"
                      : "Update All Customer Metafields"}
                  </Button>
                  {showConfirmation && (
                    <Button onClick={() => setShowConfirmation(false)}>
                      Cancel
                    </Button>
                  )}
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
