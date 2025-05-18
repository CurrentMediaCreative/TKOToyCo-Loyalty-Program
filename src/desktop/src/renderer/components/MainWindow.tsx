import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Container,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EmojiEvents as TiersIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';

// Import dashboard components
import Dashboard from './dashboard/Dashboard';
import Customers from './dashboard/Customers';
import Tiers from './dashboard/Tiers';
import Reports from './dashboard/Reports';
import Settings from './dashboard/Settings';

const drawerWidth = 240;

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

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, index: 0 },
  { text: 'Customers', icon: <PeopleIcon />, index: 1 },
  { text: 'Tiers', icon: <TiersIcon />, index: 2 },
  { text: 'Reports', icon: <ReportsIcon />, index: 3 },
  { text: 'Settings', icon: <SettingsIcon />, index: 4 },
];

/**
 * Main window component for the admin interface
 */
const MainWindow: React.FC = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      // Call the syncData method from the preload script
      if (window.api) {
        window.api.syncData();
        
        // Listen for the sync-complete event
        window.api.onSyncComplete((result: any) => {
          if (result.success) {
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
          } else {
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
          }
        });
      }
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const drawer = (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
        }}
      >
        {/* Logo image - using a simple text placeholder for now */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main
          }}
        >
          TKO
        </Typography>
      </Box>
      <Typography
        variant="h6"
        sx={{
          textAlign: 'center',
          mb: 2,
          fontFamily: 'TKO Custom Font, sans-serif',
        }}
      >
        Loyalty Program
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={selectedTab === item.index}
              onClick={() => handleTabChange(item.index)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 184, 162, 0.08)',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
                '&:hover': {
                  backgroundColor: 'rgba(0, 184, 162, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: theme.palette.primary.main,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            TKO Toy Co Loyalty Program
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            title="Sync data with server"
          >
            <SyncIcon 
              sx={{ 
                animation: syncStatus === 'syncing' ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
                color: syncStatus === 'success' ? '#4caf50' : 
                       syncStatus === 'error' ? '#f44336' : 
                       'inherit'
              }} 
            />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          height: 'calc(100% - 64px)',
          overflow: 'hidden',
        }}
      >
        <TabPanel value={selectedTab} index={0}>
          <Dashboard />
        </TabPanel>
        <TabPanel value={selectedTab} index={1}>
          <Customers />
        </TabPanel>
        <TabPanel value={selectedTab} index={2}>
          <Tiers />
        </TabPanel>
        <TabPanel value={selectedTab} index={3}>
          <Reports />
        </TabPanel>
        <TabPanel value={selectedTab} index={4}>
          <Settings />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default MainWindow;
