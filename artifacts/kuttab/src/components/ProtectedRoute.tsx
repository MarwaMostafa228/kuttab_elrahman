import React, { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

export function ProtectedRoute({ children, allowedRole }: { children: ReactNode, allowedRole: "sheikh" | "student" }) {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-background"><Spinner className="w-8 h-8 text-primary" /></div>;
  }

  if (!isAuthenticated || role !== allowedRole) {
    return <Redirect to="/auth" />;
  }

  return <>{children}</>;
}
