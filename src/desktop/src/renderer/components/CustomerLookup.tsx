import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { getCustomerService } from '../services/ServiceFactory';
import { Customer } from '../models/Customer';
import CustomerPopup from '../components/CustomerPopup';

/**
 * Customer lookup component
 * Provides a search interface for looking up customers by phone number
 */
const CustomerLookup: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  /**
   * Handle phone number input change
   * @param event The change event
   */
  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(event.target.value);
    if (error) setError(null);
  };

  /**
   * Handle search button click
   */
  const handleSearch = async () => {
    // Basic validation
    if (!phoneNumber || phoneNumber.trim() === '') {
      setError('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const customerService = getCustomerService();
      const result = await customerService.getCustomerByPhone(phoneNumber);
      
      if (result) {
        setCustomer(result);
      } else {
        setError('Customer not found');
      }
    } catch (err) {
      setError('An error occurred while searching for the customer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    setPhoneNumber('');
    setCustomer(null);
    setError(null);
  };

  /**
   * Handle Enter key press
   * @param event The key press event
   */
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Close the window
   */
  const handleClose = () => {
    if (window.api) {
      window.api.hidePopupWindow();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: 'background.default',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 0,
        }}
      >
        <Typography variant="h6" component="h1">
          TKO Loyalty
        </Typography>
        <IconButton 
          size="small" 
          onClick={handleClose}
          sx={{ color: 'primary.contrastText' }}
        >
          <CloseIcon />
        </IconButton>
      </Paper>

      <Box sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Customer Lookup
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Phone Number"
            variant="outlined"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            onKeyPress={handleKeyPress}
            placeholder="555-123-4567"
            error={!!error}
            helperText={error}
            disabled={loading}
            InputProps={{
              endAdornment: phoneNumber ? (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="clear phone number"
                    onClick={handleClear}
                    edge="end"
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Box>

      {customer && (
        <CustomerPopup customer={customer} onClose={handleClear} />
      )}
    </Box>
  );
};

// Add TypeScript interface for the window.api object
declare global {
  interface Window {
    api?: {
      showMainWindow: () => void;
      hideMainWindow: () => void;
      showPopupWindow: () => void;
      hidePopupWindow: () => void;
      positionPopupWindow: (x: number, y: number) => void;
      lookupCustomer: (phoneNumber: string) => void;
      openCustomerInMain: (customerId: string) => void;
      applyDiscount: (customerId: string, discountType: string) => void;
      syncData: () => void;
      setAutoLaunch: (enabled: boolean) => void;
      getSettings: () => Promise<any>;
      onCustomerData: (callback: (customer: any) => void) => void;
      onNavigateToCustomer: (callback: (customerId: string) => void) => void;
      onSyncComplete: (callback: (result: any) => void) => void;
      onError: (callback: (error: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export default CustomerLookup;
