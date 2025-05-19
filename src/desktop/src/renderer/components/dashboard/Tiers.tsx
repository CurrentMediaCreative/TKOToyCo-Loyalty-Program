import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
// Import types from main process via global.d.ts
import { Tier, TierBenefit } from "../../../main/models/Customer";

/**
 * Tiers component
 * Displays and manages loyalty tiers and their benefits
 */
const Tiers: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const tiers: Tier[] = [
    {
      id: "1",
      name: "Featherweight",
      spendThreshold: 0, // $0-$1,499
      benefits: [
        {
          id: "1",
          tierId: "1",
          name: "5% Discount on All Purchases",
          description: "Receive a 5% discount on all purchases",
        },
      ],
    },
    {
      id: "2",
      name: "Lightweight",
      spendThreshold: 1500, // $1,500-$4,999
      benefits: [
        {
          id: "2",
          tierId: "2",
          name: "10% Discount on All Purchases",
          description: "Receive a 10% discount on all purchases",
        },
        {
          id: "3",
          tierId: "2",
          name: "Free Shipping on Orders Over $50",
          description: "Get free shipping on any order over $50",
        },
      ],
    },
    {
      id: "3",
      name: "Welterweight",
      spendThreshold: 5000, // $5,000-$24,999
      benefits: [
        {
          id: "4",
          tierId: "3",
          name: "10% Discount on All Purchases",
          description: "Receive a 10% discount on all purchases",
        },
        {
          id: "5",
          tierId: "3",
          name: "Free Shipping on Orders Over $50",
          description: "Get free shipping on any order over $50",
        },
        {
          id: "6",
          tierId: "3",
          name: "Exclusive Access to Pre-releases",
          description: "Get early access to new product releases",
        },
      ],
    },
    {
      id: "4",
      name: "Heavyweight",
      spendThreshold: 25000, // $25,000+
      benefits: [
        {
          id: "7",
          tierId: "4",
          name: "15% Discount on All Purchases",
          description: "Receive a 15% discount on all purchases",
        },
        {
          id: "8",
          tierId: "4",
          name: "Free Shipping on All Orders",
          description: "Get free shipping on any order",
        },
        {
          id: "9",
          tierId: "4",
          name: "VIP Event Invitations",
          description: "Receive invitations to exclusive VIP events",
        },
      ],
    },
    {
      id: "5",
      name: "Reigning Champion",
      spendThreshold: 50000, // Changed from null to a number
      benefits: [
        {
          id: "10",
          tierId: "5",
          name: "20% Discount on All Purchases",
          description: "Receive a 20% discount on all purchases",
        },
        {
          id: "11",
          tierId: "5",
          name: "Free Shipping on All Orders",
          description: "Get free shipping on any order",
        },
        {
          id: "12",
          tierId: "5",
          name: "VIP Event Invitations",
          description: "Receive invitations to exclusive VIP events",
        },
        {
          id: "13",
          tierId: "5",
          name: "Personal Shopping Assistant",
          description: "Get personalized shopping assistance",
        },
      ],
    },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get tier color
  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case "1":
        return "#e0e0e0";
      case "2":
        return "#90caf9";
      case "3":
        return "#42a5f5";
      case "4":
        return "#1976d2";
      case "5":
        return "#0d47a1";
      default:
        return "#e0e0e0";
    }
  };

  // Handle tier selection
  const handleTierSelect = (tier: Tier) => {
    setSelectedTier(tier);
  };

  // Handle edit dialog open
  const handleEditDialogOpen = () => {
    setEditDialogOpen(true);
  };

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  // Special display for Reigning Champion tier
  const getThresholdDisplay = (tier: Tier) => {
    if (tier.id === "5") {
      return "Invite Only";
    }
    return `Spend Threshold: ${formatCurrency(tier.spendThreshold)}`;
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Loyalty Tiers
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />}>
          Add Tier
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Tier Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Tier Levels
            </Typography>
            <List>
              {tiers.map((tier) => (
                <React.Fragment key={tier.id}>
                  <ListItem
                    button
                    selected={selectedTier?.id === tier.id}
                    onClick={() => handleTierSelect(tier)}
                    sx={{
                      borderLeft: `4px solid ${getTierColor(tier.id)}`,
                      mb: 1,
                      "&.Mui-selected": {
                        backgroundColor: `${getTierColor(tier.id)}20`,
                      },
                    }}
                  >
                    <ListItemText
                      primary={tier.name}
                      secondary={getThresholdDisplay(tier)}
                    />
                    <Chip
                      label={`${tier.benefits?.length || 0} benefits`}
                      size="small"
                      color="primary"
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Tier Details */}
        <Grid item xs={12} md={8}>
          {selectedTier ? (
            <Paper sx={{ p: 2, height: "100%" }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography variant="h5" gutterBottom>
                  {selectedTier.name} Tier
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditDialogOpen}
                >
                  Edit Tier
                </Button>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedTier.id === "5"
                    ? "Invite Only Tier"
                    : `Spend Threshold: ${formatCurrency(
                        selectedTier.spendThreshold
                      )}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTier.id === "5"
                    ? "This is an invite-only tier with no specific spend threshold."
                    : `Customers need to spend at least ${formatCurrency(
                        selectedTier.spendThreshold
                      )} to reach this tier.`}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box
                sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}
              >
                <Typography variant="h6">Benefits</Typography>
                <Button size="small" startIcon={<AddIcon />}>
                  Add Benefit
                </Button>
              </Box>

              <List>
                {selectedTier.benefits?.map((benefit) => (
                  <ListItem
                    key={benefit.id}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    }
                    sx={{
                      mb: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={benefit.name}
                      secondary={benefit.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                Select a tier to view details
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Edit Tier Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit {selectedTier?.name} Tier</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tier Name"
            type="text"
            fullWidth
            variant="outlined"
            defaultValue={selectedTier?.name}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Spend Threshold"
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={selectedTier?.spendThreshold}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button
            onClick={handleEditDialogClose}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tiers;
