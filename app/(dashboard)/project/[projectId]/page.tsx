import { getCurrentUser, getUsers } from "@/actions/auth";
import { getTasks } from "@/actions/tasks";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { Task } from "@/components/tasks/task-card";
import { notFound } from "next/navigation";
import { LayoutDashboard, History } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="p-4 text-center mt-10">
        User profile not found. Please complete registration.
      </div>
    );
  }

  // Verify project exists and user has access
  const { data: membership, error: memError } = await supabaseAdmin
    .from('_ProjectMembers')
    .select('A')
    .eq('A', projectId)
    .eq('B', user.id)
    .single();

  if (memError || !membership) {
    notFound();
  }

  const { data: project, error: projError } = await supabaseAdmin
    .from('Project')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projError || !project) {
    notFound();
  }

  const [dbTasks, users] = await Promise.all([
    getTasks(projectId),
    getUsers(),
  ]);

  // Map tasks to the Task shape used by TaskCard
  const tasks: Task[] = (dbTasks as any[]).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    status: t.status as Task["status"],
    priority: t.priority as Task["priority"],
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : undefined,
    assignee: {
      id: t.assignee.id,
      name: t.assignee.name ?? t.assignee.email,
    },
  }));

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <Tabs defaultValue="board" className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <TabsList className="bg-bg-base border border-border-default rounded-full p-1 h-10">
            <TabsTrigger 
              value="board" 
              className="rounded-full px-6 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
            >
              <LayoutDashboard size={14} />
              Board
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-full px-6 flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium transition-all"
            >
              <History size={14} />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="board" className="flex-1 mt-0 outline-none overflow-hidden">
          {tasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4 bg-white/50 backdrop-blur-sm rounded-kanban border border-border-default/30">
              <div className="h-16 w-16 rounded-full bg-bg-surface/10 flex items-center justify-center">
                <LayoutDashboard size={32} className="text-bg-surface" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">No tasks yet in {project.title}</h3>
                <p className="text-sm text-text-muted mt-1">
                  Click &quot;Add Task&quot; in the header to create your first task.
                </p>
              </div>
            </div>
          ) : (
            <KanbanBoard tasks={tasks} users={users} />
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="flex-1 mt-0 outline-none bg-white/50 backdrop-blur-sm rounded-kanban border border-border-default/30 p-6 overflow-hidden">
          <ActivityFeed projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
