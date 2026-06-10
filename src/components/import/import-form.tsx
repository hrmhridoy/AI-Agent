"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Link2, FileUp } from "lucide-react";

interface ImportJob {
  id: string;
  sourceUrl: string;
  status: string;
  error?: string | null;
  createdAt: string;
}

export function ImportForm() {
  const [singleUrl, setSingleUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<ImportJob[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/import");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    // SSE for live updates (Vercel-compatible alternative to WebSockets)
    const eventSource = new EventSource("/api/import/stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "jobs") setJobs(data.jobs);
      } catch {
        // ignore
      }
    };
    return () => eventSource.close();
  }, [fetchJobs]);

  const handleSingleImport = async () => {
    if (!singleUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: singleUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Import failed");
      toast.success("Import started!");
      setSingleUrl("");
      fetchJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    const urls = bulkUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (urls.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Import failed");
      toast.success(`${urls.length} imports queued!`);
      setBulkUrls("");
      fetchJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const urls = text
      .split("\n")
      .slice(1) // skip header
      .map((line) => line.split(",")[0]?.trim())
      .filter((u) => u?.startsWith("http"));
    if (urls.length === 0) {
      toast.error("No valid URLs found in CSV");
      return;
    }
    setBulkUrls(urls.join("\n"));
    toast.success(`Loaded ${urls.length} URLs from CSV`);
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED": return "success" as const;
      case "FAILED": return "destructive" as const;
      case "PROCESSING": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  const completed = jobs.filter((j) => j.status === "COMPLETED").length;
  const total = jobs.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" />
              Single URL Import
            </CardTitle>
            <CardDescription>Extract product data from a single URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product URL</Label>
              <Input
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://example.com/product"
              />
            </div>
            <Button onClick={handleSingleImport} disabled={loading || !singleUrl.trim()} className="w-full">
              <Upload className="h-4 w-4" />
              Extract Product
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileUp className="h-4 w-4" />
              Bulk URL Import
            </CardTitle>
            <CardDescription>One URL per line (max 100)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder={"https://example.com/product-1\nhttps://example.com/product-2"}
              rows={5}
            />
            <div className="flex gap-2">
              <Button onClick={handleBulkImport} disabled={loading || !bulkUrls.trim()} className="flex-1">
                Start Bulk Import
              </Button>
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Import Queue</CardTitle>
            <Progress value={progress} className="mt-2" />
            <CardDescription>{completed} of {total} completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-auto">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{job.sourceUrl}</p>
                    {job.error && <p className="text-xs text-destructive">{job.error}</p>}
                  </div>
                  <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
