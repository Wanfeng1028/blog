import { z } from "zod";
import { apiError, apiOk } from "@/lib/utils/api";
import { increaseProjectViews } from "@/features/projects/server";

const schema = z.object({
  slug: z.string().min(1)
});

type Params = {
  params: Promise<{ slug: string }>;
};

export async function POST(_: Request, { params }: Params) {
  try {
    const { slug } = schema.parse(await params);
    const viewsCount = await increaseProjectViews(slug);
    return apiOk({ viewsCount });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError("Invalid slug", 400);
    const message = error instanceof Error ? error.message : "Failed to increase view";
    const status = message === "NOT_FOUND" ? 404 : 500;
    return apiError(message, status);
  }
}

