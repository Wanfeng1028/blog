import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { deleteMessage, updateMessageStatus, type MessageStatus } from "@/lib/message-board";
import { deleteFriendLink, updateFriendLinkStatus, type FriendLinkStatus } from "@/lib/friend-links";
import { deleteDonation, updateDonationStatus, type DonationStatus } from "@/lib/donations";

const patchSchema = z.object({
  status: z.enum(["VISIBLE", "HIDDEN", "DELETED"]).optional(),
  friendLinkStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  donationStatus: z.enum(["PENDING", "CONFIRMED", "REJECTED"]).optional(),
  reviewNote: z.string().max(200).optional()
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const params = await context.params;
    const payload = patchSchema.parse(await request.json());
    const mode = request.nextUrl.searchParams.get("mode");

    if (mode === "message") {
      if (!payload.status) return apiError("status is required", 400);
      await updateMessageStatus(params.id, payload.status as MessageStatus);
      return apiOk({ updated: true });
    }

    if (mode === "friend-link") {
      if (!payload.friendLinkStatus) return apiError("friendLinkStatus is required", 400);
      await updateFriendLinkStatus(
        params.id,
        payload.friendLinkStatus as FriendLinkStatus,
        payload.reviewNote ?? null
      );
      return apiOk({ updated: true });
    }

    if (mode === "donation") {
      if (!payload.donationStatus) return apiError("donationStatus is required", 400);
      await updateDonationStatus(params.id, payload.donationStatus as DonationStatus);
      return apiOk({ updated: true });
    }

    if (!payload.status) return apiError("status is required", 400);
    const comment = await db.comment.update({
      where: { id: params.id },
      data: { status: payload.status }
    });
    return apiOk(comment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update comment";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return apiError(message, status);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const params = await context.params;
    const mode = request.nextUrl.searchParams.get("mode");

    if (mode === "message") {
      await deleteMessage(params.id);
      return apiOk({ deleted: true });
    }

    if (mode === "friend-link") {
      await deleteFriendLink(params.id);
      return apiOk({ deleted: true });
    }

    if (mode === "donation") {
      await deleteDonation(params.id);
      return apiOk({ deleted: true });
    }

    await db.comment.delete({
      where: { id: params.id }
    });
    return apiOk({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete comment";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    return apiError(message, status);
  }
}
