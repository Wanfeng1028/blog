import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { apiError } from "@/lib/utils/api";
import { getProjectLikeState, toggleProjectLike } from "@/features/projects/server";

const schema = z.object({
  slug: z.string().min(1)
});

const VIEWER_COOKIE = "viewer_id";

async function resolveViewerId() {
  const store = await cookies();
  let viewerId = store.get(VIEWER_COOKIE)?.value;
  let shouldSetCookie = false;

  if (!viewerId) {
    viewerId = crypto.randomUUID();
    shouldSetCookie = true;
  }

  return { viewerId, shouldSetCookie };
}

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, { params }: Params) {
  try {
    const { slug } = schema.parse(await params);
    const { viewerId, shouldSetCookie } = await resolveViewerId();
    const result = await getProjectLikeState(slug, viewerId);
    const response = NextResponse.json({ ok: true, data: result });
    if (shouldSetCookie) {
      response.cookies.set(VIEWER_COOKIE, viewerId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      });
    }
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Invalid slug", 400);
    const message = error instanceof Error ? error.message : "Failed to get like state";
    const status = message === "NOT_FOUND" ? 404 : 500;
    return apiError(message, status);
  }
}

export async function POST(_: Request, { params }: Params) {
  try {
    const { slug } = schema.parse(await params);
    const { viewerId, shouldSetCookie } = await resolveViewerId();
    const result = await toggleProjectLike(slug, viewerId);
    const response = NextResponse.json({ ok: true, data: result });
    if (shouldSetCookie) {
      response.cookies.set(VIEWER_COOKIE, viewerId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      });
    }
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Invalid slug", 400);
    const message = error instanceof Error ? error.message : "Failed to toggle like";
    const status = message === "NOT_FOUND" ? 404 : 500;
    return apiError(message, status);
  }
}

