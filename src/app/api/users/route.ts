import { NextRequest } from "next/server";
import { jsonResponse, withAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

export const GET = withAdmin(async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  });
  return jsonResponse({ users });
});

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "USER"]),
});

export const PATCH = withAdmin(async (_user, request: NextRequest) => {
  const body = await request.json();
  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);

  const updated = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role as UserRole },
  });

  return jsonResponse({ user: updated });
});
