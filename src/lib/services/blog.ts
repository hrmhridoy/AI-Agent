import { decryptIfNeeded } from "@/lib/encryption";
import { createLog } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { generateBlogPost } from "@/lib/services/ai";
import { LogCategory } from "@prisma/client";

export async function createBlogForProduct(productId: string, userId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
  });

  if (!product) throw new Error("Product not found");

  const blogData = await generateBlogPost(
    {
      title: product.title,
      fullDescription: product.fullDescription,
      price: product.price,
      category: product.category,
      features: product.features,
    },
    userId
  );

  const blogPost = await prisma.blogPost.create({
    data: {
      userId,
      productId,
      title: blogData.title,
      content: blogData.content + `<h2>Conclusion</h2><p>${blogData.conclusion}</p>`,
      faq: blogData.faq,
      pros: blogData.pros,
      cons: blogData.cons,
    },
  });

  await createLog(LogCategory.AI, `Blog post generated for product ${productId}`, {
    userId,
    metadata: { blogPostId: blogPost.id },
  });

  return blogPost;
}

/** Optional: publish blog to WordPress */
export async function publishToWordPress(blogPostId: string, userId: string) {
  const settings = await prisma.settings.findFirst();
  if (!settings?.wordpressUrl || !settings?.wordpressUsername || !settings?.wordpressAppPassword) {
    throw new Error("WordPress not configured");
  }

  const blogPost = await prisma.blogPost.findFirst({
    where: { id: blogPostId, userId },
  });
  if (!blogPost) throw new Error("Blog post not found");

  const password = decryptIfNeeded(settings.wordpressAppPassword)!;
  const auth = Buffer.from(`${settings.wordpressUsername}:${password}`).toString("base64");

  const response = await fetch(
    `${settings.wordpressUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: blogPost.title,
        content: blogPost.content,
        status: "draft",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`WordPress publish failed: ${response.status}`);
  }

  const wpPost = await response.json();

  await prisma.blogPost.update({
    where: { id: blogPostId },
    data: { wordpressId: wpPost.id, published: true },
  });

  return wpPost;
}
