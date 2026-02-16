"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type Period = "day" | "week" | "month";

interface PeriodSelectorProps {
  period: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <Tabs value={period} onValueChange={(v) => onChange(v as Period)}>
      <TabsList>
        <TabsTrigger value="day">Today</TabsTrigger>
        <TabsTrigger value="week">This Week</TabsTrigger>
        <TabsTrigger value="month">This Month</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
