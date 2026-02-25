import { db } from "@/lib/db";
import { UploadAssetForm } from "@/features/admin/components/upload-asset-form";

export default async function AdminAssetsPage() {
  const assets = await db.imageAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 30
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">资源管理</h1>
      <UploadAssetForm />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <div className="space-y-2 rounded-lg border border-border bg-surface p-3" key={asset.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={asset.id} className="aspect-[16/9] w-full rounded-md object-cover" src={asset.url} />
            <p className="truncate text-xs text-muted">{asset.url}</p>
            <p className="text-xs text-muted">{asset.provider}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
