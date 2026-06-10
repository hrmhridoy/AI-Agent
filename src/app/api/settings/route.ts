import { NextRequest } from "next/server";
import { jsonResponse, withAdmin, withAuth } from "@/lib/api-helpers";
import { encryptIfNeeded } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations";

export const GET = withAuth(async () => {
  const settings = await prisma.settings.findFirst();
  if (!settings) return jsonResponse({ settings: null });

  // Never expose decrypted secrets to client
  return jsonResponse({
    settings: {
      id: settings.id,
      aiBaseUrl: settings.aiBaseUrl,
      aiModel: settings.aiModel,
      woocommerceUrl: settings.woocommerceUrl,
      wordpressUrl: settings.wordpressUrl,
      wordpressUsername: settings.wordpressUsername,
      hasAiKey: !!settings.aiApiKey,
      hasWooCommerceKeys: !!(
        settings.woocommerceConsumerKey && settings.woocommerceConsumerSecret
      ),
      hasWordPressPassword: !!settings.wordpressAppPassword,
    },
  });
});

export const PUT = withAdmin(async (_user, request: NextRequest) => {
  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);

  const data: Record<string, string | null | undefined> = {};

  if (parsed.data.aiApiKey) data.aiApiKey = encryptIfNeeded(parsed.data.aiApiKey);
  if (parsed.data.aiBaseUrl) data.aiBaseUrl = parsed.data.aiBaseUrl;
  if (parsed.data.aiModel) data.aiModel = parsed.data.aiModel;
  if (parsed.data.woocommerceUrl) data.woocommerceUrl = parsed.data.woocommerceUrl;
  if (parsed.data.woocommerceConsumerKey)
    data.woocommerceConsumerKey = encryptIfNeeded(parsed.data.woocommerceConsumerKey);
  if (parsed.data.woocommerceConsumerSecret)
    data.woocommerceConsumerSecret = encryptIfNeeded(parsed.data.woocommerceConsumerSecret);
  if (parsed.data.wordpressUrl !== undefined) data.wordpressUrl = parsed.data.wordpressUrl;
  if (parsed.data.wordpressUsername !== undefined)
    data.wordpressUsername = parsed.data.wordpressUsername;
  if (parsed.data.wordpressAppPassword)
    data.wordpressAppPassword = encryptIfNeeded(parsed.data.wordpressAppPassword);

  const existing = await prisma.settings.findFirst();
  const settings = existing
    ? await prisma.settings.update({ where: { id: existing.id }, data })
    : await prisma.settings.create({ data });

  return jsonResponse({ settings: { id: settings.id }, message: "Settings saved" });
});
