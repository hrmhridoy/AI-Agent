import { withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (user) => {
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "id",
    "title",
    "source_url",
    "affiliate_url",
    "price",
    "currency",
    "category",
    "status",
    "woocommerce_id",
    "tags",
    "created_at",
  ];

  const rows = products.map((p) =>
    [
      p.id,
      `"${(p.title || "").replace(/"/g, '""')}"`,
      p.sourceUrl,
      p.affiliateUrl || "",
      p.price || "",
      p.currency || "",
      `"${(p.category || "").replace(/"/g, '""')}"`,
      p.status,
      p.woocommerceId || "",
      `"${p.tags.join(", ")}"`,
      p.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="products-export.csv"',
    },
  });
});
