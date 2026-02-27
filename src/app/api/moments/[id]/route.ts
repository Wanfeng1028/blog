import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const id = (await params).id;

    if (!id) return apiError("ID is required", 400);

    await db.moment.delete({
      where: { id }
    });

    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to delete moment", 500);
  }
}
