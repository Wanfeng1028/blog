import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";

/** Extracts "owner/repo" from either a full GitHub URL or a bare "owner/repo" string. */
function parseGithubRepo(input: string): string | null {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("github.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  } catch {
    // Not a URL — try bare "owner/repo" format
    const parts = trimmed.split("/").filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return null;
  }
}

/**
 * GET /api/admin/projects/readme?repo=owner%2Frepo
 * OR  GET /api/admin/projects/readme?repo=https%3A%2F%2Fgithub.com%2Fowner%2Frepo
 *
 * Returns the raw README.md content from a GitHub repository.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return apiError("UNAUTHORIZED", 401);
  }

  const repo = new URL(request.url).searchParams.get("repo") ?? "";
  const slug = parseGithubRepo(repo);
  if (!slug) {
    return apiError("Invalid repo parameter — expected 'owner/repo' or a full GitHub URL", 400);
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "wanfeng-blog-web",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${slug}/readme`, {
      headers,
      cache: "no-store"
    });
  } catch (err) {
    return apiError(`Network error fetching README: ${(err as Error).message}`, 502);
  }

  if (response.status === 404) {
    return apiError("README not found in this repository", 404);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return apiError(`GitHub API error ${response.status}: ${text.slice(0, 200)}`, response.status);
  }

  const content = await response.text();
  return apiOk({ content });
}
