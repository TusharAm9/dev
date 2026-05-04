"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Calendar } from "lucide-react";
import { updateTask, deleteTask } from "@/actions/tasks";
import { Task } from "./task-card";

const updateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.string().min(1, "Assignee is required"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

interface TaskDetailModalProps {
  task: Task;
  users: { id: string; name: string | null; email: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, users, open, onOpenChange }: TaskDetailModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigneeId: task.assignee.id,
      status: task.status,
    },
  });

  // Sync form with task prop if it changes
  React.useEffect(() => {
    reset({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assigneeId: task.assignee.id,
      status: task.status,
    });
  }, [task, reset]);

  const onSubmit: SubmitHandler<z.infer<typeof updateSchema>> = async (data) => {
    setLoading(true);
    try {
      await updateTask(data);
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedPriority = watch("priority");
  const selectedStatus = watch("status");
  const selectedAssignee = watch("assigneeId");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-kanban bg-white border-border-default shadow-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <Input
                {...register("title")}
                className="text-2xl font-bold border-none px-0 focus-visible:ring-0 placeholder:text-text-muted text-text-primary bg-transparent"
                placeholder="Task title"
              />
              {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-text-muted font-bold">Status</Label>
                <Select value={selectedStatus} onValueChange={(v: any) => setValue("status", v, { shouldDirty: true })}>
                  <SelectTrigger className="rounded-task border-border-default bg-bg-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-task border-border-default shadow-md">
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-text-muted font-bold">Priority</Label>
                <Select value={selectedPriority} onValueChange={(v: any) => setValue("priority", v, { shouldDirty: true })}>
                  <SelectTrigger className="rounded-task border-border-default bg-bg-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-task border-border-default shadow-md">
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-text-muted font-bold">Assignee</Label>
              <Select value={selectedAssignee} onValueChange={(v) => setValue("assigneeId", v, { shouldDirty: true })}>
                <SelectTrigger className="rounded-task border-border-default bg-bg-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-task border-border-default shadow-md">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-text-muted font-bold">Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Add a more detailed description..."
                className="rounded-task border-border-default focus:ring-accent-primary focus:border-accent-primary min-h-[120px] resize-none bg-bg-base"
              />
            </div>

            {task.dueDate && (
              <div className="flex items-center gap-2 text-sm text-text-muted bg-bg-base p-3 rounded-task">
                <Calendar size={16} />
                <span>Due on {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-bg-base border-t border-border-default flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </Button>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-full text-text-muted hover:text-text-primary"
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={loading || !isDirty}
                className="rounded-full bg-accent-primary text-white px-8 hover:bg-accent-primary/90 shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
