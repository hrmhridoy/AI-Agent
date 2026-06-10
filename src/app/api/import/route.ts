import { NextRequest } from "next/server";
import { jsonResponse, withAuth } from "@/lib/api-helpers";
import { createBulkImportJobs, processQueue } from "@/lib/services/import-queue";
import { bulkImportSchema, importUrlSchema } from "@/lib/validations";

export const POST = withAuth(async (user, request: NextRequest) => {
  const body = await request.json();

  if (body.urls && Array.isArray(body.urls)) {
    const parsed = bulkImportSchema.safeParse({ urls: body.urls });
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten() }, 400);
    }
    const jobIds = await createBulkImportJobs(user.id, parsed.data.urls);
    // Process queue in background (non-blocking)
    processQueue(user.id).catch(console.error);
    return jsonResponse({ jobIds, message: "Bulk import started" });
  }

  const parsed = importUrlSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: parsed.error.flatten() }, 400);
  }

  const jobIds = await createBulkImportJobs(user.id, [parsed.data.url]);
  processQueue(user.id).catch(console.error);
  return jsonResponse({ jobId: jobIds[0], message: "Import started" });
});

export const GET = withAuth(async (user) => {
  const { prisma } = await import("@/lib/prisma");
  const jobs = await prisma.importJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return jsonResponse({ jobs });
});
