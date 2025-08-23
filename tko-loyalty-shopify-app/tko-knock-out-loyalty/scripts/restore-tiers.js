import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function restoreTiers() {
  try {
    console.log("Restoring tier configuration...");

    // Define the standard TKO loyalty tiers
    const tiers = [
      {
        id: "tier_featherweight",
        name: "Featherweight",
        description: "Entry level tier for new customers",
        minPoints: 0,
        maxPoints: 1499,
      },
      {
        id: "tier_lightweight",
        name: "Lightweight",
        description: "Second tier for regular customers",
        minPoints: 1500,
        maxPoints: 4999,
      },
      {
        id: "tier_welterweight",
        name: "Welterweight",
        description: "Mid-tier for loyal customers",
        minPoints: 5000,
        maxPoints: 24999,
      },
      {
        id: "tier_heavyweight",
        name: "Heavyweight",
        description: "High tier for VIP customers",
        minPoints: 25000,
        maxPoints: 49999,
      },
      {
        id: "tier_reigning_champion",
        name: "Reigning Champion",
        description: "Highest tier for champion customers",
        minPoints: 50000,
        maxPoints: null,
      },
    ];

    // Create or update each tier
    for (const tierData of tiers) {
      await prisma.tier.upsert({
        where: { id: tierData.id },
        update: tierData,
        create: tierData,
      });
      console.log(`✓ Created/updated tier: ${tierData.name}`);
    }

    // Create tier benefits
    const benefits = [
      // Featherweight benefits
      {
        tierId: "tier_featherweight",
        name: "Welcome Bonus",
        description: "10% off first purchase",
      },
      {
        tierId: "tier_featherweight",
        name: "Birthday Discount",
        description: "Special birthday offer",
      },

      // Lightweight benefits
      {
        tierId: "tier_lightweight",
        name: "Member Discount",
        description: "5% off all purchases",
      },
      {
        tierId: "tier_lightweight",
        name: "Early Access",
        description: "Early access to sales",
      },

      // Welterweight benefits
      {
        tierId: "tier_welterweight",
        name: "VIP Discount",
        description: "10% off all purchases",
      },
      {
        tierId: "tier_welterweight",
        name: "Free Shipping",
        description: "Free shipping on all orders",
      },
      {
        tierId: "tier_welterweight",
        name: "Priority Support",
        description: "Priority customer support",
      },

      // Heavyweight benefits
      {
        tierId: "tier_heavyweight",
        name: "Premium Discount",
        description: "15% off all purchases",
      },
      {
        tierId: "tier_heavyweight",
        name: "Exclusive Products",
        description: "Access to exclusive products",
      },
      {
        tierId: "tier_heavyweight",
        name: "Personal Shopper",
        description: "Personal shopping assistance",
      },

      // Reigning Champion benefits
      {
        tierId: "tier_reigning_champion",
        name: "Champion Discount",
        description: "20% off all purchases",
      },
      {
        tierId: "tier_reigning_champion",
        name: "VIP Events",
        description: "Invitation to exclusive events",
      },
      {
        tierId: "tier_reigning_champion",
        name: "Concierge Service",
        description: "Dedicated concierge service",
      },
    ];

    // Clear existing benefits and create new ones
    await prisma.tierBenefit.deleteMany({});

    for (const benefit of benefits) {
      await prisma.tierBenefit.create({
        data: benefit,
      });
    }

    console.log(`✓ Created ${benefits.length} tier benefits`);

    // Verify the setup
    const tierCount = await prisma.tier.count();
    const benefitCount = await prisma.tierBenefit.count();

    console.log(`\n✅ Tier restoration completed successfully!`);
    console.log(`   - ${tierCount} tiers created`);
    console.log(`   - ${benefitCount} benefits created`);
  } catch (error) {
    console.error("❌ Error restoring tiers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreTiers();
