# TKO Toy Co Loyalty Program Styling Backup

This directory contains a comprehensive backup of the styling and design elements from the current version of the TKO Toy Co Loyalty Program desktop application. The purpose of this backup is to preserve the visual design, UI patterns, and styling approach so they can be applied to the simplified version of the application.

## Directory Structure

```
src/styling-backup/
├── README.md                 # This file
├── theme.ts                  # Theme configuration
├── style-guide.md            # Comprehensive style guide
├── ui-patterns.md            # Common UI patterns
└── components/               # Component-specific styling
    ├── layout.md             # Main layout styling
    ├── customer-popup.md     # Customer popup styling
    ├── dashboard.md          # Dashboard components styling
    └── tier-progress.md      # Tier progress visualization
```

## Files Overview

### Theme Configuration

- **theme.ts**: Contains the Material-UI theme configuration with color palette, typography settings, and component overrides.

### Style Documentation

- **style-guide.md**: Comprehensive documentation of the design system, including color palette, typography, component styling, layout patterns, and more.
- **ui-patterns.md**: Documentation of common UI patterns used throughout the application, such as navigation, cards, tables, forms, and status indicators.

### Component-Specific Styling

- **components/layout.md**: Documentation of the main application layout, including sidebar, app bar, and content area.
- **components/customer-popup.md**: Documentation of the customer popup component, which displays customer loyalty information.
- **components/dashboard.md**: Documentation of the dashboard components, including metrics, charts, and tables.
- **components/tier-progress.md**: Documentation of the tier progress visualization, a key UI pattern in the application.

## How to Use This Backup

When applying the styling to the simplified version of the application, follow these steps:

1. **Start with the Theme**: Apply the theme configuration from `theme.ts` to establish the color palette, typography, and component styling.

2. **Follow the Style Guide**: Use `style-guide.md` as a reference for the overall design system, ensuring consistency in colors, typography, spacing, and other design elements.

3. **Implement UI Patterns**: Refer to `ui-patterns.md` for common UI patterns and implement them consistently throughout the application.

4. **Apply Component-Specific Styling**: Use the component-specific documentation to style individual components, ensuring they match the original design.

## Key Design Elements to Preserve

1. **Color Palette**: 
   - Primary: Keppel/Teal (`#00B8A2`)
   - Secondary: Sunglow/Yellow (`#FFD23F`)
   - Accent: Pumpkin/Orange (`#FF7C2A`)

2. **Typography**:
   - Font family: Roboto
   - Consistent heading weights and sizes

3. **Component Styling**:
   - Card-based layouts with consistent elevation and border radius
   - Custom-styled progress bars for tier visualization
   - Consistent table styling with hover effects
   - Form controls with consistent styling

4. **UI Patterns**:
   - Sidebar navigation with selected item highlighting
   - Tier progress visualization with special highlighting when close to next tier
   - Card-based dashboard with metrics and charts
   - Consistent spacing and layout

## Implementation Notes

- The TypeScript error in `theme.ts` is expected since this is a backup file for reference, not for actual compilation.
- The component styling documentation includes code snippets that can be used as a reference, but may need to be adapted to the simplified version's structure.
- Focus on preserving the visual design and user experience, even if the underlying implementation differs.
- Maintain consistency in spacing, colors, and typography throughout the application.

## Next Steps

After applying the styling to the simplified version, compare the result with the original design to ensure consistency. Pay special attention to:

1. Color usage and contrast
2. Typography hierarchy
3. Spacing and layout
4. Interactive elements (hover, focus, active states)
5. Responsive behavior

Make adjustments as needed to ensure the simplified version maintains the same visual quality and user experience as the original.
