import { z } from "zod";

export const urlSchema = z.string().url("Invalid URL");

export const importUrlSchema = z.object({
  url: urlSchema,
});

export const bulkImportSchema = z.object({
  urls: z.array(urlSchema).min(1, "At least one URL required").max(100),
});

export const productUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  price: z.string().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  affiliateUrl: urlSchema.optional(),
  tags: z.array(z.string()).max(20).optional(),
  specifications: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .optional(),
  images: z
    .array(z.object({ url: z.string(), alt_text: z.string() }))
    .optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export const settingsSchema = z.object({
  aiApiKey: z.string().optional(),
  aiBaseUrl: z.string().url().optional(),
  aiModel: z.string().optional(),
  woocommerceUrl: z.string().url().optional(),
  woocommerceConsumerKey: z.string().optional(),
  woocommerceConsumerSecret: z.string().optional(),
  wordpressUrl: z.string().url().optional().nullable(),
  wordpressUsername: z.string().optional().nullable(),
  wordpressAppPassword: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});
