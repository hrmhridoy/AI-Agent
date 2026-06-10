"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/openapi")
      .then((r) => r.json())
      .then(setSpec);
  }, []);

  const paths = spec?.paths as Record<string, Record<string, { summary?: string }>> | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground">OpenAPI 3.0 specification for ProductPilot AI</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/openapi" target="_blank" rel="noopener">
            <ExternalLink className="h-4 w-4" />
            Raw OpenAPI JSON
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {(spec?.info as { title?: string })?.title || "ProductPilot AI API"}
          </CardTitle>
          <CardDescription>
            Version {(spec?.info as { version?: string })?.version || "1.0.0"} — All endpoints require authentication via Supabase session cookie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!paths ? (
            <p className="text-sm text-muted-foreground">Loading API spec...</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(paths).map(([path, methods]) => (
                <div key={path} className="border rounded-lg p-4">
                  <code className="text-sm font-mono">{path}</code>
                  <div className="mt-2 space-y-2">
                    {Object.entries(methods).map(([method, details]) => (
                      <div key={method} className="flex items-center gap-3">
                        <Badge variant={method === "get" ? "secondary" : "default"}>
                          {method.toUpperCase()}
                        </Badge>
                        <span className="text-sm">{details.summary}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
