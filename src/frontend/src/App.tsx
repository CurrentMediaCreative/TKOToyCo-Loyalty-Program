import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, ThemeProvider, CssBaseline } from "@mui/material";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Tiers from "./pages/Tiers";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import theme from "./theme";
import FontLoader from "./components/FontLoader";

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FontLoader>
        <Box
          sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
        >
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="tiers" element={<Tiers />} />
              <Route path="reports" element={<Reports />} />
              {/* Add more routes here as the application grows */}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </FontLoader>
    </ThemeProvider>
  );
};

export default App;
