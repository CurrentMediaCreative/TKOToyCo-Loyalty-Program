import React, { createContext, useContext, useState, useEffect } from "react";

// Define the shape of the auth context
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Define the user type
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => false,
  logout: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, this would check for a valid token in localStorage
        // and validate it with the backend
        const token = localStorage.getItem("authToken");

        if (token) {
          // For now, we'll just simulate a successful auth check
          // In a real app, you would validate the token with your backend
          setIsAuthenticated(true);
          setUser({
            id: "1",
            email: "admin@tkotoyco.com",
            name: "Admin User",
            role: "admin",
          });
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        localStorage.removeItem("authToken");
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In a real app, this would make an API call to your backend
      // For now, we'll just simulate a successful login with hardcoded credentials
      if (email === "admin@tkotoyco.com" && password === "password") {
        // Simulate token from backend
        const mockToken = "mock-jwt-token";
        localStorage.setItem("authToken", mockToken);

        setIsAuthenticated(true);
        setUser({
          id: "1",
          email: "admin@tkotoyco.com",
          name: "Admin User",
          role: "admin",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    setUser(null);
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
