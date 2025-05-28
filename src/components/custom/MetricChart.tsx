"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import type { DataPoint, Metric } from "@/types";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricChartProps {
  metric: Metric;
  data: DataPoint[];
}

export function MetricChart({ metric, data }: MetricChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground">No data points available for this metric yet.</p>
          <p className="text-sm text-muted-foreground">Add some data to see the chart.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    .map(dp => ({
      timestamp: new Date(dp.timestamp).getTime(),
      value: dp.value,
      notes: dp.notes,
    }))
    .sort((a, b) => a.timestamp - b.timestamp); // Ensure data is sorted by time

  const chartConfig = {
    value: {
      label: metric.unit || "Value",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{metric.name} Trend</CardTitle>
        <CardDescription>Unit: {metric.unit}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(unixTime) => format(new Date(unixTime), "MMM d, yy")}
              stroke="hsl(var(--muted-foreground))"
              tickMargin={10}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tickMargin={10}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length && typeof label === 'number') {
                  const dataPoint = payload[0].payload as { value: number; notes?: string };
                  return (
                    <div className="rounded-lg border bg-background p-2.5 shadow-sm">
                      <div className="grid grid-cols-1 gap-1.5">
                        <span className="text-sm font-medium">
                          {format(new Date(label), "PPP p")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {metric.name}: <span className="font-bold text-foreground">{dataPoint.value} {metric.unit}</span>
                        </span>
                        {dataPoint.notes && (
                           <span className="text-xs text-muted-foreground italic border-t pt-1 mt-1">
                             Note: {dataPoint.notes}
                           </span>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{
                r: 4,
                fill: "var(--color-value)",
                strokeWidth: 2,
                stroke: "hsl(var(--background))"
              }}
              activeDot={{
                r: 6,
                fill: "var(--color-value)",
                strokeWidth: 2,
                stroke: "hsl(var(--background))"
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
