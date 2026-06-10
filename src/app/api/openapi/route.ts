export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "ProductPilot AI API",
      version: "1.0.0",
      description:
        "REST API for importing, managing, and publishing affiliate products to WooCommerce.",
    },
    servers: [{ url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" }],
    security: [{ cookieAuth: [] }],
    paths: {
      "/api/products": {
        get: {
          summary: "List products",
          parameters: [
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer" } },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
          responses: { "200": { description: "Product list" } },
        },
      },
      "/api/products/{id}": {
        get: { summary: "Get product", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Product details" } } },
        patch: { summary: "Update product", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Updated product" } } },
        delete: { summary: "Delete product", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Deleted" } } },
      },
      "/api/products/{id}/publish": {
        post: {
          summary: "Publish product to WooCommerce",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Published" } },
        },
      },
      "/api/products/{id}/blog": {
        post: { summary: "Generate blog post for product", responses: { "200": { description: "Blog post created" } } },
      },
      "/api/products/export": {
        get: { summary: "Export products as CSV", responses: { "200": { description: "CSV file" } } },
      },
      "/api/import": {
        get: { summary: "List import jobs", responses: { "200": { description: "Import jobs" } } },
        post: {
          summary: "Start import",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  oneOf: [
                    { type: "object", properties: { url: { type: "string" } } },
                    { type: "object", properties: { urls: { type: "array", items: { type: "string" } } } },
                  ],
                },
              },
            },
          },
          responses: { "200": { description: "Import started" } },
        },
      },
      "/api/import/stream": {
        get: { summary: "SSE stream for live import updates", responses: { "200": { description: "Event stream" } } },
      },
      "/api/settings": {
        get: { summary: "Get settings (admin)", responses: { "200": { description: "Settings" } } },
        put: { summary: "Update settings (admin)", responses: { "200": { description: "Saved" } } },
      },
      "/api/settings/test-woocommerce": {
        post: { summary: "Test WooCommerce connection", responses: { "200": { description: "Test result" } } },
      },
      "/api/settings/test-ai": {
        post: { summary: "Test AI API connection", responses: { "200": { description: "Test result" } } },
      },
      "/api/logs": {
        get: { summary: "View logs", responses: { "200": { description: "Log entries" } } },
      },
      "/api/users": {
        get: { summary: "List users (admin)", responses: { "200": { description: "Users" } } },
        patch: { summary: "Update user role (admin)", responses: { "200": { description: "Updated" } } },
      },
    },
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "sb-access-token" },
      },
    },
  };

  return Response.json(spec);
}
