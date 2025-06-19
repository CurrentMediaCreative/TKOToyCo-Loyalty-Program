import prisma from "../db.server";
import { getTiers } from "./tier.server";
import { updateCustomerTierMetafields } from "./metafields.server";
import type { Admin } from "../types";

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
  });
}

export async function getCustomerByShopifyId(shopifyId: number) {
  return prisma.customer.findUnique({
    where: { shopifyId: BigInt(shopifyId) },
    include: {
      tier: true,
    },
  });
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

  // Calculate points from spend (1:1 ratio)
  const spendPoints = totalSpend !== undefined ? totalSpend : 0;

  // Get existing customer to preserve bonus points if not provided
  let existingBonusPoints = 0;
  const existingCustomer = await prisma.customer.findUnique({
    where: { shopifyId: BigInt(shopifyId) },
    select: { bonusPoints: true },
  });

  if (existingCustomer) {
    existingBonusPoints = existingCustomer.bonusPoints;
  }

  // Use provided bonus points or existing ones
  const updatedBonusPoints =
    bonusPoints !== undefined ? bonusPoints : existingBonusPoints;

  // Calculate total points (spend points + bonus points)
  const calculatedTotalPoints = spendPoints + updatedBonusPoints;

  // Find the appropriate tier based on total points
  let tierId = null;
  if (calculatedTotalPoints !== undefined) {
    const tiers = await getTiers();
    // Sort tiers by minSpend in ascending order (we'll use the same thresholds for points)
    const sortedTiers = tiers.sort((a, b) => a.minSpend - b.minSpend);

    // Find the highest tier that the customer qualifies for
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (calculatedTotalPoints >= sortedTiers[i].minSpend) {
        tierId = sortedTiers[i].id;
        break;
      }
    }
  }

  // Create or update the customer in our database
  const customer = await prisma.customer.upsert({
    where: { shopifyId: BigInt(shopifyId) },
    update: {
      email,
      firstName,
      lastName,
      totalSpend: totalSpend !== undefined ? totalSpend : undefined,
      spendPoints: totalSpend !== undefined ? totalSpend : undefined,
      bonusPoints: updatedBonusPoints,
      totalPoints: calculatedTotalPoints,
      tierId,
      lastOrderDate,
    },
    create: {
      id,
      shopifyId: BigInt(shopifyId),
      email,
      firstName,
      lastName,
      totalSpend: totalSpend || 0,
      spendPoints: totalSpend || 0,
      bonusPoints: updatedBonusPoints,
      totalPoints: calculatedTotalPoints,
      tierId,
      lastOrderDate,
    },
  });

  // If admin API context is provided and the customer has a tier, update their metafields
  if (admin && tierId) {
    try {
      await updateCustomerTierMetafields(
        admin,
        shopifyId,
        tierId,
        customer.totalSpend,
        customer.spendPoints,
        customer.bonusPoints,
        customer.totalPoints,
      );
      console.log(`Updated metafields for customer ${shopifyId}`);
    } catch (error) {
      console.error(
        `Failed to update metafields for customer ${shopifyId}:`,
        error,
      );
      // Don't throw the error - we still want to return the customer even if metafield update fails
    }
  }

  return customer;
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
  // Sort tiers by minSpend in ascending order
  const sortedTiers = tiers.sort((a, b) => a.minSpend - b.minSpend);

  // Find the highest tier that the customer qualifies for
  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    if (totalPoints >= sortedTiers[i].minSpend) {
      tierId = sortedTiers[i].id;
      break;
    }
  }

  // Update the customer in our database
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      bonusPoints,
      totalPoints,
      tierId,
    },
    include: {
      tier: true,
    },
  });

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
