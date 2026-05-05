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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Loader2 } from "lucide-react";
import { updateProject } from "@/actions/projects";

const formSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
});

interface EditProjectModalProps {
  project: { id: string; title: string; description?: string | null };
  children?: React.ReactNode;
}

export function EditProjectModal({ project, children }: EditProjectModalProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: project.id,
      title: project.title,
      description: project.description ?? undefined,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    setLoading(true);
    try {
      await updateProject(data);
      setOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
            <Settings size={18} />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-kanban bg-white border-border-default shadow-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-text-primary">Project Settings</DialogTitle>
          <DialogDescription>
            Update your project title and description here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-text-primary font-semibold">Project Title</Label>
            <Input
              id="edit-title"
              {...register("title")}
              className="rounded-task border-border-default focus:ring-accent-primary"
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-text-primary font-semibold">Description</Label>
            <Textarea
              id="edit-description"
              {...register("description")}
              className="rounded-task border-border-default focus:ring-accent-primary min-h-[100px] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-full text-text-muted hover:text-text-primary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isDirty}
              className="rounded-full bg-accent-primary text-white px-8 hover:bg-accent-primary/90 shadow-sm transition-all"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
