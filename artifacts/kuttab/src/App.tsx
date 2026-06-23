import React, { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";

import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import CirclesPage from "@/pages/CirclesPage";
import StudentPortalPage from "@/pages/StudentPortalPage";
import MemorizationPage from "@/pages/MemorizationPage";
import AttendancePage from "@/pages/AttendancePage";
import VacationsPage from "@/pages/VacationsPage";
import GuardiansPage from "@/pages/GuardiansPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import CertificatesPage from "@/pages/CertificatesPage";
import ExamsPage from "@/pages/ExamsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Sheikh Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute allowedRole="sheikh"><DashboardPage /></ProtectedRoute>}
      </Route>
      <Route path="/students">
        {() => <ProtectedRoute allowedRole="sheikh"><StudentsPage /></ProtectedRoute>}
      </Route>
      <Route path="/circles">
        {() => <ProtectedRoute allowedRole="sheikh"><CirclesPage /></ProtectedRoute>}
      </Route>
      <Route path="/memorization">
        {() => <ProtectedRoute allowedRole="sheikh"><MemorizationPage /></ProtectedRoute>}
      </Route>
      <Route path="/attendance">
        {() => <ProtectedRoute allowedRole="sheikh"><AttendancePage /></ProtectedRoute>}
      </Route>
      <Route path="/vacations">
        {() => <ProtectedRoute allowedRole="sheikh"><VacationsPage /></ProtectedRoute>}
      </Route>
      <Route path="/guardians">
        {() => <ProtectedRoute allowedRole="sheikh"><GuardiansPage /></ProtectedRoute>}
      </Route>
      <Route path="/payments">
        {() => <ProtectedRoute allowedRole="sheikh"><PaymentsPage /></ProtectedRoute>}
      </Route>
      <Route path="/expenses">
        {() => <ProtectedRoute allowedRole="sheikh"><ExpensesPage /></ProtectedRoute>}
      </Route>
      <Route path="/certificates">
        {() => <ProtectedRoute allowedRole="sheikh"><CertificatesPage /></ProtectedRoute>}
      </Route>
      <Route path="/exams">
        {() => <ProtectedRoute allowedRole="sheikh"><ExamsPage /></ProtectedRoute>}
      </Route>
      <Route path="/analytics">
        {() => <ProtectedRoute allowedRole="sheikh"><AnalyticsPage /></ProtectedRoute>}
      </Route>

      <Route path="/student-portal">
        {() => <ProtectedRoute allowedRole="student"><StudentPortalPage /></ProtectedRoute>}
      </Route> 

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
