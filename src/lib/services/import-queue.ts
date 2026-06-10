import { ImportJobStatus, LogCategory, LogLevel, ProductStatus } from "@prisma/client";
import { createLog } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { generateProductContent } from "@/lib/services/ai";
import { extractFromUrl } from "@/lib/services/extractor";
import { processProductImages } from "@/lib/services/images";
import { generateSEOData } from "@/lib/services/seo";
import type { ImportJobLog, ProductImage } from "@/types";

function appendLog(
  logs: ImportJobLog[],
  message: string,
  level: ImportJobLog["level"] = "info"
): ImportJobLog[] {
  return [
    ...logs,
    { timestamp: new Date().toISOString(), message, level },
  ];
}

/** Check for duplicate product by source URL */
export async function isDuplicateUrl(
  userId: string,
  sourceUrl: string
): Promise<boolean> {
  const existing = await prisma.product.findUnique({
    where: { userId_sourceUrl: { userId, sourceUrl } },
  });
  return !!existing;
}

/** Process a single import job */
export async function processImportJob(jobId: string): Promise<void> {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== ImportJobStatus.PENDING) return;

  let logs = (job.logs as ImportJobLog[]) || [];

  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      status: ImportJobStatus.PROCESSING,
      startedAt: new Date(),
      logs: appendLog(logs, "Starting import..."),
    },
  });

  try {
    // Duplicate check
    if (await isDuplicateUrl(job.userId, job.sourceUrl)) {
      logs = appendLog(logs, "Duplicate URL detected — skipping", "warn");
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportJobStatus.FAILED,
          completedAt: new Date(),
          error: "Product already imported",
          logs,
        },
      });
      return;
    }

    logs = appendLog(logs, "Extracting product data...");
    await prisma.importJob.update({ where: { id: jobId }, data: { logs } });

    const extracted = await extractFromUrl(job.sourceUrl);

    logs = appendLog(logs, `Extracted: ${extracted.title || "Unknown product"}`);
    await prisma.importJob.update({ where: { id: jobId }, data: { logs } });

    // Create draft product
    const product = await prisma.product.create({
      data: {
        userId: job.userId,
        sourceUrl: job.sourceUrl,
        affiliateUrl: job.sourceUrl,
        title: extracted.title,
        price: extracted.price,
        currency: extracted.currency,
        category: extracted.category,
        rawExtractedData: extracted,
        status: ProductStatus.DRAFT,
      },
    });

    logs = appendLog(logs, "Generating AI content...");
    await prisma.importJob.update({ where: { id: jobId }, data: { logs } });

    let aiContent;
    try {
      aiContent = await generateProductContent(extracted, job.userId);
    } catch {
      logs = appendLog(logs, "AI generation failed — using extracted data", "warn");
      aiContent = null;
    }

    logs = appendLog(logs, "Downloading and storing images...");
    await prisma.importJob.update({ where: { id: jobId }, data: { logs } });

    const storedImages = await processProductImages(
      extracted.images,
      product.id,
      aiContent?.image_alt_texts || []
    );

    const seoData = generateSEOData({
      title: aiContent?.product_title || extracted.title,
      seoTitle: aiContent?.seo_title,
      seoDescription: aiContent?.seo_meta_description,
      fullDescription: aiContent?.long_description || extracted.description,
      price: extracted.price,
      currency: extracted.currency,
      images: storedImages,
      affiliateUrl: job.sourceUrl,
      sourceUrl: job.sourceUrl,
      category: aiContent?.product_category || extracted.category,
      tags: aiContent?.product_tags,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        title: aiContent?.product_title || extracted.title,
        seoTitle: aiContent?.seo_title,
        seoDescription: aiContent?.seo_meta_description,
        shortDescription: aiContent?.short_description || extracted.description?.slice(0, 300),
        fullDescription: aiContent?.long_description || extracted.description,
        category: aiContent?.product_category || extracted.category,
        tags: aiContent?.product_tags || [],
        features: aiContent?.product_features || [],
        specifications: aiContent?.product_specifications || extracted.specifications,
        images: storedImages,
        seoData,
      },
    });

    logs = appendLog(logs, "Import completed successfully");
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.COMPLETED,
        completedAt: new Date(),
        productId: product.id,
        logs,
      },
    });

    await createLog(LogCategory.IMPORT, `Import completed: ${extracted.title}`, {
      userId: job.userId,
      metadata: { jobId, productId: product.id, sourceUrl: job.sourceUrl },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logs = appendLog(logs, `Import failed: ${errorMessage}`, "error");

    const updatedJob = await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: ImportJobStatus.FAILED,
        completedAt: new Date(),
        error: errorMessage,
        logs,
        retryCount: { increment: 1 },
      },
    });

    // Auto-retry up to 3 times
    if (updatedJob.retryCount < 3) {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: ImportJobStatus.PENDING },
      });
      logs = appendLog(logs, `Scheduled retry (${updatedJob.retryCount}/3)`);
      await prisma.importJob.update({ where: { id: jobId }, data: { logs } });
    }

    await createLog(LogCategory.IMPORT, `Import failed: ${errorMessage}`, {
      level: LogLevel.ERROR,
      userId: job.userId,
      metadata: { jobId, sourceUrl: job.sourceUrl },
    });
  }
}

/** Process all pending jobs sequentially for a user */
export async function processQueue(userId: string): Promise<void> {
  const pendingJobs = await prisma.importJob.findMany({
    where: { userId, status: ImportJobStatus.PENDING },
    orderBy: { createdAt: "asc" },
  });

  for (const job of pendingJobs) {
    await processImportJob(job.id);
  }
}

/** Create bulk import jobs from URLs */
export async function createBulkImportJobs(
  userId: string,
  urls: string[]
): Promise<string[]> {
  const jobIds: string[] = [];

  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed) continue;

    const job = await prisma.importJob.create({
      data: {
        userId,
        sourceUrl: trimmed,
        status: ImportJobStatus.PENDING,
      },
    });
    jobIds.push(job.id);
  }

  return jobIds;
}
