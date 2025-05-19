# TKO Toy Co Loyalty Program Style Guide

This style guide documents the design system used in the TKO Toy Co Loyalty Program desktop application. It serves as a reference for maintaining consistent styling when applying these design elements to the simplified version.

## Brand Identity

The TKO Toy Co Loyalty Program uses a premium, boxing-themed design language that reflects the company's branding and the loyalty tier system named after boxing weight classes (Featherweight, Lightweight, Welterweight, Heavyweight, and Reigning Champion).

## Color Palette

### Primary Colors

- **Keppel/Teal** (`#00B8A2`) - Primary brand color used for headers, primary buttons, and key UI elements
- **Light Teal** (`#4CEBC8`) - Used for hover states and secondary elements
- **Dark Teal** (`#00877D`) - Used for active states and text on light backgrounds

### Secondary Colors

- **Sunglow/Yellow** (`#FFD23F`) - Used for highlights, notifications, and secondary actions
- **Light Yellow** (`#FFDF6F`) - Used for hover states on secondary elements
- **Dark Yellow** (`#DBA900`) - Used for active states on secondary elements

### Accent Colors

- **Pumpkin/Orange** (`#FF7C2A`) - Used for errors, warnings, and tertiary actions
- **Light Orange** (`#FFA066`) - Used for hover states on tertiary elements
- **Dark Orange** (`#D65E00`) - Used for active states on tertiary elements

### Neutral Colors

- **Light Gray** (`#F5F5F5`) - Main background color
- **White** (`#FFFFFF`) - Card and dialog background color
- **Dark Gray** (`#333333`) - Primary text color
- **Medium Gray** (`#757575`) - Secondary text color

## Typography

The application uses the Roboto font family with specific weight assignments for different heading levels:

- **H1**: Roboto, 700 weight (Bold)
- **H2-H4**: Roboto, 600 weight (Semi-Bold)
- **H5-H6**: Roboto, 500 weight (Medium)
- **Body**: Roboto, 400 weight (Regular)

## Component Styling

### Buttons

- **Primary Buttons**: Teal background (`#00B8A2`), white text, no text transform, 600 font weight
- **Secondary Buttons**: Outlined with teal border, teal text, no text transform, 600 font weight
- **Tertiary/Text Buttons**: No background, teal text, no text transform, 600 font weight

### Cards

- White background
- 8px border radius
- Subtle shadow: `0px 4px 12px rgba(0, 0, 0, 0.05)`
- Consistent padding (16px)

### Progress Bars

- **Standard Progress**: Teal color (`#00B8A2`), light gray background (`#E0E0E0`), 10px height, rounded ends
- **Near Completion Progress**: Yellow color (`#FFD23F`) when close to next tier

### Navigation

- Left sidebar with 240px width
- Selected item highlighted with light teal background and teal left border
- Icon and text alignment with consistent spacing

### Data Visualization

- Card-based layout for statistics
- Clear typography hierarchy with large numbers for key metrics
- Color-coded indicators for positive/negative changes

## Layout Patterns

### Main Window Layout

- Fixed sidebar (240px width) on desktop
- Collapsible sidebar on mobile
- Top app bar with title and action buttons
- Content area with consistent padding (24px)

### Customer Popup Layout

- Card-based design with sections separated by dividers
- Clear visual hierarchy with headings and subheadings
- Compact layout with dense information display
- Action buttons at the bottom

## UI Patterns

### Tier Progress Visualization

- Linear progress bar showing percentage to next tier
- Special highlighting when close to next tier (95%+)
- Clear labeling of current and next tier
- Amount needed to reach next tier

### Benefit Display

- List-based presentation of benefits
- Clear differentiation between current and next tier benefits
- Consistent iconography for benefit types

### Dashboard Statistics

- Card-based layout with consistent sizing
- Large typography for key numbers
- Secondary text for labels and context
- Color-coded indicators for trends

## Spacing System

The application uses a consistent spacing system based on multiples of 8px:

- **Extra Small**: 4px
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **Extra Large**: 32px
- **2x Extra Large**: 48px

## Responsive Behavior

- Desktop-first design with responsive adaptations for smaller screens
- Sidebar collapses to hamburger menu on mobile
- Grid layouts adjust columns based on screen size
- Typography scales appropriately for different screen sizes

## Animation and Transitions

- Subtle hover effects on interactive elements
- Smooth transitions for state changes (300ms duration)
- Loading indicators for asynchronous operations
- Fade animations for appearing/disappearing elements

## Accessibility Considerations

- Sufficient color contrast for text readability
- Focus indicators for keyboard navigation
- Semantic HTML structure
- Screen reader-friendly component implementation
