import { NextRequest } from "next/server";
import { jsonResponse, withAuth } from "@/lib/api-helpers";
import { createBulkImportJobs, processQueue } from "@/lib/services/import-queue";
import { bulkImportSchema, importUrlSchema } from "@/lib/validations";

const postHandler = withAuth(async (user, request) => {
  const body = await request.json();

  if (body.urls && Array.isArray(body.urls)) {
    const parsed = bulkImportSchema.safeParse({ urls: body.urls });

    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten() }, 400);
    }

    const jobIds = await createBulkImportJobs(user.id, parsed.data.urls);

    processQueue(user.id).catch(console.error);

    return jsonResponse({
      jobIds,
      message: "Bulk import started",
    });
  }

  const parsed = importUrlSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse({ error: parsed.error.flatten() }, 400);
  }

  const jobIds = await createBulkImportJobs(user.id, [parsed.data.url]);

  processQueue(user.id).catch(console.error);

  return jsonResponse({
    jobId: jobIds[0],
    message: "Import started",
  });
});

const getHandler = withAuth(async (user) => {
  const { prisma } = await import("@/lib/prisma");

  const jobs = await prisma.importJob.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return jsonResponse({ jobs });
});

export async function POST(request: NextRequest) {
  return postHandler(request);
}

export async function GET(request: NextRequest) {
  return getHandler(request);
}
