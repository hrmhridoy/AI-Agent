import type { ProductImage, SEOData } from "@/types";

export function generateSEOData(product: {
  title?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  fullDescription?: string | null;
  price?: string | null;
  currency?: string | null;
  images?: ProductImage[];
  affiliateUrl?: string | null;
  sourceUrl?: string | null;
  category?: string | null;
  tags?: string[];
}): SEOData {
  const metaTitle = product.seoTitle || product.title || "Product";
  const metaDescription =
    product.seoDescription ||
    product.fullDescription?.replace(/<[^>]*>/g, "").slice(0, 160) ||
    "";
  const canonicalUrl = product.affiliateUrl || product.sourceUrl || "";
  const image = (product.images as ProductImage[])?.[0]?.url || "";

  return {
    meta_title: metaTitle,
    meta_description: metaDescription,
    canonical_url: canonicalUrl,
    open_graph: {
      title: metaTitle,
      description: metaDescription,
      image,
      url: canonicalUrl,
      type: "product",
    },
    twitter_card: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      image,
    },
    schema_json_ld: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: metaDescription,
      image: (product.images as ProductImage[])?.map((img) => img.url) || [],
      offers: {
        "@type": "Offer",
        price: product.price?.replace(/[^0-9.]/g, "") || "0",
        priceCurrency: product.currency || "USD",
        url: canonicalUrl,
        availability: "https://schema.org/InStock",
      },
      category: product.category,
      keywords: product.tags?.join(", "),
    },
  };
}
