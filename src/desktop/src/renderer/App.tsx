import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import CustomerLookup from './components/CustomerLookup';
import CustomerPopup from './components/CustomerPopup';
import MainWindow from './components/MainWindow';

// Import the theme from the frontend
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
 * Main application component that determines which view to render
 * based on the URL query parameter
 */
const App: React.FC = () => {
  const [view, setView] = useState<'main' | 'popup'>('main');

  useEffect(() => {
    // Check URL query parameter to determine which view to render
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'popup') {
      setView('popup');
    } else {
      setView('main');
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', overflow: 'hidden' }}>
        {view === 'main' ? (
          // Render the main admin window
          <MainWindow />
        ) : (
          // Render the customer lookup window for popup view
          <CustomerLookup />
        )}
      </Box>
    </ThemeProvider>
  );
};

export default App;
