import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import Requirements from "./pages/requirements";
import TestScenarios from "./pages/test-scenarios";
import TestCases from "./pages/test-cases";
import TestSuites from "./pages/test-suites";
import TestRuns from "./pages/test-runs";
import Reports from "./pages/reports";
import Defects from "./pages/defects";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/requirements" component={Requirements} />
      <Route path="/test-scenarios" component={TestScenarios} />
      <Route path="/test-cases" component={TestCases} />
      <Route path="/test-suites" component={TestSuites} />
      <Route path="/test-runs" component={TestRuns} />
      <Route path="/reports" component={Reports} />
      <Route path="/defects" component={Defects} />
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
