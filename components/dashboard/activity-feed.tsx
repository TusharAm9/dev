import { getProjectActivities } from "@/actions/activity";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  projectId: string;
}

interface ActivityItem {
  id: string;
  type: string;
  content: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export async function ActivityFeed({ projectId }: ActivityFeedProps) {
  const activities = (await getProjectActivities(projectId)) as ActivityItem[];

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border-default rounded-kanban bg-bg-base/30">
        <p className="text-sm text-text-muted">No recent activity</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 text-sm">
            <Avatar className="h-8 w-8 border border-border-default shrink-0">
              <AvatarFallback className="bg-bg-surface text-white text-[10px] font-bold">
                {activity.user?.name?.[0] || activity.user?.email?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-text-primary leading-tight">
                <span className="font-bold">{activity.user?.name || activity.user?.email || "System"}</span>{" "}
                <span className="text-text-muted">{activity.content.toLowerCase()}</span>
              </p>
              <p className="text-[10px] text-text-muted font-medium">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
