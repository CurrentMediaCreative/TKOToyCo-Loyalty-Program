import React, { useState, ReactElement } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Divider,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import Layout from "../components/Layout";
import { useTheme } from "@mui/material/styles";

// Mock data for the reports
const tierDistributionData = [
  { name: "Flyweight", value: 120 },
  { name: "Lightweight", value: 75 },
  { name: "Welterweight", value: 45 },
  { name: "Heavyweight", value: 15 },
];

const monthlySpendData = [
  { name: "Jan", spend: 4000 },
  { name: "Feb", spend: 3000 },
  { name: "Mar", spend: 5000 },
  { name: "Apr", spend: 2780 },
  { name: "May", spend: 1890 },
  { name: "Jun", spend: 2390 },
  { name: "Jul", spend: 3490 },
  { name: "Aug", spend: 4000 },
  { name: "Sep", spend: 2500 },
  { name: "Oct", spend: 1500 },
  { name: "Nov", spend: 2000 },
  { name: "Dec", spend: 5000 },
];

const tierUpgradeData = [
  { name: "Jan", upgrades: 5 },
  { name: "Feb", upgrades: 8 },
  { name: "Mar", upgrades: 12 },
  { name: "Apr", upgrades: 7 },
  { name: "May", upgrades: 10 },
  { name: "Jun", upgrades: 15 },
  { name: "Jul", upgrades: 20 },
  { name: "Aug", upgrades: 18 },
  { name: "Sep", upgrades: 14 },
  { name: "Oct", upgrades: 9 },
  { name: "Nov", upgrades: 11 },
  { name: "Dec", upgrades: 16 },
];

const topCustomersData = [
  { name: "John Smith", spend: 12500 },
  { name: "Sarah Johnson", spend: 9800 },
  { name: "Michael Brown", spend: 8500 },
  { name: "Emily Davis", spend: 7200 },
  { name: "David Wilson", spend: 6900 },
];

const Reports: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState("year");

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as string);
  };

  // Colors for the pie chart
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            id="time-range-select"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="quarter">Last Quarter</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Total Customers
            </Typography>
            <Typography variant="h3" color="primary">
              255
            </Typography>
            <Typography variant="body2" color="text.secondary">
              +12% from last {timeRange}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Total Spend
            </Typography>
            <Typography variant="h3" color="primary">
              $45,250
            </Typography>
            <Typography variant="body2" color="text.secondary">
              +8% from last {timeRange}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Avg. Spend per Customer
            </Typography>
            <Typography variant="h3" color="primary">
              $177
            </Typography>
            <Typography variant="body2" color="text.secondary">
              -3% from last {timeRange}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Tier Upgrades
            </Typography>
            <Typography variant="h3" color="primary">
              42
            </Typography>
            <Typography variant="body2" color="text.secondary">
              +15% from last {timeRange}
            </Typography>
          </Paper>
        </Grid>

        {/* Tier Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Customer Tier Distribution" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({
                      name,
                      percent,
                    }: {
                      name: string;
                      percent: number;
                    }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierDistributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Spend Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Monthly Total Spend" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlySpendData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`$${value}`, "Spend"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="spend"
                    fill={theme.palette.primary.main}
                    name="Total Spend"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tier Upgrades Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Monthly Tier Upgrades" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={tierUpgradeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="upgrades"
                    stroke={theme.palette.secondary.main}
                    activeDot={{ r: 8 }}
                    name="Tier Upgrades"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Customers Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Top Customers by Spend" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topCustomersData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip
                    formatter={(value: number) => [`$${value}`, "Spend"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="spend"
                    fill={theme.palette.warning.main}
                    name="Total Spend"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
