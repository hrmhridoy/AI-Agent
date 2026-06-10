import { NextRequest } from "next/server";
import { jsonResponse, withAuth } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (user, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1", 10);

  const where = {
    OR: [{ userId: user.id }, { userId: null }],
    ...(category ? { category: category as "IMPORT" | "AI" | "WOOCOMMERCE" | "SYSTEM" } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 50,
      take: 50,
    }),
    prisma.log.count({ where }),
  ]);

  return jsonResponse({ logs, total, page });
});
