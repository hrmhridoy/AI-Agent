import * as cheerio from "cheerio";
import type { ExtractedProduct } from "@/types";

const EMPTY_PRODUCT: ExtractedProduct = {
  title: "",
  description: "",
  price: "",
  currency: "USD",
  images: [],
  specifications: [],
  brand: "",
  category: "",
};


function extractJsonLd($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        const product = findProductSchema(item);
        if (!product) continue;
        if (product.name) result.title = product.name;
        if (product.description) result.description = product.description;
        if (product.brand?.name) result.brand = product.brand.name;
        if (product.category) result.category = product.category;
        if (product.offers) {
          const offer = Array.isArray(product.offers)
            ? product.offers[0]
            : product.offers;
          if (offer?.price) result.price = String(offer.price);
          if (offer?.priceCurrency) result.currency = offer.priceCurrency;
        }
        if (product.image) {
          const imgs = Array.isArray(product.image)
            ? product.image
            : [product.image];
          result.images = imgs.map((img: string | { url?: string }) =>
            typeof img === "string" ? img : img?.url || ""
          ).filter(Boolean);
        }
      }
    } catch {
      // Invalid JSON-LD — skip
    }
  });
  return result;
}

function findProductSchema(item: Record<string, unknown>): Record<string, unknown> | null {
  if (item["@type"] === "Product") return item;
  if (item["@graph"] && Array.isArray(item["@graph"])) {
    for (const g of item["@graph"] as Record<string, unknown>[]) {
      if (g["@type"] === "Product") return g;
    }
  }
  return null;
}

function extractOpenGraph($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const productPrice = $('meta[property="product:price:amount"]').attr("content");
  const productCurrency = $('meta[property="product:price:currency"]').attr("content");

  if (ogTitle) result.title = ogTitle;
  if (ogDesc) result.description = ogDesc;
  if (productPrice) result.price = productPrice;
  if (productCurrency) result.currency = productCurrency;
  if (ogImage) result.images = [ogImage];
  return result;
}

function extractMetaTags($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  const title = $("title").text().trim();
  const desc = $('meta[name="description"]').attr("content");
  if (title && !result.title) result.title = title;
  if (desc && !result.description) result.description = desc;
  return result;
}

function extractAmazon($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  result.title =
    $("#productTitle").text().trim() ||
    $("#title").text().trim();
  result.price =
    $(".a-price .a-offscreen").first().text().trim() ||
    $("#priceblock_ourprice").text().trim() ||
    $("#priceblock_dealprice").text().trim();
  result.description =
    $("#feature-bullets ul").text().trim() ||
    $("#productDescription").text().trim();
  const images: string[] = [];
  $("#altImages img, #landingImage").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-old-hires");
    if (src) images.push(src.replace(/\._.*_\./, "."));
  });
  if (images.length) result.images = [...new Set(images)];
  result.brand = $("#bylineInfo").text().trim().replace(/^Visit the | Store$/g, "");
  return result;
}

function extractShopify($: cheerio.CheerioAPI, html: string): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  result.title = $("h1.product__title, h1.product-single__title, .product-title h1").first().text().trim();
  result.price = $(".price__regular .price-item--regular, .product__price .money, .price .money").first().text().trim();
  result.description = $(".product__description, .product-single__description, #product-description").first().text().trim();

  // Shopify often embeds product JSON
  const match = html.match(/var meta = (\{.*?\});/s) || html.match(/"product":(\{.*?\})\s*,\s*"page"/s);
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      const product = data.product || data;
      if (product.title) result.title = product.title;
      if (product.description) result.description = product.description;
      if (product.images) {
        result.images = product.images.map((img: { src?: string } | string) =>
          typeof img === "string" ? img : img.src
        ).filter(Boolean);
      }
      if (product.variants?.[0]?.price) {
        result.price = String(product.variants[0].price / 100);
      }
    } catch {
      // ignore parse errors
    }
  }

  const images: string[] = [];
  $(".product__media img, .product-single__photo img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (src) images.push(src.startsWith("//") ? `https:${src}` : src);
  });
  if (images.length && !result.images?.length) result.images = images;
  return result;
}

function extractEtsy($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  result.title = $("h1[data-buy-box-listing-title], h1.wt-text-body-01").first().text().trim();
  result.price = $('[data-buy-box-region] .wt-text-title-larger, .wt-screen-reader-only + p').first().text().trim();
  result.description = $('[data-product-details-description-text-content], #listing-page-cart').text().trim();
  const images: string[] = [];
  $("img[data-src-zoom-image], .carousel-image img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src-zoom-image");
    if (src) images.push(src);
  });
  if (images.length) result.images = images;
  return result;
}

function extractAliExpress($: cheerio.CheerioAPI, html: string): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  result.title = $("h1.product-title-text, .product-title").first().text().trim();
  result.price = $(".product-price-value, .uniform-banner-box-price").first().text().trim();

  const dataMatch = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});/);
  if (dataMatch) {
    try {
      const runParams = JSON.parse(dataMatch[1]);
      const data = runParams.data || runParams;
      if (data.titleModule?.subject) result.title = data.titleModule.subject;
      if (data.priceModule?.minAmount?.value) result.price = String(data.priceModule.minAmount.value);
      if (data.imageModule?.imagePathList) result.images = data.imageModule.imagePathList;
    } catch {
      // ignore
    }
  }
  return result;
}

function extractWooCommerce($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  result.title = $(".product_title, h1.entry-title").first().text().trim();
  result.price = $(".woocommerce-Price-amount, .price ins .amount, .price .amount").first().text().trim();
  result.description = $(".woocommerce-product-details__short-description, #tab-description").first().text().trim();
  const images: string[] = [];
  $(".woocommerce-product-gallery img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-large_image");
    if (src) images.push(src);
  });
  if (images.length) result.images = images;

  const specs: Array<{ name: string; value: string }> = [];
  $(".woocommerce-product-attributes tr").each((_, el) => {
    const name = $(el).find("th").text().trim();
    const value = $(el).find("td").text().trim();
    if (name && value) specs.push({ name, value });
  });
  if (specs.length) result.specifications = specs;
  return result;
}

function extractDomGeneric($: cheerio.CheerioAPI): Partial<ExtractedProduct> {
  const result: Partial<ExtractedProduct> = {};
  result.title =
    $("h1").first().text().trim() ||
    $('[itemprop="name"]').first().text().trim();
  result.price =
    $('[itemprop="price"]').attr("content") ||
    $('[itemprop="price"]').text().trim() ||
    $(".price, .product-price, [class*='price']").first().text().trim();
  result.description =
    $('[itemprop="description"]').text().trim() ||
    $(".product-description, .description, #description").first().text().trim();

  const images: string[] = [];
  $('[itemprop="image"], .product-image img, .gallery img, main img').each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (src && !src.includes("logo") && !src.includes("icon")) {
      images.push(src.startsWith("//") ? `https:${src}` : src);
    }
  });
  if (images.length) result.images = [...new Set(images)].slice(0, 10);
  return result;
}

function mergeExtracted(...sources: Partial<ExtractedProduct>[]): ExtractedProduct {
  const result = { ...EMPTY_PRODUCT };
  for (const source of sources) {
    if (source.title && !result.title) result.title = source.title;
    if (source.description && !result.description) result.description = source.description;
    if (source.price && !result.price) result.price = source.price;
    if (source.currency && source.currency !== "USD") result.currency = source.currency;
    if (source.brand && !result.brand) result.brand = source.brand;
    if (source.category && !result.category) result.category = source.category;
    if (source.images?.length) {
      result.images = [...new Set([...result.images, ...source.images])];
    }
    if (source.specifications?.length) {
      result.specifications = source.specifications;
    }
  }
  return result;
}

/** Parse HTML content and extract product data */
export function extractFromHtml(html: string, url: string): ExtractedProduct {
  const $ = cheerio.load(html);
  const host = new URL(url).hostname.toLowerCase();
  const isWoo = html.includes("woocommerce") || $(".woocommerce").length > 0;

  let platform = "generic";
  if (host.includes("amazon.")) platform = "amazon";
  else if (host.includes("etsy.com")) platform = "etsy";
  else if (host.includes("aliexpress.")) platform = "aliexpress";
  else if (host.includes("myshopify") || html.includes("Shopify.")) platform = "shopify";
  else if (isWoo) platform = "woocommerce";

  const jsonLd = extractJsonLd($);
  const openGraph = extractOpenGraph($);
  const metaTags = extractMetaTags($);

  let platformData: Partial<ExtractedProduct> = {};
  switch (platform) {
    case "amazon":
      platformData = extractAmazon($);
      break;
    case "shopify":
      platformData = extractShopify($, html);
      break;
    case "etsy":
      platformData = extractEtsy($);
      break;
    case "aliexpress":
      platformData = extractAliExpress($, html);
      break;
    case "woocommerce":
      platformData = extractWooCommerce($);
      break;
    default:
      platformData = extractDomGeneric($);
  }

  // Priority: JSON-LD > OpenGraph > Meta > Platform > DOM
  return mergeExtracted(jsonLd, openGraph, metaTags, platformData, extractDomGeneric($));
}

/** Fetch page with Playwright for JS-rendered sites */
export async function extractFromUrl(url: string): Promise<ExtractedProduct> {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    const html = await page.content();
    return extractFromHtml(html, url);
  } finally {
    await browser.close();
  }
}
