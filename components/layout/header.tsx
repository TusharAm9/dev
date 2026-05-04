"use client";

import { Search, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/actions/auth";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { useParams } from "next/navigation";

interface HeaderProps {
  projects: any[];
  users: any[];
  user: any;
}

export function Header({ projects, users, user }: HeaderProps) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  const params = useParams();
  const currentProjectId = params?.projectId as string;
  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  return (
    <header className="h-16 border-b border-border-default bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-lg font-semibold text-text-primary">
          {activeProject?.title || "SwiftTask Dashboard"}
        </h2>
        {projects.length > 0 && (
          <Badge variant="outline" className="text-accent-primary border-accent-primary">
            Active
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
          <input
            type="search"
            placeholder="Search tasks..."
            className="h-9 w-64 rounded-md border border-border-default bg-bg-base pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        <Button variant="ghost" size="icon" className="text-text-muted hover:text-text-primary transition-colors">
          <Bell size={20} />
        </Button>

        {user?.role === "ADMIN" && (
          <CreateTaskModal projects={projects} users={users} />
        )}

        <div className="h-8 w-px bg-border-default mx-1" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text-primary leading-none">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">
              {user?.role || "Member"}
            </p>
          </div>
          <Avatar className="h-9 w-9 border border-border-default shadow-sm">
            <AvatarImage src="" />
            <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
              title="Sign out"
            >
              <LogOut size={18} />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
