import { decryptIfNeeded } from "@/lib/encryption";
import { createLog } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { WooCommerceProductPayload } from "@/types";
import { LogCategory, LogLevel } from "@prisma/client";

interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
}

async function getWooCommerceConfig(): Promise<WooCommerceConfig> {
  const settings = await prisma.settings.findFirst();
  if (
    !settings?.woocommerceUrl ||
    !settings?.woocommerceConsumerKey ||
    !settings?.woocommerceConsumerSecret
  ) {
    throw new Error("WooCommerce not configured");
  }
  return {
    url: settings.woocommerceUrl.replace(/\/$/, ""),
    consumerKey: decryptIfNeeded(settings.woocommerceConsumerKey)!,
    consumerSecret: decryptIfNeeded(settings.woocommerceConsumerSecret)!,
  };
}

function buildAuthHeader(key: string, secret: string): string {
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

async function wooRequest<T>(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  const config = await getWooCommerceConfig();
  const url = `${config.url}/wp-json/wc/v3${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: buildAuthHeader(config.consumerKey, config.consumerSecret),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WooCommerce API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function testWooCommerceConnection(
  url: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ success: boolean; message: string }> {
  try {
    const baseUrl = url.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/wp-json/wc/v3/system_status`, {
      headers: {
        Authorization: buildAuthHeader(consumerKey, consumerSecret),
      },
    });

    if (response.ok) {
      return { success: true, message: "Connection successful" };
    }
    return {
      success: false,
      message: `Connection failed: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function publishExternalProduct(
  payload: WooCommerceProductPayload,
  userId?: string
): Promise<{ id: number }> {
  try {
    const result = await wooRequest<{ id: number }>("/products", "POST", payload);

    await createLog(LogCategory.WOOCOMMERCE, `Product published: ${result.id}`, {
      userId,
      metadata: { woocommerceId: result.id, name: payload.name },
    });

    return result;
  } catch (error) {
    await createLog(LogCategory.WOOCOMMERCE, "Failed to publish product", {
      level: LogLevel.ERROR,
      userId,
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    });
    throw error;
  }
}

export async function updateExternalProduct(
  woocommerceId: number,
  payload: Partial<WooCommerceProductPayload>,
  userId?: string
): Promise<{ id: number }> {
  const result = await wooRequest<{ id: number }>(
    `/products/${woocommerceId}`,
    "PUT",
    payload
  );

  await createLog(LogCategory.WOOCOMMERCE, `Product updated: ${result.id}`, {
    userId,
    metadata: { woocommerceId: result.id },
  });

  return result;
}

export async function deleteWooCommerceProduct(
  woocommerceId: number,
  userId?: string
): Promise<void> {
  await wooRequest(`/products/${woocommerceId}?force=true`, "DELETE");
  await createLog(LogCategory.WOOCOMMERCE, `Product deleted: ${woocommerceId}`, {
    userId,
  });
}
