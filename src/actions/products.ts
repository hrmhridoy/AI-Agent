"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/validations";
import { generateSEOData } from "@/lib/services/seo";
import type { ProductImage } from "@/types";

export async function updateProductAction(id: string, formData: FormData) {
  const user = await requireUser();

  const raw = {
    title: formData.get("title") as string,
    price: formData.get("price") as string,
    category: formData.get("category") as string,
    seoTitle: formData.get("seoTitle") as string,
    seoDescription: formData.get("seoDescription") as string,
    shortDescription: formData.get("shortDescription") as string,
    fullDescription: formData.get("fullDescription") as string,
    affiliateUrl: formData.get("affiliateUrl") as string,
  };

  const parsed = productUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const existing = await prisma.product.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { error: "Not found" };

  await prisma.product.update({
    where: { id },
    data: {
      ...parsed.data,
      seoData: generateSEOData({
        title: parsed.data.title ?? existing.title,
        seoTitle: parsed.data.seoTitle ?? existing.seoTitle,
        seoDescription: parsed.data.seoDescription ?? existing.seoDescription,
        fullDescription: parsed.data.fullDescription ?? existing.fullDescription,
        price: parsed.data.price ?? existing.price,
        currency: existing.currency,
        images: existing.images as ProductImage[],
        affiliateUrl: parsed.data.affiliateUrl ?? existing.affiliateUrl,
        sourceUrl: existing.sourceUrl,
        category: parsed.data.category ?? existing.category,
        tags: existing.tags,
      }),
    },
  });

  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  return { success: true };
}
