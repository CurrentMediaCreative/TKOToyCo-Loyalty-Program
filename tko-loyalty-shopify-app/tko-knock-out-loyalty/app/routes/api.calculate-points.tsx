import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActivePointEvents } from "../services/pointEvent.server";

interface CartLineItem {
  product_id: string;
  variant_id: string;
  title: string;
  quantity: number;
  price: number;
  product_type?: string;
  tags?: string;
  variant_title?: string;
}

interface CalculatePointsRequest {
  cartLines: CartLineItem[];
  subtotal: number;
  customerId?: string;
}

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

  // Check variant title for singles indicators
  if (lineItem.variant_title) {
    const variantTitle = lineItem.variant_title.toLowerCase();
    if (variantTitle.includes('single') || variantTitle.includes('singles')) {
      return true;
    }
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

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Authenticate the request
    const { admin } = await authenticate.admin(request);

    // Parse the request body
    const requestData: CalculatePointsRequest = await request.json();
    const { cartLines, subtotal } = requestData;

    // Calculate spend points (1:1 with subtotal before tax)
    const spendPoints = Math.floor(subtotal);

    // Get active point events
    const activeEvents = await getActivePointEvents();

    // Extract product IDs from cart lines
    const productIds = cartLines.map(item => item.product_id);

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
          (line) =>
            eventProductIds.includes(line.product_id) &&
            !isProductExcludedFromBonus(line)
        );

        if (matchingEligibleProducts.length > 0) {
          eventApplies = true;
          // Calculate bonus only for matching eligible products
          const matchingAmount = matchingEligibleProducts.reduce(
            (total, line) => total + line.price * line.quantity,
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
      spendPoints,
      bonusPoints: totalBonusPoints,
      totalPoints,
      bonusEligibleAmount,
      appliedEvents,
      activeEventsCount: activeEvents.length,
    });

  } catch (error) {
    console.error("Error calculating points:", error);
    return json(
      {
        success: false,
        error: "Failed to calculate points",
        spendPoints: 0,
        bonusPoints: 0,
        totalPoints: 0,
      },
      { status: 500 }
    );
  }
};

// Also support GET requests for testing
export const loader = async ({ request }: ActionFunctionArgs) => {
  return json({
    message: "Use POST to calculate points",
    example: {
      cartLines: [
        {
          product_id: "123",
          variant_id: "456",
          title: "Example Product",
          quantity: 1,
          price: 25.99,
          product_type: "Trading Cards",
        },
      ],
      subtotal: 25.99,
    },
  });
};
