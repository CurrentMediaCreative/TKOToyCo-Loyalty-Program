import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button, 
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Customer } from '../models/Customer';
import { getCustomerService } from '../services/ServiceFactory';

interface CustomerPopupProps {
  customer: Customer;
  onClose: () => void;
}

/**
 * Customer popup component
 * Displays customer loyalty information and tier benefits
 */
const CustomerPopup: React.FC<CustomerPopupProps> = ({ customer, onClose }) => {
  // Calculate tier progress
  const customerService = getCustomerService();
  const tierProgress = customerService.calculateTierProgress(customer);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Apply discount
  const handleApplyDiscount = () => {
    if (window.api) {
      window.api.applyDiscount(customer.id, customer.currentTier.name);
    }
  };
  
  // View full profile
  const handleViewProfile = () => {
    if (window.api) {
      window.api.openCustomerInMain(customer.id);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        m: 2,
        borderRadius: 2,
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">Customer Loyalty Information</Typography>
        <IconButton 
          size="small" 
          onClick={onClose}
          sx={{ color: 'primary.contrastText' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Customer Info Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>{customer.name}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1">Current Tier:</Typography>
          <Chip 
            label={customer.currentTier.name} 
            color="primary" 
            sx={{ fontWeight: 'bold' }} 
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body1">Total Spend:</Typography>
          <Typography variant="body1" fontWeight="bold">
            {formatCurrency(customer.totalSpend)}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Tier Progress Section */}
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Tier Progress</Typography>
        
        {tierProgress.nextTier ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ flex: 1, mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={tierProgress.progressPercentage} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: tierProgress.isCloseToNextTier ? 'secondary.main' : 'primary.main',
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {tierProgress.progressPercentage}%
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mb: 2,
              p: 1,
              bgcolor: tierProgress.isCloseToNextTier ? 'secondary.light' : 'transparent',
              borderRadius: 1,
              ...(tierProgress.isCloseToNextTier && { border: 1, borderColor: 'secondary.main' })
            }}>
              {tierProgress.isCloseToNextTier ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowUpwardIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="body1" color="secondary.dark" fontWeight="bold">
                    Only {formatCurrency(tierProgress.amountToNextTier || 0)} away from {tierProgress.nextTier.name}!
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="body1">Next Tier:</Typography>
                  <Typography variant="body1">
                    {formatCurrency(tierProgress.amountToNextTier || 0)} more to reach {tierProgress.nextTier.name}
                  </Typography>
                </>
              )}
            </Box>
          </>
        ) : (
          <Typography variant="body1" sx={{ mb: 2 }}>
            You've reached the highest tier!
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Benefits Section */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>Current Benefits</Typography>
        <List dense disablePadding>
          {customer.currentTier.benefits.map((benefit) => (
            <ListItem key={benefit.id} disablePadding sx={{ py: 0.5 }}>
              <ListItemText 
                primary={benefit.name}
                secondary={benefit.description}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Next Tier Preview (if not at highest tier) */}
      {tierProgress.nextTier && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Next Tier: {tierProgress.nextTier.name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Additional benefits you'll receive:
            </Typography>
            <List dense disablePadding>
              {tierProgress.nextTier.benefits
                .filter(nextBenefit => 
                  !customer.currentTier.benefits.some(currentBenefit => 
                    currentBenefit.name === nextBenefit.name
                  )
                )
                .map((benefit) => (
                  <ListItem key={benefit.id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText 
                      primary={benefit.name}
                      secondary={benefit.description}
                    />
                  </ListItem>
                ))
              }
            </List>
          </Box>
        </>
      )}

      {/* Action Section */}
      <Divider />
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<LocalOfferIcon />}
          onClick={handleApplyDiscount}
        >
          Apply {customer.currentTier.benefits.find(b => b.name.includes('Discount'))?.name.split(' ')[0]} Discount
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleViewProfile}
        >
          View Full Profile
        </Button>
      </Box>
    </Paper>
  );
};

export default CustomerPopup;
