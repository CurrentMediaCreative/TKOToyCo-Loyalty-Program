import prisma from "../db.server";
import { getTiers } from "./tier.server";

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
}: {
  shopifyId: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  totalSpend?: number;
  lastOrderDate?: Date;
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

  return prisma.customer.upsert({
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
}

export async function deleteCustomer(id: string) {
  return prisma.customer.delete({
    where: { id },
  });
}

export async function updateCustomerTier(id: string, tierId: string | null) {
  return prisma.customer.update({
    where: { id },
    data: {
      tierId,
    },
  });
}
