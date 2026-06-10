import { decryptIfNeeded } from "@/lib/encryption";
import { createLog } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { AIGeneratedContent, ExtractedProduct } from "@/types";
import { LogCategory, LogLevel } from "@prisma/client";

const CONTENT_PROMPT = `You are an expert SEO eCommerce writer.

Based on the extracted product data below, generate optimized product content.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "seo_title": "string (max 60 chars)",
  "seo_meta_description": "string (max 160 chars)",
  "product_title": "string",
  "short_description": "string (2-3 sentences)",
  "long_description": "string (HTML formatted, detailed product description)",
  "product_features": ["feature1", "feature2"],
  "product_specifications": [{"name": "Spec Name", "value": "Spec Value"}],
  "product_tags": ["tag1", "tag2"],
  "product_category": "Category > Subcategory",
  "image_alt_texts": ["alt text for image 1", "alt text for image 2"]
}

Rules:
- Maximum 20 tags in product_tags
- Category should follow hierarchy like "Pet Products > Dog Food"
- Image alt texts should match the number of images provided
- Be SEO-optimized and conversion-focused`;

const CATEGORY_PROMPT = `Classify this product into an eCommerce category hierarchy.
Return ONLY valid JSON: {"category": "Parent > Child > Subchild"}
Use common eCommerce categories. Maximum 3 levels.`;

const BLOG_PROMPT = `You are an expert product reviewer and content writer.

Write a comprehensive blog post (1500+ words) about this product in HTML format.

Return ONLY valid JSON:
{
  "title": "Blog post title",
  "content": "Full HTML article (1500+ words) with headings, paragraphs",
  "faq": [{"question": "...", "answer": "..."}],
  "pros": ["pro1", "pro2"],
  "cons": ["con1", "con2"],
  "conclusion": "Conclusion paragraph"
}`;

async function getAISettings() {
  const settings = await prisma.settings.findFirst();
  if (!settings?.aiApiKey || !settings?.aiBaseUrl) {
    throw new Error("AI API not configured. Please set up AI settings.");
  }
  return {
    apiKey: decryptIfNeeded(settings.aiApiKey)!,
    baseUrl: settings.aiBaseUrl.replace(/\/$/, ""),
    model: settings.aiModel || "gpt-4o-mini",
  };
}

async function callAI(
  messages: Array<{ role: string; content: string }>,
  userId?: string
): Promise<string> {
  const { apiKey, baseUrl, model } = await getAISettings();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    await createLog(LogCategory.AI, `AI API error: ${response.status}`, {
      level: LogLevel.ERROR,
      userId,
      metadata: { error },
    });
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  await createLog(LogCategory.AI, "AI content generated successfully", {
    userId,
    metadata: { model, tokens: data.usage?.total_tokens },
  });

  return content;
}

function parseJSON<T>(content: string): T {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function generateProductContent(
  extracted: ExtractedProduct,
  userId?: string
): Promise<AIGeneratedContent> {
  const content = await callAI(
    [
      { role: "system", content: CONTENT_PROMPT },
      {
        role: "user",
        content: JSON.stringify(extracted, null, 2),
      },
    ],
    userId
  );
  return parseJSON<AIGeneratedContent>(content);
}

export async function detectCategory(
  product: { title?: string | null; description?: string | null },
  userId?: string
): Promise<string> {
  const content = await callAI(
    [
      { role: "system", content: CATEGORY_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          title: product.title,
          description: product.description,
        }),
      },
    ],
    userId
  );
  const result = parseJSON<{ category: string }>(content);
  return result.category;
}

export async function generateTags(
  product: { title?: string | null; description?: string | null; category?: string | null },
  userId?: string
): Promise<string[]> {
  const content = await callAI(
    [
      {
        role: "system",
        content:
          'Generate SEO keywords and product tags. Return JSON: {"tags": ["tag1"]}. Maximum 20 tags.',
      },
      { role: "user", content: JSON.stringify(product) },
    ],
    userId
  );
  const result = parseJSON<{ tags: string[] }>(content);
  return (result.tags || []).slice(0, 20);
}

export async function generateBlogPost(
  product: {
    title?: string | null;
    fullDescription?: string | null;
    price?: string | null;
    category?: string | null;
    features?: string[];
  },
  userId?: string
) {
  const content = await callAI(
    [
      { role: "system", content: BLOG_PROMPT },
      { role: "user", content: JSON.stringify(product) },
    ],
    userId
  );
  return parseJSON<{
    title: string;
    content: string;
    faq: Array<{ question: string; answer: string }>;
    pros: string[];
    cons: string[];
    conclusion: string;
  }>(content);
}

export async function testAIConnection(
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<boolean> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Say OK" }],
      max_tokens: 5,
    }),
  });
  return response.ok;
}
