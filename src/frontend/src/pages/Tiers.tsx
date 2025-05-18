import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";

// Mock data for tiers
const mockTiers = [
  {
    id: 1,
    name: "Featherweight",
    spendThreshold: 0,
    color: "#FFD23F",
    benefits: ["Welcome gift", "Birthday reward", "Exclusive newsletter"],
    customerCount: 450,
  },
  {
    id: 2,
    name: "Lightweight",
    spendThreshold: 1000,
    color: "#FF7C2A",
    benefits: [
      "Welcome gift",
      "Birthday reward",
      "Exclusive newsletter",
      "5% discount on all purchases",
      "Early access to sales",
    ],
    customerCount: 350,
  },
  {
    id: 3,
    name: "Welterweight",
    spendThreshold: 3000,
    color: "#00B8A2",
    benefits: [
      "Welcome gift",
      "Birthday reward",
      "Exclusive newsletter",
      "10% discount on all purchases",
      "Early access to sales",
      "Free shipping on all orders",
    ],
    customerCount: 250,
  },
  {
    id: 4,
    name: "Heavyweight",
    spendThreshold: 5000,
    color: "#0088A9",
    benefits: [
      "Welcome gift",
      "Birthday reward",
      "Exclusive newsletter",
      "15% discount on all purchases",
      "Early access to sales",
      "Free shipping on all orders",
      "Exclusive events",
      "Personal shopping assistant",
    ],
    customerCount: 150,
  },
  {
    id: 5,
    name: "Champion",
    spendThreshold: 10000,
    color: "#5D3FD3",
    benefits: [
      "Welcome gift",
      "Birthday reward",
      "Exclusive newsletter",
      "20% discount on all purchases",
      "Early access to sales",
      "Free shipping on all orders",
      "Exclusive events",
      "Personal shopping assistant",
      "VIP customer service",
      "Annual gift",
    ],
    customerCount: 45,
  },
];

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const Tiers: React.FC = () => {
  const theme = useTheme();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentTier, setCurrentTier] = useState<any>(null);

  // Handle edit tier
  const handleEditTier = (tier: any) => {
    setCurrentTier(tier);
    setEditDialogOpen(true);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setCurrentTier(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Loyalty Tiers</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ height: 40 }}
        >
          Add Tier
        </Button>
      </Box>

      {/* Tier Overview */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tier Distribution
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="body2" sx={{ minWidth: 120 }}>
                  Total Customers:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {mockTiers.reduce((sum, tier) => sum + tier.customerCount, 0)}
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                {mockTiers.map((tier) => (
                  <Box key={tier.id} sx={{ mb: 2 }}>
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
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            backgroundColor: tier.color,
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2">{tier.name}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {tier.customerCount} customers
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: "100%",
                        backgroundColor: "#f0f0f0",
                        borderRadius: 1,
                        height: 8,
                      }}
                    >
                      <Box
                        sx={{
                          width: `${
                            (tier.customerCount /
                              mockTiers.reduce(
                                (sum, t) => sum + t.customerCount,
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
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>
                Tier Thresholds
              </Typography>
              {mockTiers.map((tier) => (
                <Box
                  key={tier.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
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
                  <Typography variant="body2">
                    {formatCurrency(tier.spendThreshold)}+
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tier Details */}
      <Grid container spacing={3}>
        {mockTiers.map((tier) => (
          <Grid item xs={12} md={6} lg={4} key={tier.id}>
            <Card
              sx={{
                height: "100%",
                borderTop: `4px solid ${tier.color}`,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">{tier.name}</Typography>
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditTier(tier)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Spend Threshold
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(tier.spendThreshold)}+
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customers in Tier
                  </Typography>
                  <Typography variant="body1">{tier.customerCount}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Benefits
                </Typography>
                <List dense disablePadding>
                  {tier.benefits.map((benefit, index) => (
                    <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <CheckCircleIcon
                          fontSize="small"
                          sx={{ color: tier.color }}
                        />
                      </ListItemIcon>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Tier Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit {currentTier?.name} Tier</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Tier Name"
              variant="outlined"
              margin="normal"
              defaultValue={currentTier?.name}
            />
            <TextField
              fullWidth
              label="Spend Threshold"
              variant="outlined"
              margin="normal"
              type="number"
              defaultValue={currentTier?.spendThreshold}
              InputProps={{
                startAdornment: (
                  <Box component="span" sx={{ mr: 1 }}>
                    $
                  </Box>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Color"
              variant="outlined"
              margin="normal"
              defaultValue={currentTier?.color}
              InputProps={{
                startAdornment: (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: currentTier?.color,
                      mr: 1,
                    }}
                  />
                ),
              }}
            />

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Benefits
            </Typography>
            {currentTier?.benefits.map((benefit: string, index: number) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  defaultValue={benefit}
                  variant="outlined"
                />
                <IconButton size="small" sx={{ ml: 1 }}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
            >
              Add Benefit
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCloseDialog}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Tiers;
