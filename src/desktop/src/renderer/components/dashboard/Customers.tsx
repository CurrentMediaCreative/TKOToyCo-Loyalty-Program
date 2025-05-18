import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { getCustomerService } from '../../services/ServiceFactory';
import { Customer } from '../../models/Customer';

/**
 * Customers component
 * Displays customer list with search and filtering
 */
const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Mock data - in a real implementation, this would come from the API
  const customers: Customer[] = [
    {
      id: '1',
      name: 'John Smith',
      phone: '555-123-4567',
      email: 'john.smith@example.com',
      joinDate: '2024-01-15',
      currentTierId: '4',
      currentTier: {
        id: '4',
        name: 'Heavyweight',
        spendThreshold: 25000, // $25,000+
        benefits: []
      },
      totalSpend: 2245,
      isActive: true
    },
    {
      id: '2',
      name: 'Jane Doe',
      phone: '555-987-6543',
      email: 'jane.doe@example.com',
      joinDate: '2024-02-20',
      currentTierId: '2',
      currentTier: {
        id: '2',
        name: 'Lightweight',
        spendThreshold: 1500, // $1,500-$4,999
        benefits: []
      },
      totalSpend: 750,
      isActive: true
    },
    {
      id: '3',
      name: 'Bob Johnson',
      phone: '555-555-5555',
      email: 'bob.johnson@example.com',
      joinDate: '2024-03-10',
      currentTierId: '3',
      currentTier: {
        id: '3',
        name: 'Welterweight',
        spendThreshold: 5000, // $5,000-$24,999
        benefits: []
      },
      totalSpend: 1850,
      isActive: true
    },
    {
      id: '4',
      name: 'Alice Williams',
      phone: '555-222-3333',
      email: 'alice.williams@example.com',
      joinDate: '2024-01-05',
      currentTierId: '5',
      currentTier: {
        id: '5',
        name: 'Reigning Champion',
        spendThreshold: null, // Invite-only tier (no strict amount)
        benefits: []
      },
      totalSpend: 6500,
      isActive: true
    },
    {
      id: '5',
      name: 'Charlie Brown',
      phone: '555-444-7777',
      email: 'charlie.brown@example.com',
      joinDate: '2024-04-01',
      currentTierId: '1',
      currentTier: {
        id: '1',
        name: 'Featherweight',
        spendThreshold: 0, // $0-$1,499
        benefits: []
      },
      totalSpend: 250,
      isActive: true
    }
  ];

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get tier color
  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'Featherweight':
        return 'default';
      case 'Lightweight':
        return 'primary';
      case 'Welterweight':
        return 'info';
      case 'Heavyweight':
        return 'secondary';
      case 'Reigning Champion':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Customers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
        >
          Add Customer
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <TextField
            placeholder="Search customers..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ width: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
          >
            Filter
          </Button>
        </Box>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="customers table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell align="right">Total Spend</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((customer) => (
                <TableRow
                  key={customer.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  hover
                >
                  <TableCell component="th" scope="row">
                    {customer.name}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{formatDate(customer.joinDate)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.currentTier.name} 
                      color={getTierColor(customer.currentTier.name) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(customer.totalSpend)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={customer.isActive ? 'Active' : 'Inactive'} 
                      color={customer.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default Customers;
