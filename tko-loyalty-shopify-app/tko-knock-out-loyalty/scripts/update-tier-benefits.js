import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the correct tier benefits based on the tier comparison chart
const correctTierBenefits = {
  "Featherweight": [
    "Store Wide Bonus Point Days",
    "Community Bonus Points (Events + Tournaments)",
    "Discord Access",
  ],
  "Lightweight": [
    "All Featherweight benefits",
    "3% Singles Discount",
    "1% Sealed Discount", 
    "5% Supplies Discount",
    "5% Toys & Board Games Discount",
  ],
  "Welterweight": [
    "All Lightweight benefits",
    "1.25x Points Per $1 Spent",
    "7% Singles Discount",
    "2% Sealed Discount",
    "10% Supplies Discount",
    "8% Toys & Board Games Discount",
    "🎁 Birthday Gift ($25+ value)",
    "Store Wide BPDs + 2x Wed + 2x 1st",
    "Pre-Orders (case by case)",
    "Exclusive Early Access",
    "Priority Registration",
    "Same Day Lock",
    "Lock In Tier 1x",
  ],
  "Heavyweight": [
    "All Welterweight benefits",
    "1.5x Points Per $1 Spent",
    "10% Singles Discount",
    "3% Sealed Discount",
    "15% Supplies Discount",
    "13% Toys & Board Games Discount",
    "🎁 Birthday Gift ($150+ value)",
    "All Above + Exclusive Events",
    "Guaranteed Pre-Orders (1 item/SKU)",
    "Preferred Member Pricing",
    "Private Tier Events",
    "Priority Channels",
    "48hrs Lock",
    "🎁 Quarterly Drop",
    "Lock In Tier 2x",
  ],
  "Reigning Champion": [
    "All Heavyweight benefits",
    "2x Points Per $1 Spent",
    "15% Singles Discount",
    "5% Sealed Discount",
    "20% Supplies Discount",
    "15% Toys & Board Games Discount",
    "🎁 Curated Premium Gift",
    "Custom-curated Offers",
    "Guaranteed Pre-Orders (1 case/SKU)",
    "Elite Priority Pricing",
    "VIP-only Invites",
    "Priority Channels",
    "72hr Lock",
    "🎁 Monthly Premium Bundle",
    "Invite-only status",
  ],
};

// Define correct tier ranges
const correctTierRanges = {
  "Featherweight": { minPoints: 0, maxPoints: 1499 },
  "Lightweight": { minPoints: 1500, maxPoints: 4999 },
  "Welterweight": { minPoints: 5000, maxPoints: 29999 },
  "Heavyweight": { minPoints: 30000, maxPoints: null },
  "Reigning Champion": { minPoints: 9999999, maxPoints: null },
};

async function updateTierBenefits() {
  console.log('🔄 Starting tier benefits update...');

  try {
    // Get all existing tiers
    const tiers = await prisma.tier.findMany({
      include: {
        benefits: true,
      },
    });

    console.log(`📊 Found ${tiers.length} existing tiers`);

    for (const tier of tiers) {
      console.log(`\n🎯 Processing tier: ${tier.name}`);

      // Normalize tier name for matching
      const normalizedTierName = tier.name.trim();
      const correctBenefits = correctTierBenefits[normalizedTierName];
      const correctRange = correctTierRanges[normalizedTierName];

      if (!correctBenefits) {
        console.log(`⚠️  No correct benefits found for tier: ${normalizedTierName}`);
        continue;
      }

      // Update tier range if needed
      if (correctRange) {
        const needsRangeUpdate = 
          tier.minPoints !== correctRange.minPoints || 
          tier.maxPoints !== correctRange.maxPoints;

        if (needsRangeUpdate) {
          console.log(`📏 Updating tier range: ${tier.minPoints} -> ${correctRange.minPoints}, ${tier.maxPoints} -> ${correctRange.maxPoints}`);
          await prisma.tier.update({
            where: { id: tier.id },
            data: {
              minPoints: correctRange.minPoints,
              maxPoints: correctRange.maxPoints,
            },
          });
        }
      }

      // Delete existing benefits
      console.log(`🗑️  Deleting ${tier.benefits.length} existing benefits`);
      await prisma.tierBenefit.deleteMany({
        where: { tierId: tier.id },
      });

      // Create new benefits
      console.log(`✨ Creating ${correctBenefits.length} new benefits`);
      for (const benefitName of correctBenefits) {
        await prisma.tierBenefit.create({
          data: {
            name: benefitName,
            description: benefitName,
            tierId: tier.id,
          },
        });
      }

      console.log(`✅ Updated tier: ${tier.name}`);
    }

    console.log('\n🎉 Tier benefits update completed successfully!');

    // Verify the update
    console.log('\n📋 Verification - Current tier benefits:');
    const updatedTiers = await prisma.tier.findMany({
      include: {
        benefits: true,
      },
      orderBy: {
        minPoints: 'asc',
      },
    });

    for (const tier of updatedTiers) {
      console.log(`\n${tier.name} (${tier.minPoints}${tier.maxPoints ? `-${tier.maxPoints}` : '+'} points):`);
      for (const benefit of tier.benefits) {
        console.log(`  • ${benefit.name}`);
      }
    }

  } catch (error) {
    console.error('❌ Error updating tier benefits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateTierBenefits()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
