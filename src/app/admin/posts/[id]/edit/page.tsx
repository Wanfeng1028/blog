import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PostEditorForm } from "@/features/admin/components/post-editor-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
    db.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        status: true,
        coverImage: true,
        tags: true,
        categoryId: true
      }
    }),
    db.articleCategory.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true }
    })
  ]);

  if (!post) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">编辑文章</h1>
      <PostEditorForm initialPost={post} categories={categories} />
    </div>
  );
}
