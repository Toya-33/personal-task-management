"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils/time";
import { Clock, CheckCircle2, ListChecks } from "lucide-react";

interface TaskCount {
  completed: number;
  total: number;
}

interface StatsCardsProps {
  totalSeconds: number;
  mainTasks: TaskCount;
  subTasks: TaskCount;
}

export function StatsCards({
  totalSeconds,
  mainTasks,
  subTasks,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Time Tracked",
      value: totalSeconds > 0 ? formatDuration(totalSeconds) : "0m",
      icon: Clock,
    },
    {
      title: "Main Tasks",
      value: `${mainTasks.completed}/${mainTasks.total}`,
      icon: CheckCircle2,
    },
    {
      title: "Sub-tasks",
      value: `${subTasks.completed}/${subTasks.total}`,
      icon: ListChecks,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
