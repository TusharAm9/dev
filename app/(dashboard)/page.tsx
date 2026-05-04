import { getCurrentUser } from "@/actions/auth";
import { getProjects, createProject } from "@/actions/projects";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await getProjects();

  let activeProjectId: string;

  if (projects.length > 0) {
    activeProjectId = projects[0].id;
  } else {
    // Auto-create a default project for the user if none exist
    const newProject = await createProject({
      title: "My First Project",
      description: "Default project created on first login.",
    });
    activeProjectId = newProject.id;
  }

  // Redirect to the first project
  redirect(`/project/${activeProjectId}`);
}
