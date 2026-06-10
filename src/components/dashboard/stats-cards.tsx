"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileEdit, CheckCircle, Download } from "lucide-react";

interface StatsCardsProps {
  stats: {
    total: number;
    draft: number;
    published: number;
    todayImports: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { title: "Total Products", value: stats.total, icon: Package },
    { title: "Drafts", value: stats.draft, icon: FileEdit },
    { title: "Published", value: stats.published, icon: CheckCircle },
    { title: "Today's Imports", value: stats.todayImports, icon: Download },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
