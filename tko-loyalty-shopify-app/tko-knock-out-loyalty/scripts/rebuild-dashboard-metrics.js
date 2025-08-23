import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function rebuildDashboardMetrics() {
  try {
    console.log("🔧 Rebuilding Dashboard Metrics...\n");

    // Get all customers
    const customers = await prisma.customer.findMany({
      select: {
        totalSpend: true,
        createdAt: true,
        lastOrderDate: true,
        tier: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📊 Processing ${customers.length} customers...`);

    // Calculate metrics
    const totalCustomers = customers.length;
    
    // Active customers (had an order in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeCustomers = customers.filter(
      (customer) => customer.lastOrderDate && customer.lastOrderDate > thirtyDaysAgo
    ).length;

    // Total spent
    const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);

    // Month spent (customers who joined this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthSpent = customers
      .filter((customer) => customer.createdAt >= startOfMonth)
      .reduce((sum, customer) => sum + customer.totalSpend, 0);

    // Year spent (customers who joined this year)
    const startOfYear = new Date();
