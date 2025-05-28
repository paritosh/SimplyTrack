"use client";

import React, { useState, useMemo } from 'react';
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
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import type { DataPoint, Metric } from "@/types";
import { format, startOfDay, startOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MetricChartProps {
  metric: Metric;
  data: DataPoint[];
}

type AggregationType = 'raw' | 'daily' | 'monthly';

interface ProcessedDataPoint {
  timestamp: number;
  value: number;
  notes?: string;
  count?: number; // For aggregated data
}

export function MetricChart({ metric, data }: MetricChartProps) {
  const [aggregationType, setAggregationType] = useState<AggregationType>('raw');

  const processedChartData = useMemo((): ProcessedDataPoint[] => {
    if (!data || data.length === 0) return [];

    const sortedData = data
      .map(dp => ({
        ...dp,
        timestampDate: new Date(dp.timestamp),
      }))
      .sort((a, b) => a.timestampDate.getTime() - b.timestampDate.getTime());

    if (aggregationType === 'raw') {
      return sortedData.map(dp => ({
        timestamp: dp.timestampDate.getTime(),
        value: dp.value,
        notes: dp.notes,
      }));
    }

    if (aggregationType === 'daily') {
      const dailyMap: Record<string, { timestamp: number; totalValue: number; count: number; notesArr: string[] }> = {};
      sortedData.forEach(dp => {
        const dayKey = format(dp.timestampDate, 'yyyy-MM-dd');
        if (!dailyMap[dayKey]) {
          dailyMap[dayKey] = {
            timestamp: startOfDay(dp.timestampDate).getTime(),
            totalValue: 0,
            count: 0,
            notesArr: [],
          };
        }
        dailyMap[dayKey].totalValue += dp.value;
        dailyMap[dayKey].count += 1;
        if (dp.notes) dailyMap[dayKey].notesArr.push(dp.notes);
      });
      return Object.values(dailyMap).map(agg => ({
        timestamp: agg.timestamp,
        value: agg.totalValue, // Sum for daily
        notes: agg.notesArr.length > 0 ? `${agg.count} entries. Notes: ${agg.notesArr.slice(0, 2).join('; ')}${agg.notesArr.length > 2 ? '...' : ''}` : `${agg.count} entries`,
        count: agg.count,
      }));
    }

    if (aggregationType === 'monthly') {
      const monthlyMap: Record<string, { timestamp: number; totalValue: number; count: number; notesArr: string[] }> = {};
      sortedData.forEach(dp => {
        const monthKey = format(dp.timestampDate, 'yyyy-MM');
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            timestamp: startOfMonth(dp.timestampDate).getTime(),
            totalValue: 0,
            count: 0,
            notesArr: [],
          };
        }
        monthlyMap[monthKey].totalValue += dp.value;
        monthlyMap[monthKey].count += 1;
        if (dp.notes) monthlyMap[monthKey].notesArr.push(dp.notes);
      });
      return Object.values(monthlyMap).map(agg => ({
        timestamp: agg.timestamp,
        value: agg.count > 0 ? agg.totalValue / agg.count : 0, // Average for monthly
        notes: agg.notesArr.length > 0 ? `Avg over ${agg.count} entries. Notes: ${agg.notesArr.slice(0, 2).join('; ')}${agg.notesArr.length > 2 ? '...' : ''}` : `Avg over ${agg.count} entries`,
        count: agg.count,
      }));
    }
    return [];
  }, [data, aggregationType]);

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
  
  const chartConfig = {
    value: {
      label: aggregationType === 'daily' ? `Total ${metric.unit}` : aggregationType === 'monthly' ? `Avg. ${metric.unit}` : metric.unit || "Value",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const getXAxisTickFormatter = () => {
    switch (aggregationType) {
      case 'daily':
        return (unixTime: number) => format(new Date(unixTime), "MMM d, yy");
      case 'monthly':
        return (unixTime: number) => format(new Date(unixTime), "MMM yyyy");
      case 'raw':
      default:
        return (unixTime: number) => format(new Date(unixTime), "MMM d, yy 'at' p");
    }
  };

  const getTooltipDateFormat = (label: number) => {
    switch (aggregationType) {
      case 'daily':
        return format(new Date(label), "PPP"); // e.g. Jan 1, 2024
      case 'monthly':
        return format(new Date(label), "MMMM yyyy"); // e.g. January 2024
      case 'raw':
      default:
        return format(new Date(label), "PPP p"); // e.g. Jan 1, 2024, 12:00 PM
    }
  };

  const getTooltipValuePrefix = () => {
    switch (aggregationType) {
      case 'daily':
        return "Total ";
      case 'monthly':
        return "Average ";
      case 'raw':
      default:
        return "";
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <CardTitle>{metric.name} Trend</CardTitle>
          <CardDescription>Unit: {metric.unit}</CardDescription>
        </div>
        <div className="w-full sm:w-auto">
          <Select value={aggregationType} onValueChange={(value: AggregationType) => setAggregationType(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Aggregate by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw">Raw Data</SelectItem>
              <SelectItem value="daily">Daily Total</SelectItem>
              <SelectItem value="monthly">Monthly Average</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {processedChartData.length === 0 && aggregationType !== 'raw' ? (
            <div className="h-[400px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">Not enough data to display {aggregationType} aggregation.</p>
            </div>
        ) : (
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <LineChart
            data={processedChartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={getXAxisTickFormatter()}
              stroke="hsl(var(--muted-foreground))"
              tickMargin={10}
              interval={processedChartData.length > 30 && aggregationType === 'raw' ? 'preserveStartEnd' : undefined}
              minTickGap={aggregationType === 'raw' ? 80 : 20}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tickMargin={10}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length && typeof label === 'number') {
                  const dataPoint = payload[0].payload as ProcessedDataPoint;
                  return (
                    <div className="rounded-lg border bg-background p-2.5 shadow-sm max-w-xs">
                      <div className="grid grid-cols-1 gap-1.5">
                        <span className="text-sm font-medium">
                          {getTooltipDateFormat(label)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {getTooltipValuePrefix()}{metric.name}: <span className="font-bold text-foreground">{Number(dataPoint.value).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: (dataPoint.value % 1 !== 0 && aggregationType === 'monthly') ? 2 : 0 })} {metric.unit}</span>
                        </span>
                        {aggregationType !== 'raw' && dataPoint.count && (
                            <span className="text-xs text-muted-foreground">
                                (Based on {dataPoint.count} data point{dataPoint.count > 1 ? 's' : ''})
                            </span>
                        )}
                        {dataPoint.notes && (
                           <span className="text-xs text-muted-foreground italic border-t pt-1 mt-1 break-words">
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
                r: processedChartData.length < 50 || aggregationType !== 'raw' ? 4 : 2,
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
        )}
      </CardContent>
    </Card>
  );
}
