import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./lib/theme-provider";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppLayout } from "./layout/app-layout";
import { AuthLayout } from "./layout/auth-layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Projects from "@/pages/projects";
import Plan from "@/pages/plan";
import Reports from "@/pages/reports";
import ReportDetail from "@/pages/report-detail";
import Settings from "@/pages/settings";
import Parts from "@/pages/parts";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/login">
        <AuthLayout>
          <Login />
        </AuthLayout>
      </Route>
      
      {/* App routes */}
      <Route path="/dashboard">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      
      <Route path="/tasks">
        <AppLayout>
          <Tasks />
        </AppLayout>
      </Route>
      
      <Route path="/projects">
        <AppLayout>
          <Projects />
        </AppLayout>
      </Route>
      
      <Route path="/reports">
        <AppLayout>
          <Reports />
        </AppLayout>
      </Route>
      
      <Route path="/reports/:id">
        <AppLayout>
          <ReportDetail />
        </AppLayout>
      </Route>
      
      <Route path="/plan">
        <AppLayout>
          <Plan />
        </AppLayout>
      </Route>

      <Route path="/parts">
        <AppLayout>
          <Parts />
        </AppLayout>
      </Route>

      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>

      <Route path="/notifications">
        <AppLayout>
          <Notifications />
        </AppLayout>
      </Route>
      
      {/* Default redirect to login */}
      <Route path="/">
        <AuthLayout>
          <Login />
        </AuthLayout>
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
