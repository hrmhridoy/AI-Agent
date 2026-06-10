import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishExternalProduct } from "@/lib/services/woocommerce";
import { ProductStatus } from "@prisma/client";
import type { ProductImage } from "@/types";

/** Vercel Cron: publish scheduled products */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const dueProducts = await prisma.product.findMany({
    where: {
      status: ProductStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
  });

  const results = [];

  for (const product of dueProducts) {
    try {
      const images = (product.images as ProductImage[]) || [];
      const result = await publishExternalProduct(
        {
          type: "external",
          name: product.title || "Product",
          regular_price: product.price?.replace(/[^0-9.]/g, "") || "0",
          description: product.fullDescription || "",
          short_description: product.shortDescription || "",
          external_url: product.affiliateUrl || product.sourceUrl,
          button_text: "Buy Now",
          categories: product.category
            ? [{ name: product.category.split(" > ").pop()! }]
            : [],
          images: images.map((img) => ({ src: img.url, alt: img.alt_text })),
        },
        product.userId
      );

      await prisma.product.update({
        where: { id: product.id },
        data: {
          status: ProductStatus.PUBLISHED,
          woocommerceId: result.id,
          scheduledAt: null,
        },
      });

      results.push({ id: product.id, success: true });
    } catch (error) {
      await prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatus.FAILED },
      });
      results.push({
        id: product.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown",
      });
    }
  }

  return Response.json({ published: results.length, results });
}
