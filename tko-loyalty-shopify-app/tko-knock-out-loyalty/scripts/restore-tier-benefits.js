import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const correctTierBenefits = {
  Featherweight: [
    "Store Wide Bonus Point Days",
    "Community Bonus Points (Events + Tournaments)",
    "Discord Access",
  ],
  Lightweight: [
    "All Featherweight benefits",
    "3% Singles Discount",
    "1% Sealed Discount",
    "5% Supplies Discount",
    "5% Toys & Board Games Discount",
  ],
  Welterweight: [
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
  Heavyweight: [
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

async function restoreTierBenefits() {
  try {
    console.log("🔍 Fetching current tiers...");

    // Get all tiers
    const tiers = await prisma.tier.findMany({
      include: {
        benefits: true,
      },
    });

    console.log(`Found ${tiers.length} tiers in database`);

    for (const tier of tiers) {
      console.log(`\n📝 Processing tier: ${tier.name}`);

      // Find the correct benefits for this tier
      const correctBenefits = correctTierBenefits[tier.name];

      if (!correctBenefits) {
        console.log(`⚠️  No correct benefits found for tier: ${tier.name}`);
        continue;
      }

      console.log(`Current benefits count: ${tier.benefits.length}`);
      console.log(`Correct benefits count: ${correctBenefits.length}`);

      // Delete existing benefits
      console.log("🗑️  Deleting old benefits...");
      await prisma.tierBenefit.deleteMany({
        where: {
          tierId: tier.id,
        },
      });

      // Create new benefits
      console.log("✨ Creating correct benefits...");
      for (const benefitName of correctBenefits) {
        await prisma.tierBenefit.create({
          data: {
            name: benefitName,
            description: benefitName,
            tierId: tier.id,
          },
        });
      }

      console.log(
        `✅ Updated ${tier.name} with ${correctBenefits.length} benefits`,
      );
    }

    console.log("\n🎉 All tier benefits have been restored successfully!");

    // Verify the update
    console.log("\n🔍 Verifying updates...");
    const updatedTiers = await prisma.tier.findMany({
      include: {
        benefits: true,
      },
      orderBy: {
        minPoints: "asc",
      },
    });

    for (const tier of updatedTiers) {
      console.log(`\n${tier.name}:`);
      console.log(`  Points: ${tier.minPoints} - ${tier.maxPoints || "∞"}`);
      console.log(`  Benefits (${tier.benefits.length}):`);
      tier.benefits.forEach((benefit, index) => {
        console.log(`    ${index + 1}. ${benefit.name}`);
      });
    }
  } catch (error) {
    console.error("❌ Error restoring tier benefits:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreTierBenefits();
