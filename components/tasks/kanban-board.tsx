"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Task, TaskCard } from "./task-card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTaskStatus } from "@/actions/tasks";
import { TaskDetailModal } from "./task-detail-modal";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import * as React from "react";

interface KanbanBoardProps {
  tasks: Task[];
  users: { id: string; name: string | null; email: string }[];
}

const COLUMNS = [
  { id: "TODO" as const, title: "To Do", color: "bg-text-muted" },
  { id: "IN_PROGRESS" as const, title: "In Progress", color: "bg-bg-surface" },
  { id: "DONE" as const, title: "Done", color: "bg-accent-primary" },
];

export function KanbanBoard({ tasks: initialTasks, users }: KanbanBoardProps) {
  const [tasks, setTasks] = React.useState(initialTasks);
  const [movingId, setMovingId] = React.useState<string | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const router = useRouter();

  // Sync if parent re-renders with fresh data
  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Real-time synchronization
  React.useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Task',
        },
        () => {
          // When any task change is detected, refresh the server components
          // to get the latest data including relations (assignees, etc.)
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  async function moveTask(taskId: string, newStatus: Task["status"]) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setMovingId(taskId);
    try {
      await updateTaskStatus({ taskId, status: newStatus });
    } catch {
      // Revert on error
      setTasks(initialTasks);
    } finally {
      setMovingId(null);
    }
  }

  return (
    <ScrollArea className="w-full h-full whitespace-nowrap">
      <div className="flex p-6 gap-6 h-[calc(100vh-128px)]">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          const adjacentStatuses = COLUMNS.filter((c) => c.id !== column.id).map(
            (c) => c.id
          );

          return (
            <div
              key={column.id}
              className="shrink-0 w-80 flex flex-col bg-white/50 backdrop-blur-sm rounded-kanban border border-border-default/30 p-4"
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-text-primary">{column.title}</h3>
                  <Badge
                    variant="secondary"
                    className="bg-bg-base text-text-muted ml-1 h-5 px-1.5 text-[10px]"
                  >
                    {columnTasks.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted">
                    <Plus size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted">
                    <MoreHorizontal size={16} />
                  </Button>
                </div>
              </div>

              {/* Task list */}
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-3 pb-4">
                  {columnTasks.map((task) => (
                    <div key={task.id} className="group/task relative">
                      {movingId === task.id && (
                        <div className="absolute inset-0 bg-white/70 rounded-task flex items-center justify-center z-10">
                          <Loader2 size={16} className="animate-spin text-bg-surface" />
                        </div>
                      )}
                      <TaskCard 
                        task={task} 
                        onClick={() => setSelectedTask(task)}
                      />
                      {/* Move buttons — visible on hover */}
                      <div className="mt-1 flex gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                        {adjacentStatuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => moveTask(task.id, s)}
                            disabled={movingId !== null}
                            className="flex-1 text-[9px] font-medium py-0.5 px-1 rounded bg-bg-base border border-border-default/60 text-text-muted hover:bg-bg-surface hover:text-white transition-colors disabled:opacity-40"
                          >
                            → {s === "TODO" ? "To Do" : s === "IN_PROGRESS" ? "In Progress" : "Done"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="border-2 border-dashed border-border-default/50 rounded-task p-8 flex flex-col items-center justify-center text-center">
                      <p className="text-xs text-text-muted">No tasks here</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </ScrollArea>
  );
}
