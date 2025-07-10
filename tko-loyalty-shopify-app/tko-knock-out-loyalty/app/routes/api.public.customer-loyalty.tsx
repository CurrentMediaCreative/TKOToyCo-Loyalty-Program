import { json, type LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";

interface CustomerLoyaltyResponse {
  success: boolean;
  customer?: {
    id: string;
    name: string;
    email: string;
    tier: string;
    totalPoints: number;
  };
  cartCalculation?: {
    cartTotal: number;
    basePoints: number;
    bonusPoints: number;
    totalPoints: number;
    appliedEvents: Array<{
      eventId: string;
      eventName: string;
      bonusPoints: number;
      bonusPercentage: number;
    }>;
  };
  error?: string;
}

/**
 * Get customer by email from database
 */
async function getCustomerByEmail(email: string) {
  try {
    const customer = await db.customer.findFirst({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalPoints: true,
        tier: {
          select: {
            name: true,
          },
        },
      },
    });

    if (customer) {
      return {
        id: customer.id,
        name:
          `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
          "Valued Customer",
        email: customer.email || "",
        tier: customer.tier?.name || "Featherweight",
        totalPoints: customer.totalPoints || 0,
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

/**
 * Get active point events from database
 */
async function getActivePointEvents() {
  try {
    const now = new Date();

    const activeEvents = await db.pointEvent.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      select: {
        id: true,
        name: true,
        eventType: true,
        bonusPercentage: true,
        productIds: true,
        collections: true,
      },
    });

    return activeEvents;
  } catch (error) {
    console.error("Error fetching active point events:", error);
    return [];
  }
}

/**
 * Calculate bonus points for cart total
 * This is a simplified version for theme display - assumes store-wide events apply
 */
function calculateBonusPoints(cartTotal: number, activeEvents: any[]) {
  let totalBonusPoints = 0;
  const appliedEvents: Array<{
    eventId: string;
    eventName: string;
    bonusPoints: number;
    bonusPercentage: number;
  }> = [];

  // For theme display, we'll apply store-wide events to the full cart total
  // This is a simplified calculation since we don't have detailed product info
  for (const event of activeEvents) {
    if (event.eventType === "store-wide") {
      const bonusAmount = (cartTotal * event.bonusPercentage) / 100;
      const roundedBonus = Math.round(bonusAmount * 100) / 100;

      if (roundedBonus > 0) {
        totalBonusPoints += roundedBonus;
        appliedEvents.push({
          eventId: event.id,
          eventName: event.name,
          bonusPoints: roundedBonus,
          bonusPercentage: event.bonusPercentage,
        });
      }
    }
  }

  return {
    bonusPoints: Math.round(totalBonusPoints * 100) / 100,
    appliedEvents,
  };
}

/**
 * Calculate bonus points with detailed cart items data
 * This enhanced version can check specific products and collections
 */
function calculateBonusPointsWithItems(
  cartTotal: number,
  cartItems: any[],
  activeEvents: any[],
) {
  let totalBonusPoints = 0;
  const appliedEvents: Array<{
    eventId: string;
    eventName: string;
    bonusPoints: number;
    bonusPercentage: number;
  }> = [];

  for (const event of activeEvents) {
    let eventBonusPoints = 0;

    if (event.eventType === "store-wide") {
      // Apply to entire cart
      eventBonusPoints = (cartTotal * event.bonusPercentage) / 100;
    } else if (event.eventType === "product-specific" && event.productIds) {
      // Apply to specific products
      const productIds = Array.isArray(event.productIds)
        ? event.productIds
        : JSON.parse(event.productIds || "[]");

      for (const item of cartItems) {
        if (productIds.includes(item.product_id?.toString())) {
          eventBonusPoints += (item.line_price * event.bonusPercentage) / 100;
        }
      }
    } else if (event.eventType === "collection-specific" && event.collections) {
      // Apply to products in specific collections
      const eventCollections = Array.isArray(event.collections)
        ? event.collections
        : JSON.parse(event.collections || "[]");

      for (const item of cartItems) {
        const itemCollections = item.collections || [];
        const hasMatchingCollection = eventCollections.some(
          (eventCollection: string) =>
            itemCollections.some(
              (itemCollection: string) =>
                itemCollection
                  .toLowerCase()
                  .includes(eventCollection.toLowerCase()) ||
                eventCollection
                  .toLowerCase()
                  .includes(itemCollection.toLowerCase()),
            ),
        );

        if (hasMatchingCollection) {
          eventBonusPoints += (item.line_price * event.bonusPercentage) / 100;
        }
      }
    }

    const roundedBonus = Math.round(eventBonusPoints * 100) / 100;
    if (roundedBonus > 0) {
      totalBonusPoints += roundedBonus;
      appliedEvents.push({
        eventId: event.id,
        eventName: event.name,
        bonusPoints: roundedBonus,
        bonusPercentage: event.bonusPercentage,
      });
    }
  }

  return {
    bonusPoints: Math.round(totalBonusPoints * 100) / 100,
    appliedEvents,
  };
}

// Handle CORS for theme access
function setCorsHeaders(response: Response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Shopify-Shop-Domain, X-Customer-Email",
  );
  return response;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return setCorsHeaders(new Response(null, { status: 200 }));
    }

    const url = new URL(request.url);
    const customerEmail =
      url.searchParams.get("customerEmail") ||
      request.headers.get("X-Customer-Email");
    const cartTotal = parseFloat(url.searchParams.get("cartTotal") || "0");

    // Validate cart total
    if (isNaN(cartTotal) || cartTotal < 0) {
      return setCorsHeaders(
        json(
          {
            success: false,
            error: "Invalid cart total",
          } as CustomerLoyaltyResponse,
          { status: 400 },
        ),
      );
    }

    let customer = null;

    // Try to get customer if email is provided
    if (customerEmail) {
      customer = await getCustomerByEmail(customerEmail);
    }

    // Get active events for bonus calculation
    const activeEvents = await getActivePointEvents();

    // Calculate cart points
    const basePoints = Math.floor(cartTotal);
    const { bonusPoints, appliedEvents } = calculateBonusPoints(
      cartTotal,
      activeEvents,
    );
    const totalCartPoints = basePoints + bonusPoints;

    const response: CustomerLoyaltyResponse = {
      success: true,
      customer: customer || undefined,
      cartCalculation: {
        cartTotal,
        basePoints,
        bonusPoints,
        totalPoints: totalCartPoints,
        appliedEvents,
      },
    };

    return setCorsHeaders(json(response));
  } catch (error) {
    console.error("Error in customer loyalty API:", error);
    return setCorsHeaders(
      json(
        {
          success: false,
          error: "Failed to load loyalty data",
        } as CustomerLoyaltyResponse,
        { status: 500 },
      ),
    );
  }
};

// Handle POST requests with cart items data
export const action = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return setCorsHeaders(new Response(null, { status: 200 }));
    }

    if (request.method !== "POST") {
      return setCorsHeaders(
        json(
          {
            success: false,
            error: "Method not allowed. Use POST.",
          } as CustomerLoyaltyResponse,
          { status: 405 },
        ),
      );
    }

    // Parse request body
    const body = await request.json();
    const { cartTotal, cartItems, customerEmail } = body;

    // Validate cart total
    if (isNaN(cartTotal) || cartTotal < 0) {
      return setCorsHeaders(
        json(
          {
            success: false,
            error: "Invalid cart total",
          } as CustomerLoyaltyResponse,
          { status: 400 },
        ),
      );
    }

    let customer = null;

    // Try to get customer if email is provided
    if (customerEmail) {
      customer = await getCustomerByEmail(customerEmail);
    }

    // Get active events for bonus calculation
    const activeEvents = await getActivePointEvents();

    // Calculate cart points (enhanced with cart items if available)
    const basePoints = Math.floor(cartTotal);
    const { bonusPoints, appliedEvents } = calculateBonusPointsWithItems(
      cartTotal,
      cartItems || [],
      activeEvents,
    );
    const totalCartPoints = basePoints + bonusPoints;

    const response: CustomerLoyaltyResponse = {
      success: true,
      customer: customer || undefined,
      cartCalculation: {
        cartTotal,
        basePoints,
        bonusPoints,
        totalPoints: totalCartPoints,
        appliedEvents,
      },
    };

    return setCorsHeaders(json(response));
  } catch (error) {
    console.error("Error in customer loyalty POST API:", error);
    return setCorsHeaders(
      json(
        {
          success: false,
          error: "Failed to process cart data",
        } as CustomerLoyaltyResponse,
        { status: 500 },
      ),
    );
  }
};
