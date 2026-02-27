import "server-only";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const DASHBOARD_OVERVIEW_TAG = "dashboard-user-overview";
export const DASHBOARD_RECENT_TAG = "dashboard-user-recent";
export const DASHBOARD_FAVORITES_TAG = "dashboard-user-favorites";
export const DASHBOARD_LIKES_TAG = "dashboard-user-likes";

type RecentInteraction = {
  id: string;
  type: "comment" | "favorite" | "like" | "view";
  at: string;
  title: string;
  slug: string;
  description: string;
};

const DASHBOARD_CACHE_REVALIDATE = 20;

function isMissingRelationError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.message.includes("42P01") || error.message.includes("does not exist");
}

async function safeQueryRaw<T>(query: Prisma.Sql, fallback: T): Promise<T> {
  try {
    return await db.$queryRaw<T>(query);
  } catch (error) {
    if (isMissingRelationError(error)) return fallback;
    throw error;
  }
}

async function getRecentInteractionsUncached(userId: string, limit = 12): Promise<RecentInteraction[]> {
  const [comments, favorites, likes, views] = await Promise.all([
    db.comment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        content: true,
        post: { select: { title: true, slug: true } }
      }
    }),
    safeQueryRaw<Array<{ id: string; createdAt: Date; title: string; slug: string }>>(
      Prisma.sql`
        SELECT f.id, f."createdAt" AS "createdAt", p.title, p.slug
        FROM "PostFavorite" f
        JOIN "Post" p ON p.id = f."postId"
        WHERE f."userId" = ${userId}
        ORDER BY f."createdAt" DESC
        LIMIT ${limit}
      `,
      []
    ),
    safeQueryRaw<Array<{ id: string; createdAt: Date; title: string; slug: string }>>(
      Prisma.sql`
        SELECT l.id, l."createdAt" AS "createdAt", p.title, p.slug
        FROM "PostLike" l
        JOIN "Post" p ON p.id = l."postId"
        WHERE l."userId" = ${userId}
        ORDER BY l."createdAt" DESC
        LIMIT ${limit}
      `,
      []
    ),
    safeQueryRaw<Array<{ id: string; viewedAt: Date; title: string; slug: string }>>(
      Prisma.sql`
        SELECT v.id, v."viewedAt" AS "viewedAt", p.title, p.slug
        FROM "PostView" v
        JOIN "Post" p ON p.id = v."postId"
        WHERE v."userId" = ${userId}
        ORDER BY v."viewedAt" DESC
        LIMIT ${limit}
      `,
      []
    )
  ]);

  return [
    ...comments.map((item) => ({
      id: `comment:${item.id}`,
      type: "comment" as const,
      at: item.createdAt.toISOString(),
      title: item.post?.title ?? "Moment",
      slug: item.post?.slug ?? "",
      description: item.content
    })),
    ...favorites.map((item) => ({
      id: `favorite:${item.id}`,
      type: "favorite" as const,
      at: item.createdAt.toISOString(),
      title: item.title,
      slug: item.slug,
      description: "Favorited an article"
    })),
    ...likes.map((item) => ({
      id: `like:${item.id}`,
      type: "like" as const,
      at: item.createdAt.toISOString(),
      title: item.title,
      slug: item.slug,
      description: "Liked an article"
    })),
    ...views.map((item) => ({
      id: `view:${item.id}`,
      type: "view" as const,
      at: item.viewedAt.toISOString(),
      title: item.title,
      slug: item.slug,
      description: "Viewed an article"
    }))
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, limit);
}

const getRecentInteractionsCached = unstable_cache(getRecentInteractionsUncached, ["dashboard-user-recent"], {
  revalidate: DASHBOARD_CACHE_REVALIDATE,
  tags: [DASHBOARD_RECENT_TAG]
});

export async function getRecentInteractions(userId: string, limit = 12): Promise<RecentInteraction[]> {
  return getRecentInteractionsCached(userId, limit);
}

async function getUserOverviewUncached(userId: string) {
  const [user, commentCount, favoriteRows, likeRows, recent] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    }),
    db.comment.count({ where: { userId } }),
    safeQueryRaw<Array<{ total: bigint }>>(
      Prisma.sql`SELECT COUNT(*)::bigint AS total FROM "PostFavorite" WHERE "userId" = ${userId}`,
      [{ total: 0n }]
    ),
    safeQueryRaw<Array<{ total: bigint }>>(
      Prisma.sql`SELECT COUNT(*)::bigint AS total FROM "PostLike" WHERE "userId" = ${userId}`,
      [{ total: 0n }]
    ),
    getRecentInteractions(userId, 8)
  ]);

  const createdAt = user?.createdAt ?? new Date();
  const joinedDays = Math.max(1, Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    joinedDays,
    commentCount,
    favoriteCount: Number(favoriteRows[0]?.total ?? 0n),
    likeCount: Number(likeRows[0]?.total ?? 0n),
    recent
  };
}

const getUserOverviewCached = unstable_cache(getUserOverviewUncached, ["dashboard-user-overview"], {
  revalidate: DASHBOARD_CACHE_REVALIDATE,
  tags: [DASHBOARD_OVERVIEW_TAG, DASHBOARD_RECENT_TAG]
});

export async function getUserOverview(userId: string) {
  return getUserOverviewCached(userId);
}

async function getUserFavoritesUncached(userId: string) {
  const rows = await safeQueryRaw<
    Array<{
      id: string;
      createdAt: Date;
      postId: string;
      postTitle: string;
      postSlug: string;
      postSummary: string;
    }>
  >(
    Prisma.sql`
      SELECT
        f.id,
        f."createdAt" AS "createdAt",
        p.id AS "postId",
        p.title AS "postTitle",
        p.slug AS "postSlug",
        p.summary AS "postSummary"
      FROM "PostFavorite" f
      JOIN "Post" p ON p.id = f."postId"
      WHERE f."userId" = ${userId}
      ORDER BY f."createdAt" DESC
    `,
    []
  );

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    post: {
      id: r.postId,
      title: r.postTitle,
      slug: r.postSlug,
      summary: r.postSummary
    }
  }));
}

const getUserFavoritesCached = unstable_cache(getUserFavoritesUncached, ["dashboard-user-favorites"], {
  revalidate: DASHBOARD_CACHE_REVALIDATE,
  tags: [DASHBOARD_FAVORITES_TAG]
});

export async function getUserFavorites(userId: string) {
  return getUserFavoritesCached(userId);
}

async function getUserLikesUncached(userId: string) {
  const rows = await safeQueryRaw<
    Array<{
      id: string;
      createdAt: Date;
      postId: string;
      postTitle: string;
      postSlug: string;
      postSummary: string;
    }>
  >(
    Prisma.sql`
      SELECT
        l.id,
        l."createdAt" AS "createdAt",
        p.id AS "postId",
        p.title AS "postTitle",
        p.slug AS "postSlug",
        p.summary AS "postSummary"
      FROM "PostLike" l
      JOIN "Post" p ON p.id = l."postId"
      WHERE l."userId" = ${userId}
      ORDER BY l."createdAt" DESC
    `,
    []
  );

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    post: {
      id: r.postId,
      title: r.postTitle,
      slug: r.postSlug,
      summary: r.postSummary
    }
  }));
}

const getUserLikesCached = unstable_cache(getUserLikesUncached, ["dashboard-user-likes"], {
  revalidate: DASHBOARD_CACHE_REVALIDATE,
  tags: [DASHBOARD_LIKES_TAG]
});

export async function getUserLikes(userId: string) {
  return getUserLikesCached(userId);
}

async function getUserCommentsUncached(userId: string) {
  return db.comment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      status: true,
      post: {
        select: {
          title: true,
          slug: true
        }
      }
    }
  });
}

const getUserCommentsCached = unstable_cache(getUserCommentsUncached, ["dashboard-user-comments"], {
  revalidate: DASHBOARD_CACHE_REVALIDATE
});

export async function getUserComments(userId: string) {
  return getUserCommentsCached(userId);
}

async function getUserAuthEventsUncached(userId: string, limit = 20) {
  return db.$queryRaw<
    Array<{
      id: string;
      event_type: string;
      success: boolean;
      ip: string | null;
      created_at: Date;
    }>
  >(Prisma.sql`
    SELECT id, event_type, success, ip, created_at
    FROM auth_events
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
}

const getUserAuthEventsCached = unstable_cache(getUserAuthEventsUncached, ["dashboard-user-auth-events"], {
  revalidate: DASHBOARD_CACHE_REVALIDATE
});

export async function getUserAuthEvents(userId: string, limit = 20) {
  return getUserAuthEventsCached(userId, limit);
}

async function getUserProfileExtraUncached(userId: string) {
  const rows = await safeQueryRaw<Array<{ bio: string | null; githubUrl: string | null; websiteUrl: string | null }>>(
    Prisma.sql`
      SELECT "bio", "githubUrl", "websiteUrl"
      FROM "UserProfile"
      WHERE "userId" = ${userId}
      LIMIT 1
    `,
    []
  );
  return rows[0] ?? { bio: null, githubUrl: null, websiteUrl: null };
}

const getUserProfileExtraCached = unstable_cache(getUserProfileExtraUncached, ["dashboard-user-profile-extra"], {
  revalidate: DASHBOARD_CACHE_REVALIDATE
});

export async function getUserProfileExtra(userId: string) {
  return getUserProfileExtraCached(userId);
}
