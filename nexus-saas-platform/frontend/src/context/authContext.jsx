import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [token, setToken] = useState(authService.getToken());
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nexus_ems_theme") || "dark"
  );

  // Sync theme with html document element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("nexus_ems_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Restore & verify current user on initial mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = authService.getToken();
      if (storedToken) {
        try {
          const res = await authService.getMe();
          if (isMounted && res.data) {
            setUser(res.data);
            setToken(storedToken);
          }
        } catch (err) {
          console.error("Token verification failed:", err);
          authService.logout();
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        }
      }
      if (isMounted) setLoading(false);
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);
      setUser(res.data);
      setToken(res.token);
      return res;
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Authentication failed. Please check your credentials.",
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      setUser(res.data);
      setToken(res.token);
      return res;
    } catch (error) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Registration failed.",
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const role = user?.role || "Employee";
  const isAdmin = role === "Admin";
  const isHR = role === "HR Manager" || role === "Admin";
  const isEmployee = role === "Employee";

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    role,
    isAdmin,
    isHR,
    isEmployee,
    theme,
    toggleTheme,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export default AuthProvider;
