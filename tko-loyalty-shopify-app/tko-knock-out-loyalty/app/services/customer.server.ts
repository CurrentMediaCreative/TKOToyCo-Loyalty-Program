import prisma from "../db.server";
import { getTiers } from "./tier.server";
import { updateCustomerTierMetafields } from "./metafields.server";
import type { Admin } from "../types";

// Define a type that includes the point fields
type CustomerWithPoints = {
  id: string;
  shopifyId: bigint;
  email: string | null;
  emails: string[];
  firstName: string | null;
  lastName: string | null;
  totalSpend: number;
  spendPoints: number;
  bonusPoints: number;
  totalPoints: number;
  totalStoreCreditUsed: number;
  loyaltyEligibleSpend: number;
  tierId: string | null;
  tier?: any;
  metafieldId: string | null;
  lastOrderDate: Date | null;
  createdAt: Date;
  shopifyCreatedAt?: Date | null;
  updatedAt: Date;
};

export async function getCustomers() {
  return prisma.customer.findMany({
    include: {
      tier: true,
    },
    orderBy: {
      totalPoints: "desc",
    },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      tier: true,
    },
  }) as Promise<CustomerWithPoints | null>;
}

export async function getCustomerByShopifyId(shopifyId: number) {
  return prisma.customer.findUnique({
    where: { shopifyId: BigInt(shopifyId) },
    include: {
      tier: true,
    },
  }) as Promise<CustomerWithPoints | null>;
}

export async function createOrUpdateCustomer({
  shopifyId,
  email,
  firstName,
  lastName,
  totalSpend,
  bonusPoints,
  lastOrderDate,
  admin,
}: {
  shopifyId: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  totalSpend?: number;
  bonusPoints?: number;
  lastOrderDate?: Date;
  admin?: Admin; // Optional Shopify admin API context for metafield updates
}) {
  // Generate a unique ID based on the Shopify ID
  const id = `cust_${shopifyId}`;

  // Calculate points from spend (1:1 ratio, rounded to nearest dollar)
  const spendPoints = totalSpend !== undefined ? Math.round(totalSpend) : 0;

  // OPTIMIZED: Single query to get existing customer data (bonusPoints + emails)
  // This reduces DB round-trips from 2 queries to 1
  const existingCustomer = await prisma.customer.findUnique({
    where: { shopifyId: BigInt(shopifyId) },
    select: { bonusPoints: true, emails: true },
  });

  const existingBonusPoints = existingCustomer?.bonusPoints || 0;
  const existingEmails = existingCustomer?.emails || [];

  // Use provided bonus points or existing ones
  const updatedBonusPoints =
    bonusPoints !== undefined ? bonusPoints : existingBonusPoints;

  // Calculate total points (spend points + bonus points)
  const calculatedTotalPoints = spendPoints + updatedBonusPoints;

  // Find the appropriate tier based on total points
  let tierId = null;
  if (calculatedTotalPoints !== undefined) {
    const tiers = await getTiers();
    // Sort tiers by minPoints in ascending order
    const sortedTiers = tiers.sort(
      (a: any, b: any) => a.minPoints - b.minPoints,
    );

    // Find the highest tier that the customer qualifies for
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (calculatedTotalPoints >= sortedTiers[i].minPoints) {
        tierId = sortedTiers[i].id;
        break;
      }
    }
  }

  // Handle emails array - add email to emails array if provided and not already present
  let emailsToUpdate: string[] | undefined;
  if (email && !existingEmails.includes(email)) {
    emailsToUpdate = [...existingEmails, email];
  }

  // Create or update the customer in our database
  const customer = await prisma.customer.upsert({
    where: { shopifyId: BigInt(shopifyId) },
    update: {
      email,
      emails: emailsToUpdate,
      firstName,
      lastName,
      totalSpend: totalSpend !== undefined ? Math.round(totalSpend) : undefined,
      spendPoints: spendPoints,
      bonusPoints: updatedBonusPoints,
      totalPoints: calculatedTotalPoints,
      tierId,
      lastOrderDate,
    },
    create: {
      id,
      shopifyId: BigInt(shopifyId),
      email,
      emails: email ? [email] : [],
      firstName,
      lastName,
      totalSpend: Math.round(totalSpend || 0),
      spendPoints: spendPoints,
      bonusPoints: updatedBonusPoints,
      totalPoints: calculatedTotalPoints,
      tierId,
      lastOrderDate,
    },
  });

  // If admin API context is provided and the customer has a tier, update their metafields
  if (admin && tierId) {
    try {
      const metafieldResult = await updateCustomerTierMetafields(
        admin,
        shopifyId,
        tierId,
        customer.totalSpend,
        customer.spendPoints,
        customer.bonusPoints,
        customer.totalPoints,
      );

      // Check if the metafield update was skipped due to authentication issues
      if (metafieldResult?.skipped) {
        console.log(
          `⚠️ Metafield update skipped for customer ${shopifyId} (authentication issue - expected in webhook context)`,
        );
      } else {
        console.log(`✅ Updated metafields for customer ${shopifyId}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if this is an authentication error (common in webhook context)
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        console.log(
          `⚠️ Metafield update failed for customer ${shopifyId} due to authentication - this is expected in webhook context`,
        );
      } else {
        console.error(
          `❌ Failed to update metafields for customer ${shopifyId}:`,
          errorMessage,
        );
      }
      // Don't throw the error - we still want to return the customer even if metafield update fails
    }
  }

  return customer;
}

/**
 * Get customers with pagination and filtering
 */
export async function getCustomersPaginated({
  limit = 50,
  offset = 0,
  search = "",
  tier = "",
  sortBy = "totalPoints",
  sortDirection = "desc",
}: {
  limit?: number;
  offset?: number;
  search?: string;
  tier?: string;
  sortBy?:
    | "totalPoints"
    | "totalSpend"
    | "bonusPoints"
    | "firstName"
    | "lastName"
    | "email";
  sortDirection?: "asc" | "desc";
}) {
  const where: any = {};

  // Add search filter
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Add tier filter
  if (tier && tier !== "all") {
    const tierMap: Record<string, number> = {
      Featherweight: 0,
      Lightweight: 1500,
      Welterweight: 5000,
      Heavyweight: 25000,
      "Reigning Champion": 100000,
    };

    const minPoints = tierMap[tier];
    if (minPoints !== undefined) {
      if (tier === "Reigning Champion") {
        where.totalPoints = { gte: minPoints };
      } else {
        const nextTierPoints =
          Object.values(tierMap).find((p) => p > minPoints) || Infinity;
        where.totalPoints = { gte: minPoints, lt: nextTierPoints };
      }
    }
  }

  // Get total count for pagination
  const totalCount = await prisma.customer.count({ where });

  // Get customers with pagination
  const customers = (await prisma.customer.findMany({
    where,
    include: {
      tier: true,
    },
    orderBy: {
      [sortBy]: sortDirection,
    },
    take: limit,
    skip: offset,
  })) as unknown as CustomerWithPoints[];

  return {
    customers,
    totalCount,
  };
}

/**
 * Sync recent customers from Shopify
 */
export async function syncRecentCustomers(admin: any, hoursBack: number = 1) {
  const { syncRecentCustomers: syncRecentCustomersFromShopify } = await import(
    "./customerSync.server"
  );
  return syncRecentCustomersFromShopify(admin, hoursBack);
}

/**
 * Get sync statistics
 */
export async function getSyncStats() {
  // Get the most recent customer update as a proxy for last sync
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return {
    lastSyncAt: lastCustomer?.updatedAt || null,
  };
}

export async function deleteCustomer(id: string) {
  return prisma.customer.delete({
    where: { id },
  });
}

export async function updateCustomerTier(
  id: string,
  tierId: string | null,
  admin?: Admin, // Optional Shopify admin API context for metafield updates
) {
  // Update the customer in our database
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      tierId,
    },
    include: {
      tier: true,
    },
  });

  // If admin API context is provided and the customer has a tier, update their metafields
  if (admin && tierId) {
    try {
      await updateCustomerTierMetafields(
        admin,
        Number(customer.shopifyId),
        tierId,
        customer.totalSpend,
        customer.spendPoints,
        customer.bonusPoints,
        customer.totalPoints,
      );
      console.log(`Updated metafields for customer ${customer.shopifyId}`);
    } catch (error) {
      console.error(
        `Failed to update metafields for customer ${customer.shopifyId}:`,
        error,
      );
      // Don't throw the error - we still want to return the customer even if metafield update fails
    }
  }

  return customer;
}

/**
 * Updates a customer's bonus points
 */
export async function updateCustomerBonusPoints(
  id: string,
  bonusPoints: number,
  admin?: Admin, // Optional Shopify admin API context for metafield updates
) {
  // Get the customer to calculate new total points
  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
    select: { spendPoints: true, tierId: true, shopifyId: true },
  });

  if (!existingCustomer) {
    throw new Error(`Customer with ID ${id} not found`);
  }

  // Calculate new total points
  const totalPoints = existingCustomer.spendPoints + bonusPoints;

  // Find the appropriate tier based on total points
  let tierId = existingCustomer.tierId;
  const tiers = await getTiers();
  // Sort tiers by minPoints in ascending order
  const sortedTiers = tiers.sort((a: any, b: any) => a.minPoints - b.minPoints);

  // Find the highest tier that the customer qualifies for
  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    if (totalPoints >= sortedTiers[i].minPoints) {
      tierId = sortedTiers[i].id;
      break;
    }
  }

  // Update the customer in our database
  const customer = (await prisma.customer.update({
    where: { id },
    data: {
      bonusPoints,
      totalPoints,
      tierId,
    },
    include: {
      tier: true,
    },
  })) as unknown as {
    id: string;
    shopifyId: bigint;
    totalSpend: number;
    spendPoints: number;
    bonusPoints: number;
    totalPoints: number;
    tierId: string | null;
    tier: any;
  };

  // If admin API context is provided, update their metafields
  if (admin && tierId) {
    try {
      await updateCustomerTierMetafields(
        admin,
        Number(customer.shopifyId),
        tierId,
        customer.totalSpend,
        customer.spendPoints,
        customer.bonusPoints,
        customer.totalPoints,
      );
      console.log(`Updated metafields for customer ${customer.shopifyId}`);
    } catch (error) {
      console.error(
        `Failed to update metafields for customer ${customer.shopifyId}:`,
        error,
      );
      // Don't throw the error - we still want to return the customer even if metafield update fails
    }
  }

  return customer;
}
