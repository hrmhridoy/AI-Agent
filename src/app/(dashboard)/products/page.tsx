import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Import, Download } from "lucide-react";
import { ProductActions } from "@/components/products/product-actions";
import type { ProductImage } from "@/types";

function statusVariant(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "FAILED":
      return "destructive" as const;
    case "SCHEDULED":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export default async function ProductsPage() {
  const user = await requireUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">{products.length} products total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/products/export" download>
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
          <Button asChild>
            <Link href="/import">
              <Import className="h-4 w-4" />
              New Import
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No products yet.</p>
              <Button asChild className="mt-4">
                <Link href="/import">Import your first product</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WooCommerce</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const images = product.images as ProductImage[];
                  const thumb = images?.[0]?.url;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {product.title || "Untitled"}
                      </TableCell>
                      <TableCell>{formatPrice(product.price, product.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(product.status)}>{product.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.woocommerceId ? (
                          <Badge variant="success">#{product.woocommerceId}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductActions productId={product.id} status={product.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
