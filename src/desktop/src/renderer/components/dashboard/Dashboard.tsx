import React from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, CardHeader, LinearProgress } from '@mui/material';

/**
 * Dashboard component
 * Displays key metrics and statistics
 */
const Dashboard: React.FC = () => {
  // Mock data for charts
  const tierDistributionData = [
    { name: 'Featherweight', value: 25, color: '#e0e0e0' },
    { name: 'Lightweight', value: 35, color: '#90caf9' },
    { name: 'Welterweight', value: 20, color: '#42a5f5' },
    { name: 'Heavyweight', value: 15, color: '#1976d2' },
    { name: 'Reigning Champion', value: 5, color: '#0d47a1' },
  ];

  const monthlySalesData = [
    { month: 'Jan', sales: 4000 },
    { month: 'Feb', sales: 3000 },
    { month: 'Mar', sales: 5000 },
    { month: 'Apr', sales: 2780 },
    { month: 'May', sales: 1890 },
    { month: 'Jun', sales: 2390 },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total Customers
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              1,254
            </Typography>
            <Typography variant="body2" color="success.main">
              +12% from last month
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Active Members
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              876
            </Typography>
            <Typography variant="body2" color="success.main">
              70% of total customers
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Monthly Revenue
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              $45,678
            </Typography>
            <Typography variant="body2" color="error.main">
              -3% from last month
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Avg. Purchase
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              $78
            </Typography>
            <Typography variant="body2" color="success.main">
              +5% from last month
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
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
                  Bar Chart Placeholder
                </Typography>
                {/* Uncomment when recharts is installed
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySalesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                */}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Customer Tier Distribution" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
                  Pie Chart Placeholder
                </Typography>
                {/* Uncomment when recharts is installed
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {tierDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                */}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
