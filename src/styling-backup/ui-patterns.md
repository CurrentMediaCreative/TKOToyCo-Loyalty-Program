# UI Patterns

This document captures the key UI patterns used throughout the TKO Toy Co Loyalty Program application. These patterns represent consistent approaches to solving common UI challenges and should be maintained when applying the styling to the simplified version.

## Navigation Patterns

### Sidebar Navigation

The application uses a fixed sidebar for navigation on desktop and a collapsible sidebar on mobile:

- Fixed width of 240px on desktop
- Collapsible with hamburger menu on mobile
- Selected item highlighted with light teal background and teal right border
- Icons and text for each navigation item
- TKO branding at the top

```jsx
// Selected item styling
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

### Tab-Based Content Switching

The main content area uses a tab-based approach to switch between different views:

- Hidden tabs with only one visible at a time
- Content maintains scroll position when switching back
- Full height content areas with independent scrolling

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

## Card Patterns

### Metric Cards

Used for displaying key statistics and metrics:

- Consistent height (140px)
- Three-part structure: label, large number, context
- Color-coded context information (green for positive, red for negative)
- Subtle elevation with light shadow

```jsx
<Paper
  elevation={2}
  sx={{
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    height: 140,
  }}
>
  <Typography variant="h6" color="text.secondary" gutterBottom>
    Total Customers
  </Typography>
  <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
    1,254
  </Typography>
  <Typography variant="body2" color="success.main">
    +12% from last month
  </Typography>
</Paper>
```

### Chart Cards

Used for displaying data visualizations:

- Card with header and content
- Fixed height for the chart area (300px)
- Consistent padding and spacing
- Title in the header

```jsx
<Card>
  <CardHeader title="Monthly Sales" />
  <CardContent>
    <Box sx={{ height: 300 }}>
      {/* Chart content */}
    </Box>
  </CardContent>
</Card>
```

### Settings Cards

Used for grouping related settings:

- Card with title and form elements
- Consistent spacing between form elements
- Grid layout for responsive form fields
- Clear section headings

```jsx
<Paper sx={{ p: 3, mb: 3 }}>
  <Typography variant="h6" gutterBottom>
    General Settings
  </Typography>
  
  <Grid container spacing={2} sx={{ mt: 1 }}>
    {/* Form fields */}
  </Grid>
</Paper>
```

## Table Patterns

### Data Tables

Used for displaying tabular data:

- Consistent header styling
- Hover effect on rows
- Action buttons in the last column
- Chips for status or category display
- Right-aligned numeric values

```jsx
<TableContainer component={Paper}>
  <Table sx={{ minWidth: 650 }} size="medium">
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((item) => (
        <TableRow
          key={item.id}
          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        >
          <TableCell component="th" scope="row">
            {item.name}
          </TableCell>
          <TableCell align="right">
            <IconButton size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Selectable Rows

Used for tables where rows can be selected:

- Background color change on selection
- Cursor pointer on hoverable rows
- Click handler on the entire row
- Stop propagation for action buttons

```jsx
<TableRow 
  key={tier.id}
  sx={{ 
    cursor: 'pointer',
    backgroundColor: selectedTier?.id === tier.id ? 'rgba(0, 184, 162, 0.08)' : 'inherit',
    '&:hover': { backgroundColor: 'rgba(0, 184, 162, 0.04)' }
  }}
  onClick={() => setSelectedTier(tier)}
>
  {/* Row content */}
  <TableCell align="right">
    <IconButton 
      size="small" 
      onClick={(e) => {
        e.stopPropagation();
        handleEditTier(tier.id);
      }}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  </TableCell>
</TableRow>
```

## Form Patterns

### Search and Filter

Used for filtering data tables:

- Search field with consistent width
- Filter dropdown with clear labeling
- Horizontal layout with space-between alignment
- Consistent margin below the controls

```jsx
<Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
  <TextField
    label="Search Customers"
    variant="outlined"
    size="small"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    sx={{ width: '300px' }}
  />
  <FormControl size="small" sx={{ width: '200px' }}>
    <InputLabel>Filter by Tier</InputLabel>
    <Select
      value={tierFilter}
      label="Filter by Tier"
      onChange={(e) => setTierFilter(e.target.value)}
    >
      <MenuItem value="">All Tiers</MenuItem>
      {/* Filter options */}
    </Select>
  </FormControl>
</Box>
```

### Form Layouts

Used for input forms:

- Grid-based layout for responsive design
- Consistent spacing between form elements
- Full-width inputs on mobile, side-by-side on desktop
- Clear labeling for all inputs

```jsx
<Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
    <TextField
      fullWidth
      label="First Name"
      value={formData.firstName}
      onChange={(e) => handleChange('firstName', e.target.value)}
    />
  </Grid>
  <Grid item xs={12} sm={6}>
    <TextField
      fullWidth
      label="Last Name"
      value={formData.lastName}
      onChange={(e) => handleChange('lastName', e.target.value)}
    />
  </Grid>
  {/* Additional form fields */}
</Grid>
```

### Action Buttons

Used for form submissions and actions:

- Primary button for main action (contained variant)
- Secondary button for alternative action (outlined variant)
- Right-aligned for form submissions
- Space-between for multiple actions of equal importance
- Consistent button text styling (no uppercase)

```jsx
<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
  <Button
    variant="contained"
    color="primary"
    onClick={handleSubmit}
  >
    Save Changes
  </Button>
</Box>

// Or for multiple actions
<Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
  <Button
    variant="contained"
    color="primary"
    startIcon={<LocalOfferIcon />}
    onClick={handlePrimaryAction}
  >
    Primary Action
  </Button>
  <Button
    variant="outlined"
    color="primary"
    onClick={handleSecondaryAction}
  >
    Secondary Action
  </Button>
</Box>
```

## Status Indicators

### Tier Chips

Used for displaying customer tiers:

- Chip component with primary color
- Bold text for emphasis
- Consistent size (small in tables, medium in detail views)

```jsx
<Chip 
  label={customer.currentTier.name} 
  color="primary" 
  size="small" 
  sx={{ fontWeight: 'bold' }} 
/>
```

### Progress Indicators

Used for showing progress toward goals:

- Custom-styled LinearProgress component
- Increased height (10px) for better visibility
- Rounded ends with borderRadius
- Color changes based on state (teal for normal, yellow when close to goal)

```jsx
<LinearProgress 
  variant="determinate" 
  value={progressPercentage} 
  sx={{ 
    height: 10, 
    borderRadius: 5,
    backgroundColor: 'grey.300',
    '& .MuiLinearProgress-bar': {
      backgroundColor: isCloseToGoal ? 'secondary.main' : 'primary.main',
    }
  }}
/>
```

### Status Text

Used for indicating changes or status:

- Color-coded text (green for positive, red for negative)
- Consistent typography variant (body2)
- Often paired with directional indicators or icons

```jsx
<Typography variant="body2" color="success.main">
  +12% from last month
</Typography>

<Typography variant="body2" color="error.main">
  -3% from last month
</Typography>
```

## Interactive Patterns

### Hover Effects

Used for indicating interactive elements:

- Subtle background color change on hover
- Consistent hover color based on the element type
- Transition for smooth effect

```jsx
sx={{
  '&:hover': {
    backgroundColor: 'rgba(0, 184, 162, 0.04)',
  },
}}
```

### Selection Indicators

Used for showing selected items:

- Background color change
- Border highlight (often on the right side)
- Consistent selection color across the application

```jsx
sx={{
  '&.Mui-selected': {
    backgroundColor: 'rgba(0, 184, 162, 0.08)',
    borderRight: `3px solid ${theme.palette.primary.main}`,
  },
}}
```

### Loading Indicators

Used for asynchronous operations:

- Spinner animation for loading states
- Disabled buttons during loading
- Color changes to indicate status (success/error)

```jsx
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
```

## Notification Patterns

### Highlighted Information

Used for drawing attention to important information:

- Colored background and border
- Icon to reinforce the message type
- Bold text for emphasis
- Rounded corners for visual distinction

```jsx
<Box sx={{ 
  display: 'flex', 
  alignItems: 'center',
  p: 1,
  bgcolor: 'secondary.light',
  borderRadius: 1,
  border: 1, 
  borderColor: 'secondary.main'
}}>
  <ArrowUpwardIcon color="secondary" sx={{ mr: 1 }} />
  <Typography variant="body1" color="secondary.dark" fontWeight="bold">
    Important notification message!
  </Typography>
</Box>
```

### Action Prompts

Used for suggesting actions to the user:

- Clear, action-oriented text
- Visual emphasis through color and typography
- Often paired with an icon
- Positioned prominently in the UI

```jsx
<Box sx={{ 
  display: 'flex', 
  alignItems: 'center',
  p: 2,
  bgcolor: 'primary.light',
  borderRadius: 1,
}}>
  <AddIcon color="primary" sx={{ mr: 1 }} />
  <Typography variant="body1" color="primary.dark">
    Add your first customer to get started
  </Typography>
  <Button 
    variant="contained" 
    color="primary"
    size="small"
    sx={{ ml: 2 }}
  >
    Add Customer
  </Button>
</Box>
```

## Layout Patterns

### Section Dividers

Used for separating content sections:

- Divider component between related but distinct sections
- Consistent spacing above and below
- Sometimes with section headings

```jsx
<Divider sx={{ my: 2 }} />
```

### Content Padding

Used for consistent spacing:

- Consistent padding in cards and containers (p: 2 or p: 3)
- Margin between related elements (mb: 2, mt: 2)
- Grid spacing for consistent gaps (spacing={2} or spacing={3})

```jsx
<Box sx={{ p: 2, mb: 3 }}>
  {/* Content */}
</Box>
```

### Responsive Layouts

Used for adapting to different screen sizes:

- Grid system with breakpoints (xs, sm, md, lg)
- Conditional display based on screen size
- Flexible widths with fixed constraints

```jsx
<Grid container spacing={3}>
  <Grid item xs={12} md={8}>
    {/* Main content */}
  </Grid>
  <Grid item xs={12} md={4}>
    {/* Sidebar content */}
  </Grid>
</Grid>
```

## Implementation Notes

- These UI patterns should be consistently applied throughout the application
- The patterns use Material-UI components and styling system
- The theme provides the color palette and typography settings
- Responsive design is achieved through the Material-UI Grid system and breakpoints
- Consistent spacing is maintained using the theme's spacing system
