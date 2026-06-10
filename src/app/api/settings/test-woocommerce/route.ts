import { NextRequest } from "next/server";
import { jsonResponse, withAdmin } from "@/lib/api-helpers";
import { decryptIfNeeded } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { testWooCommerceConnection } from "@/lib/services/woocommerce";

export const POST = withAdmin(async (_user, request: NextRequest) => {
  const body = await request.json();
  let { url, consumerKey, consumerSecret } = body;

  if (!url || !consumerKey || !consumerSecret) {
    const settings = await prisma.settings.findFirst();
    url = url || settings?.woocommerceUrl;
    consumerKey = consumerKey || decryptIfNeeded(settings?.woocommerceConsumerKey);
    consumerSecret = consumerSecret || decryptIfNeeded(settings?.woocommerceConsumerSecret);
  }

  if (!url || !consumerKey || !consumerSecret) {
    return jsonResponse({ error: "WooCommerce credentials required" }, 400);
  }

  const result = await testWooCommerceConnection(url, consumerKey, consumerSecret);
  return jsonResponse(result);
});
