import React from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  useTheme,
} from "@mui/material";
import {
  People as PeopleIcon,
  EmojiEvents as TiersIcon,
  CardGiftcard as RewardsIcon,
  Receipt as TransactionsIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
} from "@mui/icons-material";

// Mock data for dashboard
const mockData = {
  totalCustomers: 1245,
  activeCustomers: 876,
  totalSpend: 245750.5,
  averageSpend: 197.39,
  newCustomersThisMonth: 68,
  recentTransactions: [
    {
      id: 1,
      customer: "John Smith",
      amount: 125.75,
      date: "2025-05-15",
      items: 3,
    },
    {
      id: 2,
      customer: "Sarah Johnson",
      amount: 345.25,
      date: "2025-05-14",
      items: 5,
    },
    {
      id: 3,
      customer: "Michael Brown",
      amount: 78.5,
      date: "2025-05-14",
      items: 2,
    },
    {
      id: 4,
      customer: "Emily Davis",
      amount: 210.3,
      date: "2025-05-13",
      items: 4,
    },
    {
      id: 5,
      customer: "David Wilson",
      amount: 450.75,
      date: "2025-05-12",
      items: 7,
    },
  ],
  tierDistribution: [
    { name: "Featherweight", count: 450, color: "#FFD23F" },
    { name: "Lightweight", count: 350, color: "#FF7C2A" },
    { name: "Welterweight", count: 250, color: "#00B8A2" },
    { name: "Heavyweight", count: 150, color: "#0088A9" },
    { name: "Reigning Champion", count: 45, color: "#5D3FD3" },
  ],
  topBenefits: [
    { name: "Exclusive Access", members: 87 },
    { name: "Tier Discounts", members: 65 },
    { name: "Free Shipping", members: 52 },
    { name: "VIP Customer Service", members: 34 },
  ],
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const Dashboard: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "rgba(0, 184, 162, 0.1)",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <PeopleIcon sx={{ color: theme.palette.primary.main }} />
                </Box>
                <Typography variant="h6" component="div">
                  Customers
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {mockData.totalCustomers}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {mockData.activeCustomers} active members
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "rgba(255, 210, 63, 0.1)",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <TiersIcon sx={{ color: "#FFD23F" }} />
                </Box>
                <Typography variant="h6" component="div">
                  New Members
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {mockData.newCustomersThisMonth}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "rgba(255, 124, 42, 0.1)",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <TransactionsIcon sx={{ color: "#FF7C2A" }} />
                </Box>
                <Typography variant="h6" component="div">
                  Total Spend
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                {formatCurrency(mockData.totalSpend)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Avg. {formatCurrency(mockData.averageSpend)} per customer
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "rgba(93, 63, 211, 0.1)",
                    borderRadius: "50%",
                    p: 1,
                    mr: 2,
                  }}
                >
                  <RewardsIcon sx={{ color: "#5D3FD3" }} />
                </Box>
                <Typography variant="h6" component="div">
                  Benefits
                </Typography>
              </Box>
              <Typography variant="h4" component="div">
                238
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Active tier benefits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" component="h2">
                Recent Transactions
              </Typography>
              <Button
                variant="text"
                color="primary"
                size="small"
                endIcon={<TrendingUpIcon />}
              >
                View All
              </Button>
            </Box>
            <List disablePadding>
              {mockData.recentTransactions.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 0,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="body1">
                        {transaction.customer}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.date} • {transaction.items} items
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(transaction.amount)}
                    </Typography>
                  </ListItem>
                  {index < mockData.recentTransactions.length - 1 && (
                    <Divider />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Tier Distribution & Top Benefits */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Tier Distribution
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {mockData.tierDistribution.map((tier) => (
                    <Box key={tier.name} sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: tier.color,
                              mr: 1,
                            }}
                          />
                          <Typography variant="body2">{tier.name}</Typography>
                        </Box>
                        <Typography variant="body2">{tier.count}</Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "100%",
                          backgroundColor: "#f0f0f0",
                          borderRadius: 1,
                          height: 6,
                        }}
                      >
                        <Box
                          sx={{
                            width: `${
                              (tier.count /
                                mockData.tierDistribution.reduce(
                                  (sum, t) => sum + t.count,
                                  0
                                )) *
                              100
                            }%`,
                            backgroundColor: tier.color,
                            height: "100%",
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Top Benefits
                </Typography>
                <List disablePadding>
                  {mockData.topBenefits.map((benefit, index) => (
                    <React.Fragment key={benefit.name}>
                      <ListItem
                        sx={{
                          py: 1,
                          px: 0,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <StarIcon
                            fontSize="small"
                            sx={{ color: "#FFD23F", mr: 1 }}
                          />
                          <Typography variant="body2">{benefit.name}</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {benefit.members} members
                        </Typography>
                      </ListItem>
                      {index < mockData.topBenefits.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
