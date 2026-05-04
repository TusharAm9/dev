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
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";
import { createTask } from "@/actions/tasks";
import { useParams } from "next/navigation";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.string().min(1, "Assignee is required"),
  projectId: z.string().min(1, "Project is required"),
});

interface CreateTaskModalProps {
  projects: { id: string; title: string }[];
  users: { id: string; name: string | null; email: string }[];
}

export function CreateTaskModal({ projects, users }: CreateTaskModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const params = useParams();
  const currentProjectId = params?.projectId as string;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: "MEDIUM",
      projectId: currentProjectId || projects[0]?.id,
    },
  });

  // Update projectId if the URL changes while the modal is open (unlikely but good for consistency)
  React.useEffect(() => {
    if (currentProjectId) {
      setValue("projectId", currentProjectId);
    }
  }, [currentProjectId, setValue]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    setLoading(true);
    try {
      await createTask(data);
      setOpen(false);
      reset();
    } catch (err: any) {
      alert(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const selectedProjectId = watch("projectId");
  const selectedPriority = watch("priority");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-full bg-accent-primary text-white font-medium px-4 hover:bg-accent-primary/90 transition-colors flex items-center gap-2">
          <Plus size={18} />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-kanban bg-white border-border-default shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-text-primary">Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-text-primary font-semibold">Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="E.g., Design system audit"
              className="rounded-task border-border-default focus:ring-accent-primary focus:border-accent-primary"
            />
            {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-text-primary font-semibold">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Add details about this task..."
              className="rounded-task border-border-default focus:ring-accent-primary focus:border-accent-primary min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-text-primary font-semibold">Priority</Label>
              <Select
                value={selectedPriority}
                onValueChange={(v: any) => setValue("priority", v)}
              >
                <SelectTrigger className="rounded-task border-border-default">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="rounded-task border-border-default shadow-md">
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-text-primary font-semibold">Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(v) => setValue("projectId", v)}
              >
                <SelectTrigger className="rounded-task border-border-default">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="rounded-task border-border-default shadow-md">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-text-primary font-semibold">Assignee</Label>
            <Select onValueChange={(v) => setValue("assigneeId", v)}>
              <SelectTrigger className="rounded-task border-border-default">
                <SelectValue placeholder="Assign to user" />
              </SelectTrigger>
              <SelectContent className="rounded-task border-border-default shadow-md">
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigneeId && <p className="text-xs text-red-500 font-medium">{errors.assigneeId.message}</p>}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-full text-text-muted hover:text-text-primary hover:bg-bg-base transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-accent-primary text-white px-8 hover:bg-accent-primary/90 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
