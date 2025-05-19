# Customer Popup Styling

This document captures the styling and structure of the customer popup component from `CustomerPopup.tsx`.

## Component Structure

The CustomerPopup component displays customer loyalty information in a card-based layout with several sections:

```
+-------------------------------------------------------+
| Customer Loyalty Information                      [X] |
+-------------------------------------------------------+
| Customer Name                                         |
| Current Tier: [Tier Chip]                             |
| Total Spend: $X,XXX                                   |
+-------------------------------------------------------+
| Tier Progress                                         |
| [Progress Bar] XX%                                    |
| Next Tier: $XXX more to reach [Tier Name]             |
+-------------------------------------------------------+
| Current Benefits                                      |
| • Benefit 1                                           |
| • Benefit 2                                           |
| • Benefit 3                                           |
+-------------------------------------------------------+
| Next Tier: [Tier Name]                                |
| Additional benefits you'll receive:                   |
| • Benefit 4                                           |
| • Benefit 5                                           |
+-------------------------------------------------------+
| [Apply Discount] [View Full Profile]                  |
+-------------------------------------------------------+
```

## Key Styling Elements

### Container

```jsx
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
  {/* Component content */}
</Paper>
```

### Header

```jsx
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
```

### Customer Info Section

```jsx
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
```

### Tier Progress Section

```jsx
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
```

### Benefits Section

```jsx
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
```

### Next Tier Preview

```jsx
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
```

### Action Section

```jsx
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
```

## Key Styling Patterns

1. **Card-Based Layout**: The entire component is contained within a Paper component with elevation and rounded corners
2. **Section Separation**: Clear visual separation between different sections using dividers
3. **Tier Progress Visualization**: 
   - Custom styled LinearProgress component with increased height and rounded corners
   - Color changes based on proximity to next tier (teal for normal, yellow when close)
   - Special highlighted box when close to next tier upgrade
4. **Tier Chip**: The current tier is displayed as a chip with the primary color
5. **Information Layout**: Consistent use of flex layout with space-between for label-value pairs
6. **Typography Hierarchy**: Clear hierarchy with different typography variants for headings and content
7. **Dense Information Display**: Compact layout with dense lists for benefits
8. **Action Buttons**: Primary and secondary button styles for different actions

## Special UI Features

### "Close to Next Tier" Notification

When a customer is close to reaching the next tier (95%+ progress), the UI shows a special highlighted notification:

```jsx
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
    // Regular display
  )}
</Box>
```

### Tier Progress Bar

The tier progress bar changes color based on proximity to the next tier:

```jsx
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
```

### Dynamic Button Text

The "Apply Discount" button dynamically shows the appropriate discount percentage based on the customer's current tier:

```jsx
<Button
  variant="contained"
  color="primary"
  startIcon={<LocalOfferIcon />}
  onClick={handleApplyDiscount}
>
  Apply {customer.currentTier.benefits.find(b => b.name.includes('Discount'))?.name.split(' ')[0]} Discount
</Button>
```

## Implementation Notes

- The component uses a flex layout to ensure proper spacing and alignment
- Sections are separated by Divider components for visual clarity
- The benefits list uses a dense layout to maximize information display
- The component handles different states (highest tier vs. has next tier)
- Special styling is applied when a customer is close to the next tier
- The component integrates with the customer service to calculate tier progress
