# TKO Toy Co Loyalty Program - Desktop Application

This is the desktop application component of the TKO Toy Co Loyalty Program. It provides a popup interface showing customer loyalty information when a customer is looked up in POS Binder or Shopify.

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building the user interface
- **TypeScript**: Type-safe programming language
- **Material-UI**: Component library for consistent UI
- **Electron Store**: Persistent storage for application settings

## Project Structure

```
src/desktop/
├── assets/                  # Application assets (icons, images)
├── public/                  # Public assets and HTML template
├── src/
│   ├── main/                # Electron main process code
│   │   ├── main.ts          # Main entry point for Electron
│   │   └── preload.ts       # Preload script for IPC communication
│   └── renderer/            # React renderer process code
│       ├── components/      # React components
│       ├── models/          # TypeScript interfaces
│       ├── services/        # Service layer for data access
│       ├── App.tsx          # Main React component
│       └── index.tsx        # React entry point
├── package.json             # Project dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Development Setup

1. Install dependencies:

```bash
cd src/desktop
npm install
```

2. Start the development server:

```bash
npm run dev
```

This will start the React development server and launch the Electron application.

## Implementation Phases

### Phase 1: Standalone Application with Mock Data

- Create Electron application structure
- Implement system tray icon and menu
- Build popup window with customer information display
- Implement mock data service for development

### Phase 2: API Integration

- Connect to backend API for real customer data
- Implement authentication and data synchronization
- Add offline support with local caching
- Enhance features with real-time data

### Phase 3: POS/Shopify Integration

- Integrate with POS Binder for customer lookup
- Connect to Shopify for online customer data
- Implement automated workflows
- Add transaction tracking and discount application

## Features

- **Customer Lookup**: Search for customers by phone number
- **Loyalty Information Display**: Show customer tier, total spend, and benefits
- **Tier Progress Visualization**: Display progress toward next tier
- **Benefit Management**: List current benefits and preview next tier benefits
- **Discount Application**: Apply tier-specific discounts to transactions
- **Close to Next Tier Notifications**: Alert when customers are close to reaching the next tier

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

## Packaging the Application

To package the application for distribution:

```bash
npm run dist
```

This will create installers for Windows and macOS in the `dist` directory.

## Notes

- This application is currently in Phase 1 (Standalone with Mock Data)
- A proper tray icon needs to be created before production use
- Integration with POS Binder and Shopify will be implemented in future phases
