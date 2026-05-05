import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getProjects } from "@/actions/projects";
import { getUsers, getCurrentUser, syncUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = await getCurrentUser();

  // If Supabase session exists but Prisma record is missing, try to sync
  if (!user) {
    try {
      await syncUser();
      user = await getCurrentUser();
    } catch (e) {
      // If sync fails, it means there's no Supabase session at all
      redirect("/login");
    }
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="p-4 bg-red-50 text-red-800 rounded-md shadow-md max-w-md">
          <h2 className="font-bold mb-2">User profile not found</h2>
          <p className="text-sm">We couldn't find your user record in the database. Please ensure your database connection is active and that your user profile has been created.</p>
        </div>
      </div>
    );
  }

  // Now that we've ensured the user exists in Prisma, fetch the rest
  const [projects, users] = await Promise.all([
    getProjects(),
    getUsers(),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar projects={projects} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header projects={projects} users={users} user={user} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
