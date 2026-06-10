import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductImage } from "@/types";
import { randomUUID } from "crypto";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

/** Download image and upload to Supabase Storage */
export async function downloadAndStoreImage(
  imageUrl: string,
  productId: string,
  altText: string = ""
): Promise<ProductImage | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : "jpg";

    const fileName = `${productId}/${randomUUID()}.${ext}`;
    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

    return { url: publicUrl, alt_text: altText };
  } catch (error) {
    console.error("Image download error:", error);
    return null;
  }
}

/** Process all product images — never hotlink */
export async function processProductImages(
  imageUrls: string[],
  productId: string,
  altTexts: string[] = []
): Promise<ProductImage[]> {
  const results: ProductImage[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const alt = altTexts[i] || `Product image ${i + 1}`;
    const stored = await downloadAndStoreImage(imageUrls[i], productId, alt);
    if (stored) results.push(stored);
  }

  return results;
}
