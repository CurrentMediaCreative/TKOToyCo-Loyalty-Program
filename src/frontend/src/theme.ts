import { createTheme } from "@mui/material/styles";

// Define the TKO Toy Co brand colors
const colors = {
  primary: {
    // Keppel (Teal)
    main: "#00B8A2",
    light: "#4FCFBE",
    dark: "#008F7D",
    contrastText: "#ffffff",
  },
  secondary: {
    // Sunglow (Yellow)
    main: "#FFD23F",
    light: "#FFDD6F",
    dark: "#FFBA00",
    contrastText: "#000000",
  },
  tertiary: {
    // Pumpkin (Orange)
    main: "#FF7C2A",
    light: "#FF9E5C",
    dark: "#E65A00",
    contrastText: "#ffffff",
  },
  error: {
    main: "#d32f2f",
    light: "#ef5350",
    dark: "#c62828",
    contrastText: "#ffffff",
  },
  warning: {
    main: "#ed6c02",
    light: "#ff9800",
    dark: "#e65100",
    contrastText: "#ffffff",
  },
  info: {
    main: "#0288d1",
    light: "#03a9f4",
    dark: "#01579b",
    contrastText: "#ffffff",
  },
  success: {
    main: "#2e7d32",
    light: "#4caf50",
    dark: "#1b5e20",
    contrastText: "#ffffff",
  },
  grey: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
  background: {
    default: "#f5f5f5",
    paper: "#ffffff",
  },
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.6)",
    disabled: "rgba(0, 0, 0, 0.38)",
  },
};

// Create the theme
const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    success: colors.success,
    background: colors.background,
    text: colors.text,
  },
  typography: {
    // TKO Custom Font for headings, Poppins for body text
    fontFamily: [
      "Poppins",
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontFamily: "TKO Custom Font, Norwester, sans-serif",
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.01562em",
    },
    h2: {
      fontFamily: "TKO Custom Font, Norwester, sans-serif",
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.00833em",
    },
    h3: {
      fontFamily: "TKO Custom Font, Norwester, sans-serif",
      fontSize: "1.75rem",
      fontWeight: 600,
      letterSpacing: "0em",
    },
    h4: {
      fontFamily: "Norwester, sans-serif",
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "0.00735em",
    },
    h5: {
      fontFamily: "Norwester, sans-serif",
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "0em",
    },
    h6: {
      fontFamily: "Norwester, sans-serif",
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: "0.0075em",
    },
    subtitle1: {
      fontFamily: "Poppins, sans-serif",
      fontSize: "1rem",
      fontWeight: 500,
      letterSpacing: "0.00938em",
    },
    subtitle2: {
      fontFamily: "Poppins, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "0.00714em",
    },
    body1: {
      fontFamily: "Poppins, sans-serif",
      fontSize: "1rem",
      fontWeight: 400,
      letterSpacing: "0.00938em",
    },
    body2: {
      fontFamily: "Poppins, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 400,
      letterSpacing: "0.01071em",
    },
    button: {
      fontFamily: "Poppins, sans-serif",
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "0.02857em",
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
          padding: "8px 16px",
        },
        containedPrimary: {
          backgroundColor: colors.primary.main,
          "&:hover": {
            backgroundColor: colors.primary.dark,
          },
        },
        containedSecondary: {
          backgroundColor: colors.secondary.main,
          color: colors.secondary.contrastText,
          "&:hover": {
            backgroundColor: colors.secondary.dark,
          },
        },
        outlinedPrimary: {
          borderColor: colors.primary.main,
          color: colors.primary.main,
          "&:hover": {
            backgroundColor: "rgba(0, 184, 162, 0.04)",
          },
        },
        outlinedSecondary: {
          borderColor: colors.secondary.main,
          color: colors.secondary.main,
          "&:hover": {
            backgroundColor: "rgba(255, 210, 63, 0.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
          borderRadius: 12,
          overflow: "hidden",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.primary.main,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        colorPrimary: {
          backgroundColor: colors.primary.main,
          color: colors.primary.contrastText,
        },
        colorSecondary: {
          backgroundColor: colors.secondary.main,
          color: colors.secondary.contrastText,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: "rgba(0, 184, 162, 0.08)",
        },
      },
    },
  },
});

export default theme;
