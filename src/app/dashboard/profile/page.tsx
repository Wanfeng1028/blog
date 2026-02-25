import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { UserProfilePanel } from "@/features/user/components/user-profile-panel";
import { getUserProfileExtra } from "@/features/user/server/dashboard";

export default async function DashboardProfilePage() {
  const session = await requireUser();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      role: true,
      createdAt: true,
      name: true,
      image: true
    }
  });
  if (!user) return null;
  const profileExtra = await getUserProfileExtra(session.user.id);

  return (
    <UserProfilePanel
      profile={{
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        name: user.name,
        image: user.image,
        bio: profileExtra.bio,
        githubUrl: profileExtra.githubUrl,
        websiteUrl: profileExtra.websiteUrl
      }}
    />
  );
}
