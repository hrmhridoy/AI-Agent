import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateSEOData } from "@/lib/services/seo";
import { productUpdateSchema } from "@/lib/validations";
import type { ProductImage } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

async function checkAuth(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = rateLimit(ip);
  if (!limit.success) {
    return { error: jsonResponse({ error: "Too many requests" }, 429), limit: null, user: null };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { error: jsonResponse({ error: "Unauthorized" }, 401), limit, user: null };
  }
  return { error: null, limit, user };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const product = await prisma.product.findFirst({
    where: { id, userId: auth.user!.id },
    include: { blogPosts: true },
  });
  if (!product) return jsonResponse({ error: "Not found" }, 404);
  return jsonResponse({ product });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = await request.json();
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);

  const existing = await prisma.product.findFirst({ where: { id, userId: auth.user!.id } });
  if (!existing) return jsonResponse({ error: "Not found" }, 404);

  const data = {
    ...parsed.data,
    scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
  };

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      seoData: generateSEOData({
        title: data.title ?? existing.title,
        seoTitle: data.seoTitle ?? existing.seoTitle,
        seoDescription: data.seoDescription ?? existing.seoDescription,
        fullDescription: data.fullDescription ?? existing.fullDescription,
        price: data.price ?? existing.price,
        currency: data.currency ?? existing.currency,
        images: (data.images ?? existing.images) as ProductImage[],
        affiliateUrl: data.affiliateUrl ?? existing.affiliateUrl,
        sourceUrl: existing.sourceUrl,
        category: data.category ?? existing.category,
        tags: data.tags ?? existing.tags,
      }),
    },
  });

  return jsonResponse({ product });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await checkAuth(request);
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const product = await prisma.product.findFirst({ where: { id, userId: auth.user!.id } });
  if (!product) return jsonResponse({ error: "Not found" }, 404);

  if (product.woocommerceId) {
    try {
      const { deleteWooCommerceProduct } = await import("@/lib/services/woocommerce");
      await deleteWooCommerceProduct(product.woocommerceId, auth.user!.id);
    } catch {
      // Continue deletion even if WooCommerce fails
    }
  }

  await prisma.product.delete({ where: { id } });
  return jsonResponse({ success: true });
}
