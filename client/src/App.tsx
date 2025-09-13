import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import Requirements from "./pages/requirements";
import TestCases from "./pages/test-cases";
import TestSuites from "./pages/test-suites";
import TestRuns from "./pages/test-runs";
import Reports from "./pages/reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/requirements" component={Requirements} />
      <Route path="/test-cases" component={TestCases} />
      <Route path="/test-suites" component={TestSuites} />
      <Route path="/test-runs" component={TestRuns} />
      <Route path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
