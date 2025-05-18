import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Chip,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

// Mock data for customers
const mockCustomers = [
  {
    id: 1,
    name: "John Smith",
    email: "john@example.com",
    phone: "555-123-4567",
    tier: "Lightweight",
    totalSpend: 1250.75,
    joinDate: "2025-01-15",
    lastPurchase: "2025-05-10",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "555-234-5678",
    tier: "Welterweight",
    totalSpend: 3450.25,
    joinDate: "2024-11-20",
    lastPurchase: "2025-05-12",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "555-345-6789",
    tier: "Heavyweight",
    totalSpend: 5670.5,
    joinDate: "2024-09-05",
    lastPurchase: "2025-05-14",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "555-456-7890",
    tier: "Featherweight",
    totalSpend: 750.3,
    joinDate: "2025-02-28",
    lastPurchase: "2025-05-01",
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david@example.com",
    phone: "555-567-8901",
    tier: "Champion",
    totalSpend: 10250.75,
    joinDate: "2024-06-10",
    lastPurchase: "2025-05-15",
  },
  {
    id: 6,
    name: "Jennifer Taylor",
    email: "jennifer@example.com",
    phone: "555-678-9012",
    tier: "Lightweight",
    totalSpend: 1850.25,
    joinDate: "2025-01-05",
    lastPurchase: "2025-04-30",
  },
  {
    id: 7,
    name: "Robert Anderson",
    email: "robert@example.com",
    phone: "555-789-0123",
    tier: "Welterweight",
    totalSpend: 3250.0,
    joinDate: "2024-10-15",
    lastPurchase: "2025-05-08",
  },
  {
    id: 8,
    name: "Lisa Martinez",
    email: "lisa@example.com",
    phone: "555-890-1234",
    tier: "Featherweight",
    totalSpend: 950.5,
    joinDate: "2025-03-01",
    lastPurchase: "2025-05-02",
  },
];

// Get tier color based on tier name
const getTierColor = (tier: string): string => {
  switch (tier) {
    case "Featherweight":
      return "#FFD23F"; // Yellow
    case "Lightweight":
      return "#FF7C2A"; // Orange
    case "Welterweight":
      return "#00B8A2"; // Teal
    case "Heavyweight":
      return "#0088A9"; // Blue
    case "Champion":
      return "#5D3FD3"; // Purple
    default:
      return "#9e9e9e"; // Grey
  }
};

const Customers: React.FC = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter customers based on search term
  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
  );

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Customers</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ height: 40 }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search and Filter */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, email, or phone"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label="All Customers"
                  color="primary"
                  variant="filled"
                  onClick={() => {}}
                />
                <Chip label="Featherweight" onClick={() => {}} />
                <Chip label="Lightweight" onClick={() => {}} />
                <Chip label="Welterweight" onClick={() => {}} />
                <Chip label="Heavyweight" onClick={() => {}} />
                <Chip label="Champion" onClick={() => {}} />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer>
          <Table stickyHeader aria-label="customers table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell>Total Spend</TableCell>
                <TableCell>Join Date</TableCell>
                <TableCell>Last Purchase</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                  <TableRow key={customer.id} hover>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={customer.tier}
                        sx={{
                          backgroundColor: `${getTierColor(customer.tier)}20`,
                          color: getTierColor(customer.tier),
                          fontWeight: 500,
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(customer.totalSpend)}</TableCell>
                    <TableCell>{customer.joinDate}</TableCell>
                    <TableCell>{customer.lastPurchase}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <IconButton
                          size="small"
                          color="primary"
                          aria-label="view customer"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          aria-label="edit customer"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="delete customer"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export default Customers;
