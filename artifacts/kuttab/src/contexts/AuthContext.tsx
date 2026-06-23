import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, AuthResponse } from "@workspace/api-client-react";

interface AuthContextType {
  role: AuthResponse["role"] | null;
  userId: number | null;
  name: string | null;
  studentCode: string | null;
  studentId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading: isQueryLoading, isError, error } = useGetMe({
    query: {
      retry: false,
    }
  });

  const [authState, setAuthState] = useState<Partial<AuthResponse>>({});
  
  useEffect(() => {
    if (user && !isError) {
      setAuthState(user);
    } else if (isError) {
      setAuthState({});
    }
  }, [user, isError]);

  const login = (data: AuthResponse) => {
    setAuthState(data);
  };

  const logout = () => {
    setAuthState({});
  };

  const value = {
    role: authState.role ?? null,
    userId: authState.userId ?? null,
    name: authState.name ?? null,
    studentCode: authState.studentCode ?? null,
    studentId: authState.studentId ?? null,
    isAuthenticated: !!authState.role,
    isLoading: isQueryLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
