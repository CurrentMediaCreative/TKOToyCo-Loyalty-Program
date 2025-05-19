# Main Layout Styling

This document captures the styling and structure of the main application layout from `MainWindow.tsx`.

## Layout Structure

The main window uses a responsive layout with a fixed sidebar and content area:

```
+---------------------+-----------------------------------+
|                     |                                   |
|                     |            App Bar                |
|                     |                                   |
|                     +-----------------------------------+
|                     |                                   |
|      Sidebar        |                                   |
|                     |                                   |
|                     |          Content Area             |
|                     |                                   |
|                     |                                   |
|                     |                                   |
+---------------------+-----------------------------------+
```

## Key Styling Elements

### Sidebar

```jsx
// Sidebar width constant
const drawerWidth = 240;

// Sidebar styling
<Box
  component="nav"
  sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
>
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
```

### App Bar

```jsx
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
```

### Content Area

```jsx
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
  {/* Other tab panels */}
</Box>
```

### Navigation Items

```jsx
const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, index: 0 },
  { text: 'Customers', icon: <PeopleIcon />, index: 1 },
  { text: 'Tiers', icon: <TiersIcon />, index: 2 },
  { text: 'Reports', icon: <ReportsIcon />, index: 3 },
  { text: 'Settings', icon: <SettingsIcon />, index: 4 },
];
```

### Navigation Item Styling

```jsx
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
```

### Tab Panel Component

```jsx
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
```

## Responsive Behavior

- The sidebar is fixed on desktop (screens >= sm breakpoint)
- On mobile, the sidebar is hidden and can be toggled with a hamburger menu
- The app bar spans the full width on mobile and is adjusted on desktop to account for the sidebar
- Content area adjusts its width based on the sidebar visibility

## Key Styling Patterns

1. **Sidebar Highlighting**: Selected items have a light teal background and teal right border
2. **Icon Coloring**: Navigation icons use the primary teal color
3. **Elevation**: Subtle shadow on the sidebar for depth
4. **Responsive Adjustments**: Different layouts for mobile and desktop
5. **Animation**: Sync icon has a rotation animation when syncing
6. **Status Indication**: Color changes based on sync status (success/error)

## Implementation Notes

- The drawer width is defined as a constant (`drawerWidth = 240px`) and used consistently throughout the layout
- The sidebar has both mobile (temporary) and desktop (permanent) versions
- Tab panels are used to switch between different content sections
- The main content area has padding and proper height calculation to avoid overflow issues
