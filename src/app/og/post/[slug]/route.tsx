import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/features/blog/server/queries";

export const runtime = "edge";

type RouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const title = post?.title ?? "Wanfeng Blog";
  const summary = post?.summary ?? "Personal full-stack blog";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
          color: "white",
          padding: 64,
          flexDirection: "column",
          justifyContent: "space-between"
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85 }}>Wanfeng Blog</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
          <div style={{ fontSize: 28, opacity: 0.9 }}>{summary}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
