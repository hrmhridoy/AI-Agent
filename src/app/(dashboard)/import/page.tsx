import { ImportForm } from "@/components/import/import-form";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Products</h1>
        <p className="text-muted-foreground">
          Import products from external websites with AI-powered content optimization
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
