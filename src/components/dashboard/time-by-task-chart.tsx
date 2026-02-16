"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeByTaskChartProps {
  data: { name: string; seconds: number; color: string }[];
}

export function TimeByTaskChart({ data }: TimeByTaskChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    hours: Math.round((d.seconds / 3600) * 100) / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Time by Task</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No time tracked yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" unit="h" />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [`${value}h`, "Time"]}
              />
              <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
