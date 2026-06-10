import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductCompare } from "@/components/compare/product-compare";
import type { ProductImage } from "@/types";

export default async function ComparePage() {
  const user = await requireUser();

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      category: true,
      tags: true,
      images: true,
      status: true,
      shortDescription: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Comparison</h1>
        <p className="text-muted-foreground">Compare imported products side by side</p>
      </div>
      <ProductCompare
        products={products.map((p) => ({
          ...p,
          images: p.images as ProductImage[],
        }))}
      />
    </div>
  );
}
