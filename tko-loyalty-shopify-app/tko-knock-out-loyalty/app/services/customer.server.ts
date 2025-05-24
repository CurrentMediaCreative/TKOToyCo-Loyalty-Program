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
      totalSpend: "desc",
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
  lastOrderDate,
  admin,
}: {
  shopifyId: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  totalSpend?: number;
  lastOrderDate?: Date;
  admin?: Admin; // Optional Shopify admin API context for metafield updates
}) {
  // Generate a unique ID based on the Shopify ID
  const id = `cust_${shopifyId}`;

  // Find the appropriate tier based on total spend
  let tierId = null;
  if (totalSpend !== undefined) {
    const tiers = await getTiers();
    // Sort tiers by minSpend in ascending order
    const sortedTiers = tiers.sort((a, b) => a.minSpend - b.minSpend);

    // Find the highest tier that the customer qualifies for
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
      if (totalSpend >= sortedTiers[i].minSpend) {
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
      tierId,
      lastOrderDate,
    },
  });

  // If admin API context is provided and the customer has a tier, update their metafields
  if (admin && tierId && totalSpend !== undefined) {
    try {
      await updateCustomerTierMetafields(admin, shopifyId, tierId, totalSpend);
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
  if (admin && tierId && customer.totalSpend !== undefined) {
    try {
      await updateCustomerTierMetafields(
        admin,
        Number(customer.shopifyId),
        tierId,
        customer.totalSpend,
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
