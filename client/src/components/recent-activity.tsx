import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Plus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: 'test_passed' | 'test_failed' | 'test_created' | 'test_started';
  testCaseName: string;
  suiteName?: string;
  timestamp: string;
  message: string;
}

export default function RecentActivity() {
  const { data: activity, isLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'test_passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'test_failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'test_created':
        return <Plus className="w-4 h-4 text-blue-600" />;
      case 'test_started':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'test_passed':
        return 'bg-green-100';
      case 'test_failed':
        return 'bg-red-100';
      case 'test_created':
        return 'bg-blue-100';
      case 'test_started':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="bg-card rounded-lg border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-sm text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !activity || activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-activity">
            No recent activity found
          </div>
        ) : (
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start space-x-3" data-testid="activity-item">
                <div className={`w-8 h-8 ${getActivityBgColor(item.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground" data-testid="activity-message">
                    {item.message}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="activity-details">
                    {item.suiteName ? `${item.suiteName} • ` : ''}{formatTimeAgo(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
