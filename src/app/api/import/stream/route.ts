import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Server-Sent Events endpoint for live import job updates.
 * Vercel-compatible alternative to WebSockets.
 */
export async function GET() {
  const user = await requireUser();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let active = true;
      const interval = setInterval(async () => {
        if (!active) return;
        try {
          const jobs = await prisma.importJob.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
          });
          send({ type: "jobs", jobs });
        } catch {
          send({ type: "error", message: "Failed to fetch jobs" });
        }
      }, 2000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        active = false;
        clearInterval(interval);
        controller.close();
      }, 300000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
