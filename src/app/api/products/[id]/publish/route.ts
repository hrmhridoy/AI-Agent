import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { publishExternalProduct, updateExternalProduct } from "@/lib/services/woocommerce";
import { ProductStatus } from "@prisma/client";
import type { ProductImage } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

  const product = await prisma.product.findFirst({ where: { id, userId: user.id } });
  if (!product) return jsonResponse({ error: "Not found" }, 404);

  if (scheduledAt && scheduledAt > new Date()) {
    const updated = await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.SCHEDULED, scheduledAt },
    });
    return jsonResponse({ product: updated, message: "Scheduled for publishing" });
  }

  const images = (product.images as ProductImage[]) || [];
  const payload = {
    type: "external" as const,
    name: product.title || "Product",
    regular_price: product.price?.replace(/[^0-9.]/g, "") || "0",
    description: product.fullDescription || "",
    short_description: product.shortDescription || "",
    external_url: product.affiliateUrl || product.sourceUrl,
    button_text: "Buy Now",
    categories: product.category ? [{ name: product.category.split(" > ").pop()! }] : [],
    images: images.map((img) => ({ src: img.url, alt: img.alt_text })),
    tags: product.tags.map((tag) => ({ name: tag })),
  };

  try {
    let woocommerceId = product.woocommerceId;

    if (woocommerceId) {
      await updateExternalProduct(woocommerceId, payload, user.id);
    } else {
      const result = await publishExternalProduct(payload, user.id);
      woocommerceId = result.id;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.PUBLISHED, woocommerceId, scheduledAt: null },
    });

    return jsonResponse({ product: updated, message: "Published to WooCommerce" });
  } catch (error) {
    await prisma.product.update({
      where: { id },
      data: { status: ProductStatus.FAILED, retryCount: { increment: 1 } },
    });
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Publish failed" },
      500
    );
  }
}
