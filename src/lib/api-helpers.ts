import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin, requireUser } from "@/lib/auth";
import { getRateLimitHeaders, rateLimit } from "@/lib/rate-limit";

export function withAuth(
  handler: (user: Awaited<ReturnType<typeof requireUser>>, request: Request) => Promise<Response>
) {
  return async (request: Request) => {
    try {
      const ip = request.headers.get("x-forwarded-for") || "unknown";
      const limit = rateLimit(ip);
      if (!limit.success) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: getRateLimitHeaders(limit) }
        );
      }

      const user = await requireUser();
      const response = await handler(user, request);
      Object.entries(getRateLimitHeaders(limit)).forEach(([k, v]) => {
        response.headers.set(k, v);
      });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      const status = message === "Unauthorized" ? 401 : message.includes("Forbidden") ? 403 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  };
}

export function withAdmin(
  handler: (user: Awaited<ReturnType<typeof requireAdmin>>, request: Request) => Promise<Response>
) {
  return withAuth(async (user, request) => {
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(user as Awaited<ReturnType<typeof requireAdmin>>, request);
  });
}

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function optionalUser() {
  return getCurrentUser();
}
