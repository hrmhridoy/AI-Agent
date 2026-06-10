import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOPreview } from "@/components/products/seo-preview";
import { Pencil } from "lucide-react";
import type { ProductImage, SEOData } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductViewPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, userId: user.id },
    include: { blogPosts: true },
  });

  if (!product) notFound();

  const images = product.images as ProductImage[];
  const seoData = product.seoData as SEOData | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.title || "Untitled"}</h1>
          <div className="flex gap-2 mt-2">
            <Badge>{product.status}</Badge>
            {product.woocommerceId && <Badge variant="success">WC #{product.woocommerceId}</Badge>}
          </div>
        </div>
        <Button asChild>
          <Link href={`/products/${product.id}/edit`}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image src={img.url} alt={img.alt_text} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Price:</strong> {formatPrice(product.price, product.currency)}</p>
              <p><strong>Category:</strong> {product.category || "—"}</p>
              <p><strong>Source:</strong> <a href={product.sourceUrl} className="text-blue-500 hover:underline" target="_blank" rel="noopener">{product.sourceUrl}</a></p>
              {product.shortDescription && <p>{product.shortDescription}</p>}
            </CardContent>
          </Card>

          {product.fullDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.fullDescription }}
                />
              </CardContent>
            </Card>
          )}

          {product.blogPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Blog Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {product.blogPosts.map((blog) => (
                  <div key={blog.id} className="border-b py-2 last:border-0">
                    <p className="font-medium">{blog.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {blog.createdAt.toLocaleDateString()}
                      {blog.published && " · Published to WordPress"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <SEOPreview seoData={seoData} />
          {product.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
