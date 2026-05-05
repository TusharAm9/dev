import { getCurrentUser } from "@/actions/auth";
import { getProjectMembers, addProjectMember, removeProjectMember } from "@/actions/projects";
import { notFound } from "next/navigation";
import { UserPlus, UserMinus, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabaseAdmin } from "@/lib/supabase";

interface TeamPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

interface ProjectMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="p-4 text-center mt-10">
        User profile not found. Please complete registration.
      </div>
    );
  }

  const { data: project, error } = await supabaseAdmin
    .from('Project')
    .select('title')
    .eq('id', projectId)
    .single();

  if (error || !project) notFound();

  const members = await getProjectMembers(projectId);
  const isAdmin = user.role === "ADMIN";

  async function handleAddMember(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    try {
      await addProjectMember(projectId, email);
    } catch (err: any) {
      // In a real production app we would use useActionState to show this error
      console.error(err.message);
    }
  }

  async function handleRemoveMember(userId: string) {
    "use server";
    try {
      await removeProjectMember(projectId, userId);
    } catch (err: any) {
      console.error(err.message);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Team Members</h1>
        <p className="text-text-muted mt-2">
          Manage who has access to <span className="font-semibold text-accent-primary">{project.title}</span>.
        </p>
      </div>

      {isAdmin && (
        <div className="bg-white rounded-kanban border border-border-default p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
            <UserPlus size={20} className="text-accent-primary" />
            Add New Member
          </h2>
          <form action={handleAddMember} className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <Input
                name="email"
                type="email"
                placeholder="colleague@example.com"
                required
                className="pl-10 rounded-task border-border-default focus:ring-accent-primary"
              />
            </div>
            <Button type="submit" className="bg-accent-primary text-white rounded-full px-6 hover:bg-accent-primary/90 transition-all active:scale-95 shadow-sm">
              Invite
            </Button>
          </form>
          <p className="text-xs text-text-muted mt-3 italic">
            Note: The user must already have a SwiftTask account to be added to a project.
          </p>
        </div>
      )}

      <div className="bg-white rounded-kanban border border-border-default overflow-hidden shadow-sm">
        <div className="divide-y divide-border-default">
          {members.map((member: ProjectMember) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-bg-base transition-colors">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-border-default shadow-sm">
                  <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-bold">
                    {member.name?.[0] || member.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">{member.name || "Unnamed User"}</p>
                    {member.role === "ADMIN" && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-accent-primary/30 text-accent-primary flex items-center gap-1 bg-accent-primary/5">
                        <Shield size={10} />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">{member.email}</p>
                </div>
              </div>

              {isAdmin && member.id !== user.id && (
                <form action={handleRemoveMember.bind(null, member.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-text-muted hover:text-red-500 hover:bg-red-50 rounded-full h-9 w-9 p-0 transition-colors"
                    title="Remove from project"
                  >
                    <UserMinus size={18} />
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
