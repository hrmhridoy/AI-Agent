import { NextRequest } from "next/server";
import { jsonResponse, withAdmin } from "@/lib/api-helpers";
import { decryptIfNeeded } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { testAIConnection } from "@/lib/services/ai";

export const POST = withAdmin(async (_user, request: NextRequest) => {
  const body = await request.json();
  let { apiKey, baseUrl, model } = body;

  if (!apiKey || !baseUrl) {
    const settings = await prisma.settings.findFirst();
    apiKey = apiKey || decryptIfNeeded(settings?.aiApiKey);
    baseUrl = baseUrl || settings?.aiBaseUrl;
    model = model || settings?.aiModel || "gpt-4o-mini";
  }

  if (!apiKey || !baseUrl) {
    return jsonResponse({ error: "AI API credentials required" }, 400);
  }

  const success = await testAIConnection(apiKey, baseUrl, model);
  return jsonResponse({
    success,
    message: success ? "AI connection successful" : "AI connection failed",
  });
});
