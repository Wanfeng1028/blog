import { db } from "@/lib/db";
import { PostEditorForm } from "@/features/admin/components/post-editor-form";

export default async function NewPostPage() {
  const categories = await db.articleCategory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">新建文章</h1>
      <PostEditorForm categories={categories} />
    </div>
  );
}
