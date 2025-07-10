import prisma from "../db.server";

interface DashboardData {
  totalCustomers: number;
  activeCustomers: number;
  totalSpent: number;
  monthSpent: number;
  yearSpent: number;
  tierCounts: Record<string, number>;
  topCompetitorsToday: Array<{
    id: string;
    name: string;
    points: number;
    tier: string;
  }>;
  topCompetitorsMonth: Array<{
    id: string;
    name: string;
    points: number;
    tier: string;
  }>;
  lastCalculated: Date;
}

/**
 * Dashboard Metrics Service
 * Handles caching and calculation of dashboard statistics
 * Reduces load on Shopify API by using local database
 */
export class DashboardMetricsService {
  private static readonly CACHE_DURATION_MINUTES = 15; // Cache for 15 minutes

  /**
   * Get dashboard metrics with intelligent caching
   */
  async getDashboardMetrics(
    forceRefresh: boolean = false,
  ): Promise<DashboardData> {
    const cached = await this.getCachedMetrics();

    if (!forceRefresh && cached && this.isCacheValid(cached.lastCalculated)) {
      console.log("Using cached dashboard metrics");
      return this.parseCachedMetrics(cached);
    }

    console.log("Calculating fresh dashboard metrics");
    return await this.calculateAndCacheMetrics();
  }

  /**
   * Get cached metrics from database
   */
  private async getCachedMetrics() {
    return await prisma.dashboardMetrics.findUnique({
      where: { id: "dashboard" },
    });
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastCalculated: Date): boolean {
    const now = new Date();
    const cacheAge = now.getTime() - lastCalculated.getTime();
    const maxAge = DashboardMetricsService.CACHE_DURATION_MINUTES * 60 * 1000;
    return cacheAge < maxAge;
  }

  /**
   * Parse cached metrics from database format
   */
  private parseCachedMetrics(cached: any): DashboardData {
    return {
      totalCustomers: cached.totalCustomers,
      activeCustomers: cached.activeCustomers,
      totalSpent: cached.totalSpent,
      monthSpent: cached.monthSpent,
      yearSpent: cached.yearSpent,
      tierCounts: JSON.parse(cached.tierCounts),
      topCompetitorsToday: JSON.parse(cached.topCompetitorsToday),
      topCompetitorsMonth: JSON.parse(cached.topCompetitorsMonth),
      lastCalculated: cached.lastCalculated,
    };
  }

  /**
   * Calculate fresh metrics and cache them
   */
  private async calculateAndCacheMetrics(): Promise<DashboardData> {
    const startTime = Date.now();

    // Calculate all metrics in parallel for better performance
    const [
      totalCustomers,
      activeCustomers,
      totalSpent,
      monthSpent,
      yearSpent,
      tierCounts,
      topCompetitorsToday,
      topCompetitorsMonth,
    ] = await Promise.all([
      this.calculateTotalCustomers(),
      this.calculateActiveCustomers(),
      this.calculateTotalSpent(),
      this.calculateMonthSpent(),
      this.calculateYearSpent(),
      this.calculateTierCounts(),
      this.calculateTopCompetitors("today"),
      this.calculateTopCompetitors("month"),
    ]);

    const metrics: DashboardData = {
      totalCustomers,
      activeCustomers,
      totalSpent,
      monthSpent,
      yearSpent,
      tierCounts,
      topCompetitorsToday,
      topCompetitorsMonth,
      lastCalculated: new Date(),
    };

    // Cache the results
    await this.cacheMetrics(metrics);

    const duration = Date.now() - startTime;
    console.log(`Dashboard metrics calculated in ${duration}ms`);

    return metrics;
  }

  /**
   * Cache metrics to database
   */
  private async cacheMetrics(metrics: DashboardData): Promise<void> {
    await prisma.dashboardMetrics.upsert({
      where: { id: "dashboard" },
      update: {
        totalCustomers: metrics.totalCustomers,
        activeCustomers: metrics.activeCustomers,
        totalSpent: metrics.totalSpent,
        monthSpent: metrics.monthSpent,
        yearSpent: metrics.yearSpent,
        tierCounts: JSON.stringify(metrics.tierCounts),
        topCompetitorsToday: JSON.stringify(metrics.topCompetitorsToday),
        topCompetitorsMonth: JSON.stringify(metrics.topCompetitorsMonth),
        lastCalculated: metrics.lastCalculated,
        updatedAt: new Date(),
      },
      create: {
        id: "dashboard",
        totalCustomers: metrics.totalCustomers,
        activeCustomers: metrics.activeCustomers,
        totalSpent: metrics.totalSpent,
        monthSpent: metrics.monthSpent,
        yearSpent: metrics.yearSpent,
        tierCounts: JSON.stringify(metrics.tierCounts),
        topCompetitorsToday: JSON.stringify(metrics.topCompetitorsToday),
        topCompetitorsMonth: JSON.stringify(metrics.topCompetitorsMonth),
        lastCalculated: metrics.lastCalculated,
      },
    });
  }

  /**
   * Calculate total customers
   */
  private async calculateTotalCustomers(): Promise<number> {
    return await prisma.customer.count();
  }

  /**
   * Calculate active customers (ordered in last 30 days)
   */
  private async calculateActiveCustomers(): Promise<number> {
    return await prisma.customer.count({
      where: { isActive: true },
    });
  }

  /**
   * Calculate total spend across all customers
   */
  private async calculateTotalSpent(): Promise<number> {
    const result = await prisma.customer.aggregate({
      _sum: { totalSpend: true },
    });
    return result._sum.totalSpend || 0;
  }

  /**
   * Calculate spend for current month
   */
  private async calculateMonthSpent(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.customer.aggregate({
      where: {
        lastOrderDate: { gte: startOfMonth },
      },
      _sum: { totalSpend: true },
    });
    return result._sum.totalSpend || 0;
  }

  /**
   * Calculate spend for current year
   */
  private async calculateYearSpent(): Promise<number> {
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    const result = await prisma.customer.aggregate({
      where: {
        lastOrderDate: { gte: startOfYear },
      },
      _sum: { totalSpend: true },
    });
    return result._sum.totalSpent || 0;
  }

  /**
   * Calculate customer counts by tier
   */
  private async calculateTierCounts(): Promise<Record<string, number>> {
    const tiers = await prisma.tier.findMany({
      select: { id: true, name: true },
    });

    const tierCounts: Record<string, number> = {};

    // Initialize all tiers with 0
    for (const tier of tiers) {
      tierCounts[tier.name] = 0;
    }

    // Count customers in each tier
    const customerCounts = await prisma.customer.groupBy({
      by: ["tierId"],
      _count: { id: true },
      where: { tierId: { not: null } },
    });

    // Map tier IDs to names and counts
    for (const count of customerCounts) {
      const tier = tiers.find((t) => t.id === count.tierId);
      if (tier) {
        tierCounts[tier.name] = count._count.id;
      }
    }

    // Count customers without tiers
    const noTierCount = await prisma.customer.count({
      where: { tierId: null },
    });
    tierCounts["No Tier"] = noTierCount;

    return tierCounts;
  }

  /**
   * Calculate top competitors for a given period
   */
  private async calculateTopCompetitors(period: "today" | "month"): Promise<
    Array<{
      id: string;
      name: string;
      points: number;
      tier: string;
    }>
  > {
    let dateFilter: Date;

    if (period === "today") {
      dateFilter = new Date();
      dateFilter.setHours(0, 0, 0, 0);
    } else {
      dateFilter = new Date();
      dateFilter.setDate(1);
      dateFilter.setHours(0, 0, 0, 0);
    }

    const topCustomers = await prisma.customer.findMany({
      where: {
        lastOrderDate: { gte: dateFilter },
      },
      include: {
        tier: { select: { name: true } },
      },
      orderBy: { totalPoints: "desc" },
      take: 10,
    });

    return topCustomers.map((customer) => ({
      id: customer.id,
      name:
        `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
        customer.email ||
        `Customer ${customer.shopifyId}`,
      points: customer.totalPoints,
      tier: customer.tier?.name || "No Tier",
    }));
  }

  /**
   * Force refresh of all metrics
   */
  async refreshMetrics(): Promise<DashboardData> {
    return await this.calculateAndCacheMetrics();
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<{
    isCached: boolean;
    lastCalculated: Date | null;
    cacheAge: number | null;
    isValid: boolean;
  }> {
    const cached = await this.getCachedMetrics();

    if (!cached) {
      return {
        isCached: false,
        lastCalculated: null,
        cacheAge: null,
        isValid: false,
      };
    }

    const now = new Date();
    const cacheAge = now.getTime() - cached.lastCalculated.getTime();
    const isValid = this.isCacheValid(cached.lastCalculated);

    return {
      isCached: true,
      lastCalculated: cached.lastCalculated,
      cacheAge: Math.floor(cacheAge / 1000), // in seconds
      isValid,
    };
  }

  /**
   * Clear cache (force next request to recalculate)
   */
  async clearCache(): Promise<void> {
    await prisma.dashboardMetrics
      .delete({
        where: { id: "dashboard" },
      })
      .catch(() => {
        // Ignore if record doesn't exist
      });
  }
}

/**
 * Helper functions for use in routes
 */

export async function getDashboardMetrics(
  forceRefresh: boolean = false,
): Promise<DashboardData> {
  const service = new DashboardMetricsService();
  return await service.getDashboardMetrics(forceRefresh);
}

export async function refreshDashboardMetrics(): Promise<DashboardData> {
  const service = new DashboardMetricsService();
  return await service.refreshMetrics();
}

export async function getDashboardCacheStatus() {
  const service = new DashboardMetricsService();
  return await service.getCacheStatus();
}

export async function clearDashboardCache(): Promise<void> {
  const service = new DashboardMetricsService();
  return await service.clearCache();
}
