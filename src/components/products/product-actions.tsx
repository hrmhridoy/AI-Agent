"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Upload, Trash2 } from "lucide-react";

interface ProductActionsProps {
  productId: string;
  status: string;
}

export function ProductActions({ productId, status }: ProductActionsProps) {
  const router = useRouter();

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || "Published!");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Product deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/products/${productId}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/products/${productId}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      {status !== "PUBLISHED" && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePublish}>
          <Upload className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
