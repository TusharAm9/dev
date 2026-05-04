"use client";

import * as React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  FolderKanban,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useParams } from "next/navigation";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  projects?: { id: string; title: string }[];
  className?: string;
}

export function Sidebar({ projects = [], className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const params = useParams();
  const currentProjectId = params?.projectId as string;

  return (
    <div
      className={cn(
        "relative flex flex-col border-r border-border-default bg-bg-surface text-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 py-2 border-b border-white/10">
        {!isCollapsed && (
          <Link href="/" className="text-xl font-bold tracking-tight text-accent-primary">
            SwiftTask
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-text-muted hover:bg-white/10 hover:text-white"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <div className="space-y-4 px-2">
          <div className="space-y-1">
            <SidebarItem
              href="/"
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              isCollapsed={isCollapsed}
              active={!currentProjectId}
            />
            <SidebarItem
              href={currentProjectId ? `/project/${currentProjectId}/team` : "/team"}
              icon={<Users size={20} />}
              label="Team Members"
              isCollapsed={isCollapsed}
              active={false} // active state logic would go here if needed
            />
            <SidebarItem
              href="/overdue"
              icon={<Clock size={20} />}
              label="Overdue Tasks"
              isCollapsed={isCollapsed}
            />
          </div>

          <div className="pt-4">
            {!isCollapsed && (
              <h3 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Active Projects
              </h3>
            )}
            <div className="space-y-1">
              {projects.map((project) => (
                <SidebarItem
                  key={project.id}
                  href={`/project/${project.id}`}
                  icon={<FolderKanban size={20} />}
                  label={project.title}
                  isCollapsed={isCollapsed}
                  active={currentProjectId === project.id}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10">
        <SidebarItem
          href="/settings"
          icon={<Settings size={20} />}
          label="Settings"
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
}

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  active?: boolean;
  badge?: number;
}

function SidebarItem({ href, icon, label, isCollapsed, active, badge }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none",
        active 
          ? "bg-accent-primary text-text-primary" 
          : "text-text-muted hover:bg-white/10 hover:text-white"
      )}
    >
      <span className={cn("shrink-0 flex items-center justify-center", active ? "" : "group-hover:text-white")}>
        {icon}
      </span>
      {!isCollapsed && (
        <>
          <span className="ml-3 flex-1 text-left truncate">{label}</span>
          {badge !== undefined && (
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-auto h-5 px-1.5 text-[10px]",
                active ? "bg-text-primary/20 text-text-primary" : "bg-white/10 text-white"
              )}
            >
              {badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}
