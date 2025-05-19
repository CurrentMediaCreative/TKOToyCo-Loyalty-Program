# Tier Progress Visualization

This document captures the styling and implementation of the tier progress visualization, which is a key UI pattern in the TKO Toy Co Loyalty Program application.

## Overview

The tier progress visualization shows customers their progress toward the next loyalty tier. It includes:

1. A progress bar showing percentage completion
2. Text indicating the amount needed to reach the next tier
3. Special highlighting when close to reaching the next tier
4. Current tier benefits and next tier preview

## Implementation in CustomerPopup.tsx

The tier progress visualization is primarily implemented in the `CustomerPopup.tsx` component:

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

## Key Styling Elements

### Progress Bar

The progress bar is implemented using Material-UI's `LinearProgress` component with custom styling:

```jsx
<LinearProgress 
  variant="determinate" 
  value={tierProgress.progressPercentage} 
  sx={{ 
    height: 10,  // Taller than default for better visibility
    borderRadius: 5,  // Rounded ends
    backgroundColor: 'grey.300',  // Light gray background
    '& .MuiLinearProgress-bar': {
      backgroundColor: tierProgress.isCloseToNextTier ? 'secondary.main' : 'primary.main',
      // Changes color when close to next tier (yellow instead of teal)
    }
  }}
/>
```

### Progress Percentage

The percentage is displayed next to the progress bar:

```jsx
<Typography variant="body2" color="text.secondary">
  {tierProgress.progressPercentage}%
</Typography>
```

### Next Tier Information

The information about the next tier changes appearance based on proximity:

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
    // Special highlighting when close to next tier
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <ArrowUpwardIcon color="secondary" sx={{ mr: 1 }} />
      <Typography variant="body1" color="secondary.dark" fontWeight="bold">
        Only {formatCurrency(tierProgress.amountToNextTier || 0)} away from {tierProgress.nextTier.name}!
      </Typography>
    </Box>
  ) : (
    // Standard display when not close
    <>
      <Typography variant="body1">Next Tier:</Typography>
      <Typography variant="body1">
        {formatCurrency(tierProgress.amountToNextTier || 0)} more to reach {tierProgress.nextTier.name}
      </Typography>
    </>
  )}
</Box>
```

## Business Logic

The tier progress calculation is implemented in the `MockDataService.ts` file:

```typescript
public calculateTierProgress(customer: Customer): TierProgress {
  // Sort tiers by spend threshold (excluding null values or putting them at the end)
  const sortedTiers = [...this.tiers].sort((a, b) => {
    // Handle null values in sort
    if (a.spendThreshold === null) return 1; // null goes to the end
    if (b.spendThreshold === null) return -1; // null goes to the end
    return a.spendThreshold - b.spendThreshold;
  });
  
  // Find current tier
  const currentTier = customer.currentTier;
  
  // Find next tier
  const currentTierIndex = sortedTiers.findIndex(tier => tier.id === currentTier.id);
  const nextTier = currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null;
  
  // Calculate progress
  const currentSpend = customer.totalSpend;
  const nextTierThreshold = nextTier?.spendThreshold || null;
  
  let progressPercentage = 100;
  let amountToNextTier = 0;
  
  if (nextTier && nextTier.spendThreshold !== null && currentTier.spendThreshold !== null) {
    const tierDifference = nextTier.spendThreshold - currentTier.spendThreshold;
    const currentProgress = currentSpend - currentTier.spendThreshold;
    progressPercentage = Math.min(Math.round((currentProgress / tierDifference) * 100), 100);
    amountToNextTier = Math.max(nextTier.spendThreshold - currentSpend, 0);
  }
  
  // Determine if close to next tier (within 5%)
  const isCloseToNextTier = nextTier !== null && progressPercentage >= 95;
  
  return {
    currentTier,
    nextTier,
    currentSpend,
    nextTierThreshold,
    progressPercentage,
    amountToNextTier,
    isCloseToNextTier
  };
}
```

## TierProgress Interface

The tier progress information is defined in the `Customer.ts` file:

```typescript
export interface TierProgress {
  currentTier: Tier;
  nextTier: Tier | null;
  currentSpend: number;
  nextTierThreshold: number | null;
  progressPercentage: number;
  amountToNextTier: number | null;
  isCloseToNextTier: boolean;
}
```

## Key Styling Patterns

1. **Color Changes**: The progress bar changes color from teal to yellow when close to the next tier
2. **Special Highlighting**: A highlighted box with a border appears when close to the next tier
3. **Icon Usage**: An upward arrow icon is shown when close to the next tier
4. **Typography Changes**: Bold text is used to emphasize proximity to the next tier
5. **Responsive Layout**: Flex layout ensures proper alignment on different screen sizes
6. **Conditional Rendering**: Different UI is shown based on progress and tier status

## Visual States

### Standard Progress State

- Teal progress bar
- Simple text showing amount needed to reach next tier
- Clean, minimal design

### Close to Next Tier State

- Yellow progress bar
- Highlighted box with yellow border and light yellow background
- Upward arrow icon
- Bold text emphasizing proximity to next tier
- Exclamation mark for emphasis

### Highest Tier State

- Simple text indicating the customer has reached the highest tier
- No progress bar shown

## Implementation Notes

- The `isCloseToNextTier` flag is set when the customer is within 5% of reaching the next tier
- The progress percentage is calculated based on the difference between the current tier threshold and the next tier threshold
- The component handles edge cases like being at the highest tier
- The design provides clear visual feedback about the customer's loyalty status
- The color change from teal to yellow creates a sense of urgency and excitement when close to the next tier
