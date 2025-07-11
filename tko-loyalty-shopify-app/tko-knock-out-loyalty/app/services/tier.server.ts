import prisma from "../db.server";

export async function getTiers() {
  return prisma.tier.findMany({
    include: {
      benefits: true,
    },
    orderBy: {
      minPoints: "asc",
    },
  });
}

export async function getTierById(id: string) {
  return prisma.tier.findUnique({
    where: { id },
    include: {
      benefits: true,
    },
  });
}

export async function createTier({
  name,
  description,
  minPoints,
  maxPoints,
}: {
  name: string;
  description?: string;
  minPoints: number;
  maxPoints?: number;
}) {
  return prisma.tier.create({
    data: {
      name,
      description,
      minPoints,
      maxPoints,
    },
  });
}

export async function updateTier({
  id,
  name,
  description,
  minPoints,
  maxPoints,
}: {
  id: string;
  name?: string;
  description?: string | null;
  minPoints?: number;
  maxPoints?: number | null;
}) {
  return prisma.tier.update({
    where: { id },
    data: {
      name,
      description,
      minPoints,
      maxPoints,
    },
  });
}

export async function deleteTier(id: string) {
  return prisma.tier.delete({
    where: { id },
  });
}

export async function createTierBenefit({
  name,
  description,
  tierId,
}: {
  name: string;
  description: string;
  tierId: string;
}) {
  return prisma.tierBenefit.create({
    data: {
      name,
      description,
      tierId,
    },
  });
}

export async function deleteTierBenefit(id: string) {
  return prisma.tierBenefit.delete({
    where: { id },
  });
}

export async function getCustomerTier(totalPoints: number): Promise<string> {
  const tiers = await getTiers(); // Already ordered by minPoints asc

  // Start from highest tier and work down
  for (let i = tiers.length - 1; i >= 0; i--) {
    const tier = tiers[i];
    if (totalPoints >= tier.minPoints) {
      return tier.name;
    }
  }

  // If no tier matches, return the lowest tier
  return tiers[0]?.name || "Featherweight";
}
