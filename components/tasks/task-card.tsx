"use client";

import * as React from "react";

import { Clock, User as UserIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate?: string;
  assignee: {
    id: string;
    name: string;
    image?: string;
  };
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface TaskCardProps {
  task: Task;
  className?: string;
  onClick?: () => void;
}
export function TaskCard({ task, className, onClick }: TaskCardProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  const formattedDate = React.useMemo(() => {
    if (!task.dueDate) return "No date";
    const date = new Date(task.dueDate);
    return mounted ? date.toLocaleDateString() : date.toISOString().split('T')[0];
  }, [task.dueDate, mounted]);

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group cursor-pointer hover:border-accent-primary transition-colors rounded-task shadow-sm", 
        className
      )}
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[10px] px-2 py-0 h-5",
            task.priority === "HIGH" ? "bg-red-100 text-red-700" : 
            task.priority === "MEDIUM" ? "bg-orange-100 text-orange-700" : 
            "bg-blue-100 text-blue-700"
          )}
        >
          {task.priority}
        </Badge>
        {isOverdue && (
          <Clock size={14} className="text-red-500 animate-pulse" />
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div>
          <CardTitle className="text-sm font-semibold text-text-primary group-hover:text-bg-surface transition-colors">
            {task.title}
          </CardTitle>
          <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-default/50">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Clock size={12} />
            <span className={cn("text-[10px]", isOverdue ? "text-red-500 font-medium" : "")}>
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted font-medium">{task.assignee.name}</span>
            <Avatar className="h-6 w-6 border border-border-default">
              <AvatarImage src={task.assignee.image} />
              <AvatarFallback className="text-[8px] bg-bg-surface text-white">
                {task.assignee.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
