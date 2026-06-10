import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { ProductStatus } from "@prisma/client";
import { format, subDays, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Import } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = startOfDay(new Date());

  const [total, draft, published, todayImports, recentProducts] = await Promise.all([
    prisma.product.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id, status: ProductStatus.DRAFT } }),
    prisma.product.count({ where: { userId: user.id, status: ProductStatus.PUBLISHED } }),
    prisma.importJob.count({
      where: { userId: user.id, createdAt: { gte: today } },
    }),
    prisma.product.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true },
    }),
  ]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, "MMM d");
  });

  const importCounts = await Promise.all(
    last7Days.map(async (dateLabel, i) => {
      const dayStart = startOfDay(subDays(new Date(), 6 - i));
      const dayEnd = startOfDay(subDays(new Date(), 5 - i));
      const count = await prisma.importJob.count({
        where: {
          userId: user.id,
          createdAt: { gte: dayStart, lt: i === 6 ? new Date() : dayEnd },
        },
      });
      return { date: dateLabel, count };
    })
  );

  const statusData = [
    { status: "Draft", count: draft },
    { status: "Published", count: published },
    {
      status: "Failed",
      count: await prisma.product.count({
        where: { userId: user.id, status: ProductStatus.FAILED },
      }),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>
        <Button asChild>
          <Link href="/import">
            <Import className="h-4 w-4" />
            New Import
          </Link>
        </Button>
      </div>

      <StatsCards stats={{ total, draft, published, todayImports }} />
      <DashboardCharts importData={importCounts} statusData={statusData} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Products</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet. Start importing!</p>
          ) : (
            <div className="space-y-2">
              {recentProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{p.title || "Untitled"}</span>
                  <span className="text-xs text-muted-foreground">{p.status}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
