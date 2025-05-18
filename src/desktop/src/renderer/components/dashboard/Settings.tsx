import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';

/**
 * Settings component
 * Displays application settings and configuration options
 */
const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState('https://api.tkotoyco.com/loyalty');
  const [apiKey, setApiKey] = useState('••••••••••••••••');
  const [syncInterval, setSyncInterval] = useState(15);
  const [autoSync, setAutoSync] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [startWithWindows, setStartWithWindows] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Mock data for API endpoints
  const apiEndpoints = [
    { id: '1', name: 'Customer API', url: 'https://api.tkotoyco.com/loyalty/customers', status: 'Active' },
    { id: '2', name: 'Transaction API', url: 'https://api.tkotoyco.com/loyalty/transactions', status: 'Active' },
    { id: '3', name: 'Tier API', url: 'https://api.tkotoyco.com/loyalty/tiers', status: 'Active' },
    { id: '4', name: 'Reward API', url: 'https://api.tkotoyco.com/loyalty/rewards', status: 'Active' },
    { id: '5', name: 'Card API', url: 'https://api.tkotoyco.com/loyalty/cards', status: 'Active' },
  ];

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real implementation, this would save to electron-store or similar
    setSnackbarMessage('Settings saved successfully');
    setSnackbarOpen(true);
  };

  // Handle test connection
  const handleTestConnection = () => {
    // In a real implementation, this would test the API connection
    setSnackbarMessage('API connection successful');
    setSnackbarOpen(true);
  };

  // Handle reset settings
  const handleResetSettings = () => {
    setResetDialogOpen(true);
  };

  // Handle confirm reset
  const handleConfirmReset = () => {
    // Reset settings to defaults
    setApiUrl('https://api.tkotoyco.com/loyalty');
    setApiKey('••••••••••••••••');
    setSyncInterval(15);
    setAutoSync(true);
    setShowNotifications(true);
    setStartWithWindows(true);
    setMinimizeToTray(true);
    
    setResetDialogOpen(false);
    setSnackbarMessage('Settings reset to defaults');
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* API Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              API Configuration
            </Typography>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                label="API URL"
                variant="outlined"
                fullWidth
                margin="normal"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <TextField
                label="API Key"
                variant="outlined"
                fullWidth
                margin="normal"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveSettings}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleTestConnection}
                >
                  Test Connection
                </Button>
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Synchronization
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    color="primary"
                  />
                }
                label="Auto-sync data"
              />
              <TextField
                label="Sync Interval (minutes)"
                variant="outlined"
                fullWidth
                margin="normal"
                type="number"
                value={syncInterval}
                onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                disabled={!autoSync}
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                Sync Now
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Application Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Application Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Show Notifications"
                  secondary="Display notifications for important events"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={showNotifications}
                    onChange={(e) => setShowNotifications(e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Start with Windows"
                  secondary="Launch application when Windows starts"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={startWithWindows}
                    onChange={(e) => setStartWithWindows(e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Minimize to Tray"
                  secondary="Keep application running in system tray when closed"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={minimizeToTray}
                    onChange={(e) => setMinimizeToTray(e.target.checked)}
                    color="primary"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleResetSettings}
              >
                Reset to Defaults
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              API Endpoints
            </Typography>
            <List>
              {apiEndpoints.map((endpoint) => (
                <React.Fragment key={endpoint.id}>
                  <ListItem>
                    <ListItemText
                      primary={endpoint.name}
                      secondary={endpoint.url}
                    />
                    <ListItemSecondaryAction>
                      <Typography
                        variant="body2"
                        color={endpoint.status === 'Active' ? 'success.main' : 'error.main'}
                      >
                        {endpoint.status}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {endpoint.id !== apiEndpoints[apiEndpoints.length - 1].id && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      {/* Reset confirmation dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Reset Settings</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all settings to their default values? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmReset} color="error" autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
