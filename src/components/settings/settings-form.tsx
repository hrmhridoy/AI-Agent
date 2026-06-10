"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, TestTube } from "lucide-react";

interface SettingsFormProps {
  isAdmin: boolean;
}

export function SettingsForm({ isAdmin }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    aiApiKey: "",
    aiBaseUrl: "https://api.openai.com/v1",
    aiModel: "gpt-4o-mini",
    woocommerceUrl: "",
    woocommerceConsumerKey: "",
    woocommerceConsumerSecret: "",
    wordpressUrl: "",
    wordpressUsername: "",
    wordpressAppPassword: "",
    hasAiKey: false,
    hasWooCommerceKeys: false,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({
            ...prev,
            aiBaseUrl: data.settings.aiBaseUrl || prev.aiBaseUrl,
            aiModel: data.settings.aiModel || prev.aiModel,
            woocommerceUrl: data.settings.woocommerceUrl || "",
            wordpressUrl: data.settings.wordpressUrl || "",
            wordpressUsername: data.settings.wordpressUsername || "",
            hasAiKey: data.settings.hasAiKey,
            hasWooCommerceKeys: data.settings.hasWooCommerceKeys,
          }));
        }
      });
  }, []);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (settings.aiApiKey) payload.aiApiKey = settings.aiApiKey;
      if (settings.aiBaseUrl) payload.aiBaseUrl = settings.aiBaseUrl;
      if (settings.aiModel) payload.aiModel = settings.aiModel;
      if (settings.woocommerceUrl) payload.woocommerceUrl = settings.woocommerceUrl;
      if (settings.woocommerceConsumerKey) payload.woocommerceConsumerKey = settings.woocommerceConsumerKey;
      if (settings.woocommerceConsumerSecret) payload.woocommerceConsumerSecret = settings.woocommerceConsumerSecret;
      if (settings.wordpressUrl) payload.wordpressUrl = settings.wordpressUrl;
      if (settings.wordpressUsername) payload.wordpressUsername = settings.wordpressUsername;
      if (settings.wordpressAppPassword) payload.wordpressAppPassword = settings.wordpressAppPassword;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Save failed");
      toast.success("Settings saved");
      setSettings((prev) => ({
        ...prev,
        aiApiKey: "",
        woocommerceConsumerKey: "",
        woocommerceConsumerSecret: "",
        wordpressAppPassword: "",
        hasAiKey: true,
        hasWooCommerceKeys: true,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (type: "ai" | "woocommerce") => {
    setTesting(type);
    try {
      const endpoint = type === "ai" ? "/api/settings/test-ai" : "/api/settings/test-woocommerce";
      const body =
        type === "ai"
          ? {
              apiKey: settings.aiApiKey || undefined,
              baseUrl: settings.aiBaseUrl,
              model: settings.aiModel,
            }
          : {
              url: settings.woocommerceUrl,
              consumerKey: settings.woocommerceConsumerKey || undefined,
              consumerSecret: settings.woocommerceConsumerSecret || undefined,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) toast.success(data.message);
      else toast.error(data.message || "Connection failed");
    } catch {
      toast.error("Test failed");
    } finally {
      setTesting(null);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Settings are managed by administrators.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="ai">
      <TabsList>
        <TabsTrigger value="ai">AI API</TabsTrigger>
        <TabsTrigger value="woocommerce">WooCommerce</TabsTrigger>
        <TabsTrigger value="wordpress">WordPress</TabsTrigger>
      </TabsList>

      <TabsContent value="ai" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Configuration</CardTitle>
            <CardDescription>Supports any OpenAI-compatible API endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key {settings.hasAiKey && <Badge variant="success" className="ml-2">Configured</Badge>}</Label>
              <Input
                type="password"
                value={settings.aiApiKey}
                onChange={(e) => setSettings({ ...settings, aiApiKey: e.target.value })}
                placeholder={settings.hasAiKey ? "••••••••" : "sk-..."}
              />
            </div>
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={settings.aiBaseUrl}
                onChange={(e) => setSettings({ ...settings, aiBaseUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={settings.aiModel}
                onChange={(e) => setSettings({ ...settings, aiModel: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => testConnection("ai")} disabled={testing === "ai"}>
                <TestTube className="h-4 w-4" />
                {testing === "ai" ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="woocommerce" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">WooCommerce Connection</CardTitle>
            <CardDescription>REST API credentials for publishing external products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Store URL</Label>
              <Input
                value={settings.woocommerceUrl}
                onChange={(e) => setSettings({ ...settings, woocommerceUrl: e.target.value })}
                placeholder="https://yourstore.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Consumer Key {settings.hasWooCommerceKeys && <Badge variant="success" className="ml-2">Configured</Badge>}</Label>
              <Input
                type="password"
                value={settings.woocommerceConsumerKey}
                onChange={(e) => setSettings({ ...settings, woocommerceConsumerKey: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Consumer Secret</Label>
              <Input
                type="password"
                value={settings.woocommerceConsumerSecret}
                onChange={(e) => setSettings({ ...settings, woocommerceConsumerSecret: e.target.value })}
              />
            </div>
            <Button variant="outline" onClick={() => testConnection("woocommerce")} disabled={testing === "woocommerce"}>
              <TestTube className="h-4 w-4" />
              {testing === "woocommerce" ? "Testing..." : "Test Connection"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="wordpress" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">WordPress (Optional)</CardTitle>
            <CardDescription>For publishing generated blog posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>WordPress URL</Label>
              <Input
                value={settings.wordpressUrl}
                onChange={(e) => setSettings({ ...settings, wordpressUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={settings.wordpressUsername}
                onChange={(e) => setSettings({ ...settings, wordpressUsername: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Application Password</Label>
              <Input
                type="password"
                value={settings.wordpressAppPassword}
                onChange={(e) => setSettings({ ...settings, wordpressAppPassword: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </Tabs>
  );
}
