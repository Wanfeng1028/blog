import { requireUser } from "@/lib/auth/guards";
import { UserDashboard } from "@/features/user/components/user-dashboard";
import { getUserOverview } from "@/features/user/server/dashboard";

export default async function DashboardPage() {
  const session = await requireUser();
  const overview = await getUserOverview(session.user.id);

  return (
    <UserDashboard
      overview={{
        joinedDays: overview.joinedDays,
        commentCount: overview.commentCount,
        favoriteCount: overview.favoriteCount,
        likeCount: overview.likeCount
      }}
      recent={overview.recent}
    />
  );
}
