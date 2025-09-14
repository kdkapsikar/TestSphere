import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  TestTube2,
  Archive, 
  Zap, 
  BarChart3,
  ClipboardList
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Requirements", href: "/requirements", icon: ClipboardList },
  { name: "Test Scenarios", href: "/test-scenarios", icon: TestTube2 },
  { name: "Test Cases", href: "/test-cases", icon: FileText },
  { name: "Test Suites", href: "/test-suites", icon: Archive },
  { name: "Test Runs", href: "/test-runs", icon: Zap },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <>
      <header className="lg:hidden bg-card border-b border-border p-4 relative z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary" data-testid="mobile-app-title">TestFlow</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="mobile-menu-toggle"
            className="relative z-10"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border relative z-40">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                    data-testid={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
