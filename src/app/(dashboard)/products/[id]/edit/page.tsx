import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductEditor } from "@/components/products/product-editor";
import type { ProductImage, SEOData } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, userId: user.id },
  });

  if (!product) notFound();

  return (
    <ProductEditor
      product={{
        id: product.id,
        title: product.title,
        price: product.price,
        currency: product.currency,
        category: product.category,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        shortDescription: product.shortDescription,
        fullDescription: product.fullDescription,
        affiliateUrl: product.affiliateUrl,
        tags: product.tags,
        specifications: product.specifications as Array<{ name: string; value: string }>,
        images: product.images as ProductImage[],
        seoData: product.seoData as SEOData | null,
        status: product.status,
      }}
    />
  );
}
