"use client";

import type { SEOData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SEOPreviewProps {
  seoData: SEOData | null;
}

export function SEOPreview({ seoData }: SEOPreviewProps) {
  if (!seoData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SEO Preview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Save the product to generate SEO preview.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">SEO Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="google">
          <TabsList className="mb-4">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="og">Open Graph</TabsTrigger>
            <TabsTrigger value="twitter">Twitter</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
          </TabsList>

          <TabsContent value="google">
            <div className="rounded-lg border p-4 bg-white dark:bg-zinc-950">
              <p className="text-sm text-blue-600 dark:text-blue-400 truncate">
                {seoData.canonical_url}
              </p>
              <p className="text-lg text-blue-800 dark:text-blue-300 font-medium mt-1 line-clamp-1">
                {seoData.meta_title}
              </p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {seoData.meta_description}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="og">
            <div className="rounded-lg border overflow-hidden">
              {seoData.open_graph.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={seoData.open_graph.image}
                  alt=""
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground uppercase">
                  {new URL(seoData.open_graph.url || "https://example.com").hostname}
                </p>
                <p className="font-medium text-sm">{seoData.open_graph.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {seoData.open_graph.description}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="twitter">
            <div className="rounded-lg border p-4">
              <p className="font-medium">{seoData.twitter_card.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {seoData.twitter_card.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Card type: {seoData.twitter_card.card}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="schema">
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
              {JSON.stringify(seoData.schema_json_ld, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
