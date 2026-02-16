"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils/time";
import { Clock, CheckCircle2, ListTodo, FolderOpen } from "lucide-react";

interface StatsCardsProps {
  totalSeconds: number;
  completedTasks: number;
  totalTasks: number;
  totalFolders: number;
}

export function StatsCards({
  totalSeconds,
  completedTasks,
  totalTasks,
  totalFolders,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Time Tracked",
      value: totalSeconds > 0 ? formatDuration(totalSeconds) : "0m",
      icon: Clock,
    },
    {
      title: "Completed Tasks",
      value: completedTasks.toString(),
      icon: CheckCircle2,
    },
    {
      title: "Total Tasks",
      value: totalTasks.toString(),
      icon: ListTodo,
    },
    {
      title: "Folders",
      value: totalFolders.toString(),
      icon: FolderOpen,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
