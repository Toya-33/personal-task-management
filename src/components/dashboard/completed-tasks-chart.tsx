"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletedTasksChartProps {
  completed: number;
  pending: number;
}

const COLORS = ["#22c55e", "#eab308"];

export function CompletedTasksChart({
  completed,
  pending,
}: CompletedTasksChartProps) {
  const data = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];

  const total = completed + pending;

  return (
    <Card className="lg:max-w-md">
      <CardHeader>
        <CardTitle className="text-base">Task Completion</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No tasks yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
