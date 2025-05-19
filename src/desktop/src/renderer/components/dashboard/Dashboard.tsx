import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Button,
  Alert,
} from "@mui/material";
import { Customer } from "../../../main/models/Customer";
import RefreshIcon from "@mui/icons-material/Refresh";

/**
 * Dashboard component
 * Displays key metrics and statistics
 */
const Dashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaysTransactions, setTodaysTransactions] = useState(0);
  const [todaysTotalPurchases, setTodaysTotalPurchases] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [tierDistribution, setTierDistribution] = useState<any[]>([]);

  // Load customer data
  const loadCustomerData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      if (window.api) {
        // Test connection first
        const connectionResult = await window.api.shopifyTestConnection();
        if (!connectionResult.success) {
          setError(
            "Failed to connect to Shopify API. Please check your credentials."
          );
          setLoading(false);
          return;
        }

        // Fetch customers
        const result = await window.api.shopifySearchCustomers("email:*");
        if (result.success && result.customers) {
          console.log("Dashboard loaded customers:", result.customers.length);
          setCustomers(result.customers);

          // Calculate total spend from customer data
          setMonthlyRevenue(
            result.customers.reduce(
              (sum: number, c: Customer) => sum + (c.totalSpend || 0),
              0
            )
          );

          // For real implementation, these would come from actual transaction data
          // For now, we'll set them to 0 until we have real data
          setTodaysTransactions(0);
          setTodaysTotalPurchases(0);

          // Calculate tier distribution
          calculateTierDistribution(result.customers);
        } else {
          console.log("No customers found or error occurred");
          setError(result.error || "Failed to load customers");
        }
      } else {
        setError("API not available");
      }
    } catch (err) {
      console.error("Error loading customer data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Calculate tier distribution from customers
  const calculateTierDistribution = (customers: Customer[]) => {
    const tierCounts: Record<string, number> = {};
    const tierColors: Record<string, string> = {
      Featherweight: "#9e9e9e",
      Lightweight: "#2196f3",
      Welterweight: "#03a9f4",
      Heavyweight: "#9c27b0",
      "Reigning Champion": "#4caf50",
    };

    // Count customers in each tier
    customers.forEach((customer) => {
      const tierName = customer.currentTier?.name || "No Tier";
      tierCounts[tierName] = (tierCounts[tierName] || 0) + 1;
    });

    // Convert to array format for display
    const distribution = Object.keys(tierCounts).map((name) => ({
      name,
      value: tierCounts[name],
      color: tierColors[name] || "#9e9e9e",
    }));

    setTierDistribution(distribution);
  };

  // Load data on component mount
  useEffect(() => {
    loadCustomerData();
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    loadCustomerData(true);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Customers
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {loading ? "..." : customers.length}
            </Typography>
            <Typography variant="body2" color="success.main">
              From Shopify Integration
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Unique Customer Transactions Today
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {loading ? "..." : todaysTransactions}
            </Typography>
            <Typography variant="body2" color="success.main">
              Awaiting real transaction data
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Monthly Revenue
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {loading
                ? "..."
                : new Intl.NumberFormat("en-CA", {
                    style: "currency",
                    currency: "CAD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(monthlyRevenue)}
            </Typography>
            <Typography variant="body2" color="success.main">
              From Shopify Integration
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Today's Total Purchases
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {loading
                ? "..."
                : new Intl.NumberFormat("en-CA", {
                    style: "currency",
                    currency: "CAD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(todaysTotalPurchases)}
            </Typography>
            <Typography variant="body2" color="success.main">
              Awaiting real transaction data
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Monthly Sales" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Typography
                  variant="body1"
                  sx={{ textAlign: "center", mt: 10 }}
                >
                  {loading ? "Loading..." : "No sales data available"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Customer Tier Distribution" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                {loading ? (
                  <Typography
                    variant="body1"
                    sx={{ textAlign: "center", mt: 10 }}
                  >
                    Loading...
                  </Typography>
                ) : customers.length > 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Customer Distribution by Tier:
                    </Typography>
                    {tierDistribution.map((tier) => (
                      <Box key={tier.name} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2">{tier.name}</Typography>
                          <Typography variant="body2">
                            {tier.value} (
                            {Math.round((tier.value / customers.length) * 100)}
                            %)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(tier.value / customers.length) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "rgba(0,0,0,0.1)",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: tier.color,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body1"
                    sx={{ textAlign: "center", mt: 10 }}
                  >
                    No customer tier data available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
