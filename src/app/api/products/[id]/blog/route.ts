import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-helpers";
import { createBlogForProduct, publishToWordPress } from "@/lib/services/blog";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const blogPost = await createBlogForProduct(id, user.id);

  if (body.publishToWordPress) {
    await publishToWordPress(blogPost.id, user.id);
  }

  return jsonResponse({ blogPost });
}
