"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/products/rich-text-editor";
import { SEOPreview } from "@/components/products/seo-preview";
import { Save, Upload, FileText, X, Plus } from "lucide-react";
import type { ProductImage, SEOData } from "@/types";
import Image from "next/image";

interface ProductEditorProps {
  product: {
    id: string;
    title: string | null;
    price: string | null;
    currency: string | null;
    category: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    shortDescription: string | null;
    fullDescription: string | null;
    affiliateUrl: string | null;
    tags: string[];
    specifications: Array<{ name: string; value: string }>;
    images: ProductImage[];
    seoData: SEOData | null;
    status: string;
  };
}

export function ProductEditor({ product }: ProductEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [newTag, setNewTag] = useState("");

  const [form, setForm] = useState({
    title: product.title || "",
    price: product.price || "",
    currency: product.currency || "USD",
    category: product.category || "",
    seoTitle: product.seoTitle || "",
    seoDescription: product.seoDescription || "",
    shortDescription: product.shortDescription || "",
    fullDescription: product.fullDescription || "",
    affiliateUrl: product.affiliateUrl || "",
    tags: product.tags || [],
    specifications: (product.specifications as Array<{ name: string; value: string }>) || [],
    images: (product.images as ProductImage[]) || [],
    seoData: product.seoData as SEOData | null,
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Save failed");
      if (data.product?.seoData) updateField("seoData", data.product.seoData);
      toast.success("Product saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (schedule = false) => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/products/${product.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule && scheduledAt ? { scheduledAt } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || "Published!");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateBlog = async () => {
    setGeneratingBlog(true);
    try {
      const res = await fetch(`/api/products/${product.id}/blog`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Blog post generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Blog generation failed");
    } finally {
      setGeneratingBlog(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim() || form.tags.length >= 20) return;
    updateField("tags", [...form.tags, newTag.trim()]);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", form.tags.filter((t) => t !== tag));
  };

  const updateSpec = (index: number, field: "name" | "value", value: string) => {
    const specs = [...form.specifications];
    specs[index] = { ...specs[index], [field]: value };
    updateField("specifications", specs);
  };

  const addSpec = () => {
    updateField("specifications", [...form.specifications, { name: "", value: "" }]);
  };

  const removeSpec = (index: number) => {
    updateField("specifications", form.specifications.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">Status: {product.status}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateBlog} disabled={generatingBlog}>
            <FileText className="h-4 w-4" />
            {generatingBlog ? "Generating..." : "Generate Blog Post"}
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button onClick={() => handlePublish(false)} disabled={publishing}>
            <Upload className="h-4 w-4" />
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="basic">
            <TabsList>
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input value={form.price} onChange={(e) => updateField("price", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Input value={form.currency} onChange={(e) => updateField("currency", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={form.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      placeholder="Pet Products > Dog Food"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea
                      value={form.shortDescription}
                      onChange={(e) => updateField("shortDescription", e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input value={form.seoTitle} onChange={(e) => updateField("seoTitle", e.target.value)} />
                    <p className="text-xs text-muted-foreground">{form.seoTitle.length}/60 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Meta Description</Label>
                    <Textarea
                      value={form.seoDescription}
                      onChange={(e) => updateField("seoDescription", e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{form.seoDescription.length}/160 characters</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <RichTextEditor
                    content={form.fullDescription}
                    onChange={(html) => updateField("fullDescription", html)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {form.images.map((img, i) => (
                      <div key={i} className="space-y-2">
                        <div className="relative aspect-square rounded-lg overflow-hidden border">
                          <Image src={img.url} alt={img.alt_text} fill className="object-cover" />
                        </div>
                        <Input
                          value={img.alt_text}
                          onChange={(e) => {
                            const images = [...form.images];
                            images[i] = { ...images[i], alt_text: e.target.value };
                            updateField("images", images);
                          }}
                          placeholder="Alt text"
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  {form.images.length === 0 && (
                    <p className="text-sm text-muted-foreground">No images stored yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag} disabled={form.tags.length >= 20}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{form.tags.length}/20 tags</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="affiliate" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Affiliate URL</Label>
                    <Input
                      value={form.affiliateUrl}
                      onChange={(e) => updateField("affiliateUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Specifications</CardTitle>
                  <Button variant="outline" size="sm" onClick={addSpec}>
                    <Plus className="h-4 w-4" /> Add Row
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {form.specifications.map((spec, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={spec.name}
                        onChange={(e) => updateSpec(i, "name", e.target.value)}
                        placeholder="Name"
                      />
                      <Input
                        value={spec.value}
                        onChange={(e) => updateSpec(i, "value", e.target.value)}
                        placeholder="Value"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeSpec(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <SEOPreview seoData={form.seoData} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Scheduled Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handlePublish(true)}
                disabled={!scheduledAt || publishing}
              >
                Schedule Publish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
