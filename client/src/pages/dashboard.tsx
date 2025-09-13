import { useState } from "react";
import { Plus, Download, ClipboardList, TestTube2, FileText } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import DashboardStats from "@/components/dashboard-stats";
import RecentActivity from "@/components/recent-activity";
import TestSuitesOverview from "@/components/test-suites-overview";
import TestCasesTable from "@/components/test-cases-table";
import TestCaseModal from "@/components/test-case-modal";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <MobileHeader />

        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground">Overview of your test management activities</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/requirements")} 
                data-testid="button-new-requirement"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                New Requirement
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/test-scenarios")} 
                data-testid="button-new-scenario"
              >
                <TestTube2 className="w-4 h-4 mr-2" />
                New Scenario
              </Button>
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-new-test-case">
                <FileText className="w-4 h-4 mr-2" />
                New Test Case
              </Button>
              <Button variant="secondary" data-testid="button-export-report">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <DashboardStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RecentActivity />
            <TestSuitesOverview />
          </div>

          <TestCasesTable />
        </div>
      </main>

      <TestCaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
