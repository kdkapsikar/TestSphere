import { Plus, Download, ClipboardList, TestTube2, FileText } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import DashboardStats from "@/components/dashboard-stats";
import RecentActivity from "@/components/recent-activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {

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
            <div className="mt-4 sm:mt-0">
              <Button variant="secondary" data-testid="button-export-report">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <DashboardStats />

          <div className="grid grid-cols-1 gap-6">
            <RecentActivity />
          </div>
        </div>

      </main>

    </div>
  );
}
