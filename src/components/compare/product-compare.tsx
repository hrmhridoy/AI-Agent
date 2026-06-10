"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { GitCompare } from "lucide-react";
import type { ProductImage } from "@/types";

interface ProductOption {
  id: string;
  title: string | null;
  price: string | null;
  currency: string | null;
  category: string | null;
  tags: string[];
  images: ProductImage[];
  status: string;
  shortDescription: string | null;
}

interface ProductCompareProps {
  products: ProductOption[];
}

export function ProductCompare({ products }: ProductCompareProps) {
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  const left = products.find((p) => p.id === leftId);
  const right = products.find((p) => p.id === rightId);

  const fields = [
    { label: "Title", key: "title" as const },
    { label: "Price", key: "price" as const },
    { label: "Category", key: "category" as const },
    { label: "Status", key: "status" as const },
    { label: "Tags", key: "tags" as const },
    { label: "Description", key: "shortDescription" as const },
  ];

  const renderValue = (product: ProductOption | undefined, key: string) => {
    if (!product) return "—";
    if (key === "price") return formatPrice(product.price, product.currency);
    if (key === "tags") return product.tags.join(", ") || "—";
    const val = product[key as keyof ProductOption];
    return (val as string) || "—";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Select value={leftId} onValueChange={setLeftId}>
          <SelectTrigger>
            <SelectValue placeholder="Select product 1" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id} disabled={p.id === rightId}>
                {p.title || "Untitled"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rightId} onValueChange={setRightId}>
          <SelectTrigger>
            <SelectValue placeholder="Select product 2" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id} disabled={p.id === leftId}>
                {p.title || "Untitled"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {left && right && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCompare className="h-4 w-4" />
              Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div />
              <div className="text-center">
                {left.images?.[0] && (
                  <Image src={left.images[0].url} alt="" width={80} height={80} className="mx-auto rounded" />
                )}
                <p className="text-sm font-medium mt-2">{left.title}</p>
              </div>
              <div className="text-center">
                {right.images?.[0] && (
                  <Image src={right.images[0].url} alt="" width={80} height={80} className="mx-auto rounded" />
                )}
                <p className="text-sm font-medium mt-2">{right.title}</p>
              </div>
            </div>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.key} className="grid grid-cols-3 gap-4 border-b pb-3">
                  <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                  <p className="text-sm">{renderValue(left, field.key)}</p>
                  <p className="text-sm">{renderValue(right, field.key)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {products.length < 2 && (
        <p className="text-sm text-muted-foreground text-center">
          Import at least 2 products to compare them.
        </p>
      )}
    </div>
  );
}
