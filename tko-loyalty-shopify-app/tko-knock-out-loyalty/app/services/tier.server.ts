import prisma from "../db.server";

export async function getTiers() {
  return prisma.tier.findMany({
    include: {
      benefits: true,
    },
    orderBy: {
      minSpend: "asc",
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
  minSpend,
  maxSpend,
}: {
  name: string;
  description?: string;
  minSpend: number;
  maxSpend?: number;
}) {
  return prisma.tier.create({
    data: {
      name,
      description,
      minSpend,
      maxSpend,
    },
  });
}

export async function updateTier({
  id,
  name,
  description,
  minSpend,
  maxSpend,
}: {
  id: string;
  name?: string;
  description?: string | null;
  minSpend?: number;
  maxSpend?: number | null;
}) {
  return prisma.tier.update({
    where: { id },
    data: {
      name,
      description,
      minSpend,
      maxSpend,
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
