import React, { useState } from 'react';
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
  Button,
  Tabs,
  Tab,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Reports component
 * Displays various reports and analytics
 */
const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('sales');
  const [tabValue, setTabValue] = useState(0);
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  
  // Mock data for sales report
  const salesData = [
    { date: '2025-04-18', totalSales: 1250, transactions: 15, avgOrderValue: 83.33 },
    { date: '2025-04-19', totalSales: 980, transactions: 12, avgOrderValue: 81.67 },
    { date: '2025-04-20', totalSales: 1450, transactions: 18, avgOrderValue: 80.56 },
    { date: '2025-04-21', totalSales: 1100, transactions: 14, avgOrderValue: 78.57 },
    { date: '2025-04-22', totalSales: 1320, transactions: 16, avgOrderValue: 82.50 },
    { date: '2025-04-23', totalSales: 950, transactions: 11, avgOrderValue: 86.36 },
    { date: '2025-04-24', totalSales: 1500, transactions: 19, avgOrderValue: 78.95 },
    { date: '2025-04-25', totalSales: 1680, transactions: 21, avgOrderValue: 80.00 },
    { date: '2025-04-26', totalSales: 1250, transactions: 15, avgOrderValue: 83.33 },
    { date: '2025-04-27', totalSales: 980, transactions: 12, avgOrderValue: 81.67 },
  ];
  
  // Mock data for customer report
  const customerData = [
    { date: '2025-04', newCustomers: 45, activeCustomers: 320, inactiveCustomers: 80, totalCustomers: 400 },
    { date: '2025-03', newCustomers: 38, activeCustomers: 310, inactiveCustomers: 75, totalCustomers: 385 },
    { date: '2025-02', newCustomers: 42, activeCustomers: 295, inactiveCustomers: 70, totalCustomers: 365 },
    { date: '2025-01', newCustomers: 50, activeCustomers: 280, inactiveCustomers: 65, totalCustomers: 345 },
    { date: '2024-12', newCustomers: 35, activeCustomers: 265, inactiveCustomers: 60, totalCustomers: 325 },
    { date: '2024-11', newCustomers: 40, activeCustomers: 250, inactiveCustomers: 55, totalCustomers: 305 },
  ];
  
  // Mock data for tier report
  const tierData = [
    { tier: 'Featherweight', customers: 125, percentageOfTotal: 31.25, avgSpend: 150 },
    { tier: 'Lightweight', customers: 140, percentageOfTotal: 35.00, avgSpend: 650 },
    { tier: 'Welterweight', customers: 80, percentageOfTotal: 20.00, avgSpend: 1250 },
    { tier: 'Heavyweight', customers: 40, percentageOfTotal: 10.00, avgSpend: 2500 },
    { tier: 'Champion', customers: 15, percentageOfTotal: 3.75, avgSpend: 6000 },
  ];

  // Handle report type change
  const handleReportTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setReportType(event.target.value as string);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      
      {/* Report Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="report-type-label">Report Type</InputLabel>
              <Select
                labelId="report-type-label"
                id="report-type"
                value={reportType}
                onChange={handleReportTypeChange as any}
                label="Report Type"
              >
                <MenuItem value="sales">Sales Report</MenuItem>
                <MenuItem value="customers">Customer Report</MenuItem>
                <MenuItem value="tiers">Tier Distribution</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<DownloadIcon />}
            >
              Export Report
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Report Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Table View" />
          <Tab label="Chart View" />
        </Tabs>
      </Paper>
      
      {/* Report Content */}
      <Paper sx={{ height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          {/* Table View */}
          {reportType === 'sales' && (
            <TableContainer>
              <Typography variant="h6" gutterBottom>
                Sales Report
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Total Sales</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Avg. Order Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{formatDate(row.date)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.totalSales)}</TableCell>
                      <TableCell align="right">{row.transactions}</TableCell>
                      <TableCell align="right">{formatCurrency(row.avgOrderValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {reportType === 'customers' && (
            <TableContainer>
              <Typography variant="h6" gutterBottom>
                Customer Report
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">New Customers</TableCell>
                    <TableCell align="right">Active Customers</TableCell>
                    <TableCell align="right">Inactive Customers</TableCell>
                    <TableCell align="right">Total Customers</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell align="right">{row.newCustomers}</TableCell>
                      <TableCell align="right">{row.activeCustomers}</TableCell>
                      <TableCell align="right">{row.inactiveCustomers}</TableCell>
                      <TableCell align="right">{row.totalCustomers}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {reportType === 'tiers' && (
            <TableContainer>
              <Typography variant="h6" gutterBottom>
                Tier Distribution Report
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tier</TableCell>
                    <TableCell align="right">Customers</TableCell>
                    <TableCell align="right">% of Total</TableCell>
                    <TableCell align="right">Avg. Spend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tierData.map((row) => (
                    <TableRow key={row.tier}>
                      <TableCell>{row.tier}</TableCell>
                      <TableCell align="right">{row.customers}</TableCell>
                      <TableCell align="right">{formatPercentage(row.percentageOfTotal)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.avgSpend)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {/* Chart View */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Chart view will be implemented in a future update
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Reports;
