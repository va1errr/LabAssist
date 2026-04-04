/**
 * Auth context: manages user session state.
 *
 * Stores token and user info in React state + localStorage so it persists
 * across page reloads.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { User } from "../types";
import { authApi } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isTA: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    const newToken = response.data.access_token;

    // Decode token to get user info (sub = user_id, role)
    const payload = JSON.parse(atob(newToken.split(".")[1]));
    const userData: User = {
      id: payload.sub,
      username,
      role: payload.role,
      created_at: new Date().toISOString(),
    };

    setToken(newToken);
    setUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    await authApi.register(username, password);
    // After registration, auto-login
    await login(username, password);
  }, [login]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const isAuthenticated = token !== null && user !== null;
  const isTA = user?.role === "ta" || user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated, isTA }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
