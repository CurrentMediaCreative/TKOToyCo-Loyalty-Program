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

// Smart tier range management functions
export async function adjustTierRanges() {
  const tiers = await getTiers(); // Already ordered by minPoints asc
  
  for (let i = 0; i < tiers.length; i++) {
    const currentTier = tiers[i];
    const nextTier = tiers[i + 1];
    
    // Set maxPoints based on next tier's minPoints
    let maxPoints = null;
    if (nextTier && nextTier.minPoints < 9999999) { // Don't adjust for invite-only tiers
      maxPoints = nextTier.minPoints - 1;
    }
    
    // Update the tier if maxPoints changed
    if (currentTier.maxPoints !== maxPoints) {
      await updateTier({
        id: currentTier.id,
        maxPoints,
      });
    }
  }
}

export async function createTierWithRangeAdjustment({
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
  // Create the new tier
  const newTier = await createTier({
    name,
    description,
    minPoints,
    maxPoints,
  });
  
  // Adjust all tier ranges to prevent overlaps
  await adjustTierRanges();
  
  return newTier;
}

export async function updateTierWithRangeAdjustment({
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
  // Update the tier
  const updatedTier = await updateTier({
    id,
    name,
    description,
    minPoints,
    maxPoints,
  });
  
  // Adjust all tier ranges to prevent overlaps
  await adjustTierRanges();
  
  return updatedTier;
}

// Function to get tier benefits for customer loyalty card display
export async function getTierBenefitsForCustomer(tierName: string) {
  const tier = await prisma.tier.findFirst({
    where: { 
      name: {
        contains: tierName.replace(/[^\w\s]/gi, '').trim(),
        mode: 'insensitive'
      }
    },
    include: {
      benefits: true,
    },
  });
  
  if (!tier) {
    return [];
  }
  
  return tier.benefits.map(benefit => benefit.name);
}

// Function to categorize benefits for customer loyalty card
export function categorizeTierBenefits(benefits: string[]) {
  const purchaseRelevant = benefits.filter((benefit: string) => {
    const lowerBenefit = benefit.toLowerCase();
    return (
      lowerBenefit.includes('discount') ||
      lowerBenefit.includes('points per $1') ||
      lowerBenefit.includes('x points') ||
      lowerBenefit.includes('1.25x') ||
      lowerBenefit.includes('1.5x') ||
      lowerBenefit.includes('2x') ||
      lowerBenefit.includes('singles') ||
      lowerBenefit.includes('sealed') ||
      lowerBenefit.includes('supplies') ||
      lowerBenefit.includes('toys') ||
      lowerBenefit.includes('board games') ||
      lowerBenefit.includes('birthday gift') ||
      lowerBenefit.includes('pricing') ||
      lowerBenefit.includes('price')
    );
  });
  
  const otherBenefits = benefits.filter((benefit: string) => {
    const lowerBenefit = benefit.toLowerCase();
    return !(
      lowerBenefit.includes('discount') ||
      lowerBenefit.includes('points per $1') ||
      lowerBenefit.includes('x points') ||
      lowerBenefit.includes('1.25x') ||
      lowerBenefit.includes('1.5x') ||
      lowerBenefit.includes('2x') ||
      lowerBenefit.includes('singles') ||
      lowerBenefit.includes('sealed') ||
      lowerBenefit.includes('supplies') ||
      lowerBenefit.includes('toys') ||
      lowerBenefit.includes('board games') ||
      lowerBenefit.includes('birthday gift') ||
      lowerBenefit.includes('pricing') ||
      lowerBenefit.includes('price')
    );
  });
  
  return { purchaseRelevant, otherBenefits };
}
