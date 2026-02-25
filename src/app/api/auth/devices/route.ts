import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/utils/api";
import { getUserDevices, removeUserDevice } from "@/lib/auth/security";

const deleteSchema = z.object({
  deviceId: z.string().min(8)
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  const devices = await getUserDevices(session.user.id);
  return apiOk(devices);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);
  try {
    const payload = deleteSchema.parse(await request.json());
    await removeUserDevice(session.user.id, payload.deviceId);
    return apiOk({ deleted: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "参数错误", 400);
    return apiError(error instanceof Error ? error.message : "删除失败", 500);
  }
}
