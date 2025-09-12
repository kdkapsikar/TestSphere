import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import TestCaseModal from "@/components/test-case-modal";
import TestCasesTable from "@/components/test-cases-table";
import { Button } from "@/components/ui/button";
import type { TestCaseWithSuite } from "@shared/schema";

export default function TestCases() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: testCases } = useQuery<TestCaseWithSuite[]>({
    queryKey: ["/api/test-cases"],
  });

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <MobileHeader />

        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Test Cases</h2>
              <p className="text-muted-foreground">
                Manage and organize your test cases ({testCases?.length || 0} total)
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button onClick={() => setIsModalOpen(true)} data-testid="button-new-test-case">
                <Plus className="w-4 h-4 mr-2" />
                New Test Case
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <TestCasesTable />
        </div>
      </main>

      <TestCaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
