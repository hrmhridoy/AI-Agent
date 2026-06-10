import { LogCategory, LogLevel, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createLog(
  category: LogCategory,
  message: string,
  options?: {
    level?: LogLevel;
    userId?: string;
    metadata?: Prisma.InputJsonValue;
  }
) {
  try {
    await prisma.log.create({
      data: {
        category,
        message,
        level: options?.level ?? LogLevel.INFO,
        userId: options?.userId,
        metadata: options?.metadata,
      },
    });
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}
