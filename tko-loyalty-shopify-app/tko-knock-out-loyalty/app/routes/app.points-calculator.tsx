import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getActivePointEvents } from "../services/pointEvent.server";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  TextField,
  BlockStack,
  InlineStack,
  Badge,
  DataTable,
  Banner,
  Divider,
  FormLayout,
} from "@shopify/polaris";
import { useState } from "react";

interface CartLineItem {
  product_id: string;
  title: string;
  quantity: number;
  price: number;
  product_type?: string;
  tags?: string;
}

interface PointsCalculation {
  spendPoints: number;
  bonusPoints: number;
  totalPoints: number;
  bonusEligibleAmount: number;
  appliedEvents: Array<{
    eventId: string;
    eventName: string;
    bonusPoints: number;
    bonusPercentage: number;
  }>;
  activeEventsCount: number;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Get active point events
    const activeEvents = await getActivePointEvents();

    return json({
      success: true,
      activeEvents,
    });
  } catch (error) {
    console.error("Error loading points calculator:", error);
    return json({
      success: false,
      error: "Failed to load calculator",
      activeEvents: [],
    });
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const formData = await request.formData();
    const cartData = formData.get("cartData") as string;
    
    if (!cartData) {
      return json({ error: "No cart data provided" }, { status: 400 });
    }

    const { cartLines, subtotal } = JSON.parse(cartData);

    // Calculate points using the same logic as the API
    const spendPoints = Math.floor(subtotal);
    const activeEvents = await getActivePointEvents();
    const productIds = cartLines.map((item: CartLineItem) => item.product_id);

    // Calculate bonus-eligible amount (excluding singles)
    const bonusEligibleAmount = calculateBonusEligibleAmount(cartLines);

    let totalBonusPoints = 0;
    const appliedEvents: Array<{
      eventId: string;
      eventName: string;
      bonusPoints: number;
      bonusPercentage: number;
    }> = [];

    // Process each active event
    for (const event of activeEvents) {
      let eventApplies = false;
      let bonusAmount = 0;

      // For store-wide events, apply to the bonus-eligible amount
      if (event.eventType === "store-wide") {
        eventApplies = true;
        bonusAmount = (bonusEligibleAmount * event.bonusPercentage) / 100;
      }
      // For product-specific events, check if any products match
      else if (
        event.eventType === "product-specific" &&
        event.productIds &&
        productIds.length > 0
      ) {
        const eventProductIds = JSON.parse(event.productIds) as string[];

        // Find matching products that are also eligible for bonus points
        const matchingEligibleProducts = cartLines.filter(
          (line: CartLineItem) =>
            eventProductIds.includes(line.product_id) &&
            !isProductExcludedFromBonus(line)
        );

        if (matchingEligibleProducts.length > 0) {
          eventApplies = true;
          // Calculate bonus only for matching eligible products
          const matchingAmount = matchingEligibleProducts.reduce(
            (total: number, line: CartLineItem) => total + line.price * line.quantity,
            0
          );
          bonusAmount = (matchingAmount * event.bonusPercentage) / 100;
        }
      }

      // If the event applies, add to bonus points
      if (eventApplies && bonusAmount > 0) {
        // Round to 2 decimal places
        bonusAmount = Math.round(bonusAmount * 100) / 100;

        totalBonusPoints += bonusAmount;
        appliedEvents.push({
          eventId: event.id,
          eventName: event.name,
          bonusPoints: bonusAmount,
          bonusPercentage: event.bonusPercentage,
        });
      }
    }

    // Round total bonus points
    totalBonusPoints = Math.round(totalBonusPoints * 100) / 100;

    // Calculate total points
    const totalPoints = spendPoints + totalBonusPoints;

    return json({
      success: true,
      calculation: {
        spendPoints,
        bonusPoints: totalBonusPoints,
        totalPoints,
        bonusEligibleAmount,
        appliedEvents,
        activeEventsCount: activeEvents.length,
      } as PointsCalculation,
    });

  } catch (error) {
    console.error("Error calculating points:", error);
    return json({ error: "Failed to calculate points" }, { status: 500 });
  }
};

/**
 * Determines if a product should be excluded from bonus points (i.e., if it's a "singles" product)
 */
function isProductExcludedFromBonus(lineItem: CartLineItem): boolean {
  // Check product type for singles indicators
  if (lineItem.product_type) {
    const productType = lineItem.product_type.toLowerCase();
    if (productType.includes('single') || productType.includes('singles')) {
      return true;
    }
  }

  // Check tags for singles indicators
  if (lineItem.tags) {
    const tags = lineItem.tags.toLowerCase();
    if (tags.includes('single') || tags.includes('singles')) {
      return true;
    }
  }

  // Check title for singles indicators
  const title = lineItem.title.toLowerCase();
  if (title.includes('single') || title.includes('singles')) {
    return true;
  }

  return false;
}

/**
 * Calculates the order amount excluding singles products for bonus point calculation
 */
function calculateBonusEligibleAmount(lineItems: CartLineItem[]): number {
  let eligibleAmount = 0;

  for (const lineItem of lineItems) {
    if (!isProductExcludedFromBonus(lineItem)) {
      // Calculate line total: price * quantity
      const lineTotal = lineItem.price * lineItem.quantity;
      eligibleAmount += lineTotal;
    }
  }

  return Math.max(0, eligibleAmount); // Ensure non-negative
}

type LoaderData = 
  | { success: true; activeEvents: any[] }
  | { success: false; error: string; activeEvents: any[] };

type ActionData = 
  | { success: true; calculation: PointsCalculation }
  | { error: string };

export default function PointsCalculator() {
  const data = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  const [cartInput, setCartInput] = useState(`{
  "cartLines": [
    {
      "product_id": "123456789",
      "title": "Pokemon Trading Card Game Booster Pack",
      "quantity": 2,
      "price": 4.99,
      "product_type": "Trading Cards",
      "tags": "pokemon,tcg,booster"
    },
    {
      "product_id": "987654321",
      "title": "Charizard Single Card",
      "quantity": 1,
      "price": 25.00,
      "product_type": "Single Card",
      "tags": "pokemon,single,charizard"
    }
  ],
  "subtotal": 34.98
}`);

  if (!data.success) {
    return (
      <Page title="Points Calculator - Error">
        <Layout>
          <Layout.Section>
            <Banner tone="critical">
              <Text as="p">Error loading calculator: {data.error}</Text>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Loyalty Points Calculator">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Test Points Calculation
              </Text>
              <Text as="p" tone="subdued">
                Test how points are calculated for different cart scenarios. This simulates what customers will see during checkout.
              </Text>
              
              <Form method="post">
                <FormLayout>
                  <TextField
                    label="Cart Data (JSON)"
                    value={cartInput}
                    onChange={setCartInput}
                    multiline={10}
                    helpText="Enter cart data in JSON format to test points calculation"
                    autoComplete="off"
                  />
                  
                  <input type="hidden" name="cartData" value={cartInput} />
                  
                  <Button submit variant="primary">
                    Calculate Points
                  </Button>
                </FormLayout>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        {actionData && (
          <Layout.Section>
            {'success' in actionData && actionData.success ? (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Points Calculation Result
                  </Text>
                  
                  <InlineStack gap="400">
                    <Badge tone="info">
                      {`Spend Points: ${actionData.calculation.spendPoints}`}
                    </Badge>
                    <Badge tone="success">
                      {`Bonus Points: ${actionData.calculation.bonusPoints}`}
                    </Badge>
                    <Badge tone="attention">
                      {`Total Points: ${actionData.calculation.totalPoints}`}
                    </Badge>
                  </InlineStack>

                  <Text as="p">
                    <strong>Bonus Eligible Amount:</strong> ${actionData.calculation.bonusEligibleAmount.toFixed(2)}
                  </Text>

                  {actionData.calculation.appliedEvents.length > 0 && (
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Applied Bonus Events
                      </Text>
                      {actionData.calculation.appliedEvents.map((event) => (
                        <Text key={event.eventId} as="p">
                          • <strong>{event.eventName}</strong>: +{event.bonusPoints} points ({event.bonusPercentage}% bonus)
                        </Text>
                      ))}
                    </BlockStack>
                  )}

                  <Text as="p" tone="subdued">
                    Active Events: {actionData.calculation.activeEventsCount}
                  </Text>
                </BlockStack>
              </Card>
            ) : (
              <Banner tone="critical">
                <Text as="p">Error: {'error' in actionData ? actionData.error : 'Unknown error'}</Text>
              </Banner>
            )}
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Active Point Events ({data.activeEvents.length})
              </Text>
              
              {data.activeEvents.length > 0 ? (
                <DataTable
                  columnContentTypes={['text', 'text', 'numeric', 'text']}
                  headings={['Event Name', 'Type', 'Bonus %', 'Status']}
                  rows={data.activeEvents.map((event) => [
                    event.name,
                    event.eventType,
                    `${event.bonusPercentage}%`,
                    <Badge key={event.id} tone="success">Active</Badge>
                  ])}
                />
              ) : (
                <Text as="p" tone="subdued">
                  No active point events. Create some events to test bonus point calculations.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
