export interface ExtractedProduct {
  title: string;
  description: string;
  price: string;
  currency: string;
  images: string[];
  specifications: Array<{ name: string; value: string }>;
  brand: string;
  category: string;
}

export interface ProductImage {
  url: string;
  alt_text: string;
}

export interface AIGeneratedContent {
  seo_title: string;
  seo_meta_description: string;
  product_title: string;
  short_description: string;
  long_description: string;
  product_features: string[];
  product_specifications: Array<{ name: string; value: string }>;
  product_tags: string[];
  product_category: string;
  image_alt_texts: string[];
}

export interface SEOData {
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  open_graph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  };
  twitter_card: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  schema_json_ld: Record<string, unknown>;
}

export interface ImportJobLog {
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error";
}

export interface WooCommerceProductPayload {
  type: "external";
  name: string;
  regular_price: string;
  description: string;
  short_description: string;
  external_url: string;
  button_text: string;
  categories: Array<{ name: string }>;
  images: Array<{ src: string; alt?: string }>;
  tags?: Array<{ name: string }>;
}
