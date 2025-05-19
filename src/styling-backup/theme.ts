/**
 * TKO Toy Co Loyalty Program Theme Configuration
 * 
 * This file contains the complete Material-UI theme configuration extracted from the
 * original application. It defines the color palette, typography, component overrides,
 * and other styling properties used throughout the application.
 */

import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00B8A2', // Keppel/Teal
      light: '#4CEBC8',
      dark: '#00877D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFD23F', // Sunglow/Yellow
      light: '#FFDF6F',
      dark: '#DBA900',
      contrastText: '#000000',
    },
    error: {
      main: '#FF7C2A', // Pumpkin/Orange
      light: '#FFA066',
      dark: '#D65E00',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

/**
 * Color Palette Documentation
 * 
 * Primary Colors:
 * - Keppel/Teal (#00B8A2) - Used for primary actions, headers, and key UI elements
 * - Light Teal (#4CEBC8) - Used for hover states and secondary elements
 * - Dark Teal (#00877D) - Used for active states and text on light backgrounds
 * 
 * Secondary Colors:
 * - Sunglow/Yellow (#FFD23F) - Used for highlights, notifications, and secondary actions
 * - Light Yellow (#FFDF6F) - Used for hover states on secondary elements
 * - Dark Yellow (#DBA900) - Used for active states on secondary elements
 * 
 * Accent Colors:
 * - Pumpkin/Orange (#FF7C2A) - Used for errors, warnings, and tertiary actions
 * - Light Orange (#FFA066) - Used for hover states on tertiary elements
 * - Dark Orange (#D65E00) - Used for active states on tertiary elements
 * 
 * Background Colors:
 * - Light Gray (#F5F5F5) - Used for the main background
 * - White (#FFFFFF) - Used for cards, dialogs, and other UI elements
 */

export default theme;
