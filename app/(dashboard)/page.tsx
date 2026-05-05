import { getCurrentUser } from "@/actions/auth";
import { getProjects, createProject } from "@/actions/projects";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="p-4 text-center mt-10">
        User profile not found. Please complete registration.
      </div>
    );
  }

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
