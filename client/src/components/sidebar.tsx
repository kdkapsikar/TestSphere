import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col hidden lg:flex">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary" data-testid="app-title">TestFlow</h1>
        <p className="text-sm text-muted-foreground">Test Management Platform</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href} className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-accent hover:text-accent-foreground"
            )} data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}>
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">QA Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
