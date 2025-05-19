# Dashboard Components Styling

This document captures the styling and structure of the dashboard components from the `dashboard` directory.

## Dashboard Component

The main Dashboard component (`Dashboard.tsx`) displays key metrics and statistics in a card-based layout.

### Layout Structure

```
+---------------------------------------------------+
| Dashboard                                         |
+---------------------------------------------------+
| +-------+ +-------+ +-------+ +-------+           |
| | Total | | Active| |Monthly| | Avg.  |           |
| |Custmrs| |Members| |Revenue| |Purchse|           |
| +-------+ +-------+ +-------+ +-------+           |
|                                                   |
| +-------------------------------+ +-------------+ |
| |                               | |             | |
| |        Monthly Sales          | |  Customer   | |
| |                               | |    Tier     | |
| |                               | | Distribution| |
| |                               | |             | |
| +-------------------------------+ +-------------+ |
+---------------------------------------------------+
```

### Key Metrics Cards

```jsx
<Grid container spacing={3} sx={{ mb: 4 }}>
  <Grid item xs={12} sm={6} md={3}>
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
  </Grid>
  {/* Additional metric cards with similar structure */}
</Grid>
```

### Chart Cards

```jsx
<Grid container spacing={3}>
  <Grid item xs={12} md={8}>
    <Card>
      <CardHeader title="Monthly Sales" />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
            Bar Chart Placeholder
          </Typography>
          {/* Chart component would be here */}
        </Box>
      </CardContent>
    </Card>
  </Grid>
  <Grid item xs={12} md={4}>
    <Card>
      <CardHeader title="Customer Tier Distribution" />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
            Pie Chart Placeholder
          </Typography>
          {/* Chart component would be here */}
        </Box>
      </CardContent>
    </Card>
  </Grid>
</Grid>
```

## Customers Component

The Customers component (`Customers.tsx`) displays a list of customers with search and filtering capabilities.

### Layout Structure

```
+---------------------------------------------------+
| Customers                                         |
| +-----------------------------------------------+ |
| | Search: [                    ] [Filter ▼]     | |
| +-----------------------------------------------+ |
| +-----------------------------------------------+ |
| | Name    | Phone   | Email   | Tier    | Spend | |
| +-----------------------------------------------+ |
| | John S. | 555-... | john@.. | Heavyw..| $2,245| |
| | Jane D. | 555-... | jane@.. | Lightw..| $750  | |
| | Bob J.  | 555-... | bob@... | Welter..| $1,850| |
| | Alice W.| 555-... | alice@. | Reigning| $6,500| |
| | Charlie | 555-... | charlie | Feather.| $250  | |
| +-----------------------------------------------+ |
| |                  Pagination                   | |
| +-----------------------------------------------+ |
+---------------------------------------------------+
```

### Search and Filter Section

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
      {tiers.map((tier) => (
        <MenuItem key={tier.id} value={tier.id}>
          {tier.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Box>
```

### Customer Table

```jsx
<TableContainer component={Paper}>
  <Table sx={{ minWidth: 650 }} size="medium">
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Phone</TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Tier</TableCell>
        <TableCell align="right">Total Spend</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {filteredCustomers.map((customer) => (
        <TableRow
          key={customer.id}
          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        >
          <TableCell component="th" scope="row">
            {customer.name}
          </TableCell>
          <TableCell>{customer.phone}</TableCell>
          <TableCell>{customer.email}</TableCell>
          <TableCell>
            <Chip 
              label={customer.currentTier.name} 
              color="primary" 
              size="small" 
            />
          </TableCell>
          <TableCell align="right">
            {formatCurrency(customer.totalSpend)}
          </TableCell>
          <TableCell align="right">
            <IconButton 
              size="small" 
              onClick={() => handleViewCustomer(customer.id)}
              title="View Customer"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleEditCustomer(customer.id)}
              title="Edit Customer"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

## Tiers Component

The Tiers component (`Tiers.tsx`) displays and manages loyalty tiers and their benefits.

### Layout Structure

```
+---------------------------------------------------+
| Tiers                                             |
| +-----------------------------------------------+ |
| | [Add Tier]                                    | |
| +-----------------------------------------------+ |
| +-----------------------------------------------+ |
| | Tier Name | Threshold | Benefits | Actions    | |
| +-----------------------------------------------+ |
| | Featherw. | $0        | 1 benefit| [Edit][Del]| |
| | Lightwei. | $1,500    | 2 benefits| [Edit][Del]| |
| | Welterwe. | $5,000    | 3 benefits| [Edit][Del]| |
| | Heavywei. | $25,000   | 3 benefits| [Edit][Del]| |
| | Reigning  | Invite    | 4 benefits| [Edit][Del]| |
| +-----------------------------------------------+ |
|                                                   |
| Tier Details: Lightweight                         |
| +-----------------------------------------------+ |
| | Benefits                                      | |
| | • 10% Discount on All Purchases               | |
| | • Free Shipping on Orders Over $50            | |
| +-----------------------------------------------+ |
| | [Add Benefit]                                 | |
| +-----------------------------------------------+ |
+---------------------------------------------------+
```

### Tiers Table

```jsx
<TableContainer component={Paper} sx={{ mb: 4 }}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Tier Name</TableCell>
        <TableCell>Spend Threshold</TableCell>
        <TableCell>Benefits</TableCell>
        <TableCell align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {tiers.map((tier) => (
        <TableRow 
          key={tier.id}
          sx={{ 
            cursor: 'pointer',
            backgroundColor: selectedTier?.id === tier.id ? 'rgba(0, 184, 162, 0.08)' : 'inherit',
            '&:hover': { backgroundColor: 'rgba(0, 184, 162, 0.04)' }
          }}
          onClick={() => setSelectedTier(tier)}
        >
          <TableCell>{tier.name}</TableCell>
          <TableCell>
            {tier.spendThreshold === null 
              ? 'Invite Only' 
              : formatCurrency(tier.spendThreshold)}
          </TableCell>
          <TableCell>{tier.benefits.length} benefits</TableCell>
          <TableCell align="right">
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleEditTier(tier.id);
              }}
              title="Edit Tier"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTier(tier.id);
              }}
              title="Delete Tier"
              disabled={tier.id === '1'} // Prevent deleting the base tier
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Tier Details Section

```jsx
{selectedTier && (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>
      Tier Details: {selectedTier.name}
    </Typography>
    
    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
      Benefits
    </Typography>
    
    <List>
      {selectedTier.benefits.map((benefit) => (
        <ListItem 
          key={benefit.id}
          secondaryAction={
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={() => handleDeleteBenefit(benefit.id)}
            >
              <DeleteIcon />
            </IconButton>
          }
        >
          <ListItemText
            primary={benefit.name}
            secondary={benefit.description}
          />
        </ListItem>
      ))}
    </List>
    
    <Button
      variant="outlined"
      startIcon={<AddIcon />}
      onClick={handleAddBenefit}
      sx={{ mt: 2 }}
    >
      Add Benefit
    </Button>
  </Paper>
)}
```

## Reports Component

The Reports component (`Reports.tsx`) displays analytics and data visualizations.

### Layout Structure

```
+---------------------------------------------------+
| Reports                                           |
| +-----------------------------------------------+ |
| | Date Range: [Start Date] - [End Date] [Apply] | |
| +-----------------------------------------------+ |
|                                                   |
| +-----------------------------------------------+ |
| |                                               | |
| |           Sales by Tier Chart                 | |
| |                                               | |
| +-----------------------------------------------+ |
|                                                   |
| +-----------------------------------------------+ |
| |                                               | |
| |           Customer Growth Chart               | |
| |                                               | |
| +-----------------------------------------------+ |
|                                                   |
| +-----------------------------------------------+ |
| |                                               | |
| |           Tier Transition Chart               | |
| |                                               | |
| +-----------------------------------------------+ |
+---------------------------------------------------+
```

### Date Range Selector

```jsx
<Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
  <Typography variant="body1">Date Range:</Typography>
  <TextField
    label="Start Date"
    type="date"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    InputLabelProps={{ shrink: true }}
    size="small"
  />
  <Typography variant="body1">-</Typography>
  <TextField
    label="End Date"
    type="date"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    InputLabelProps={{ shrink: true }}
    size="small"
  />
  <Button 
    variant="contained" 
    onClick={handleApplyDateRange}
  >
    Apply
  </Button>
</Box>
```

### Chart Cards

```jsx
<Grid container spacing={3}>
  <Grid item xs={12}>
    <Card>
      <CardHeader title="Sales by Tier" />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
            Bar Chart Placeholder
          </Typography>
          {/* Chart component would be here */}
        </Box>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <Card>
      <CardHeader title="Customer Growth" />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
            Line Chart Placeholder
          </Typography>
          {/* Chart component would be here */}
        </Box>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} md={6}>
    <Card>
      <CardHeader title="Tier Transitions" />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 10 }}>
            Sankey Diagram Placeholder
          </Typography>
          {/* Chart component would be here */}
        </Box>
      </CardContent>
    </Card>
  </Grid>
</Grid>
```

## Settings Component

The Settings component (`Settings.tsx`) provides configuration options for the application.

### Layout Structure

```
+---------------------------------------------------+
| Settings                                          |
| +-----------------------------------------------+ |
| | General Settings                              | |
| | Application Name: [TKO Toy Co Loyalty Program]| |
| | Theme: [Light ▼]                             | |
| | Language: [English ▼]                        | |
| +-----------------------------------------------+ |
|                                                   |
| +-----------------------------------------------+ |
| | Notification Settings                         | |
| | [x] Email Notifications                       | |
| | [x] Desktop Notifications                     | |
| | [ ] Push Notifications                        | |
| +-----------------------------------------------+ |
|                                                   |
| +-----------------------------------------------+ |
| | Integration Settings                          | |
| | Shopify API Key: [••••••••••••] [Edit]        | |
| | POS Binder API Key: [••••••••••] [Edit]       | |
| | Sync Frequency: [Hourly ▼]                   | |
| +-----------------------------------------------+ |
|                                                   |
| [Save Changes]                                    |
+---------------------------------------------------+
```

### Settings Sections

```jsx
<Paper sx={{ p: 3, mb: 3 }}>
  <Typography variant="h6" gutterBottom>
    General Settings
  </Typography>
  
  <Grid container spacing={2} sx={{ mt: 1 }}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Application Name"
        value={settings.appName}
        onChange={(e) => handleSettingChange('appName', e.target.value)}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Theme</InputLabel>
        <Select
          value={settings.theme}
          label="Theme"
          onChange={(e) => handleSettingChange('theme', e.target.value)}
        >
          <MenuItem value="light">Light</MenuItem>
          <MenuItem value="dark">Dark</MenuItem>
          <MenuItem value="system">System Default</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Language</InputLabel>
        <Select
          value={settings.language}
          label="Language"
          onChange={(e) => handleSettingChange('language', e.target.value)}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="fr">French</MenuItem>
          <MenuItem value="es">Spanish</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  </Grid>
</Paper>

{/* Additional settings sections with similar structure */}

<Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
  <Button
    variant="contained"
    color="primary"
    onClick={handleSaveSettings}
    disabled={!settingsChanged}
  >
    Save Changes
  </Button>
</Box>
```

## Key Styling Patterns

1. **Card-Based Layout**: All dashboard components use card-based layouts with consistent styling
2. **Grid System**: Material-UI's Grid component is used for responsive layouts
3. **Typography Hierarchy**: Consistent use of typography variants for headings and content
4. **Form Controls**: Consistent styling for form inputs, selects, and buttons
5. **Table Styling**: Consistent table styling with hover effects and action buttons
6. **Spacing**: Consistent spacing between elements and sections
7. **Color Usage**: Primary color for interactive elements, secondary for highlights
8. **Visual Feedback**: Hover and selection states for interactive elements

## Implementation Notes

- All dashboard components follow a consistent styling approach
- The components are designed to be responsive and work on different screen sizes
- Card-based layouts provide clear visual separation between different sections
- Tables include interactive elements like row selection and action buttons
- Form controls use consistent styling and layout
- Charts are placeholders that would be implemented with a charting library
