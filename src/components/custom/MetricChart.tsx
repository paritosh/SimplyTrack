
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer // Replaced RechartsPrimitive.ResponsiveContainer
} from "recharts";
import {
  ChartContainer, // Keep this if it's a ShadCN/ui wrapper
  ChartLegendContent,
  ChartConfig,
  ChartStyle // Added ChartStyle
} from "@/components/ui/chart";
import type { DataPoint, Metric } from "@/types";
import { format, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface MetricChartProps {
  metric: Metric;
  data: DataPoint[];
}

type IntervalType = 'raw' | 'daily' | 'monthly' | 'yearly';
type OperationType = 'sum' | 'average' | 'count' | 'min' | 'max';

interface ProcessedDataPoint {
  timestamp: number;
  value: number;
  notes?: string;
  originalDataPointCount?: number;
}

interface AggregationGroup {
  timestamp: number;
  values: number[];
  notesArr: string[];
}

export function MetricChart({ metric, data }: MetricChartProps) {
  const [intervalType, setIntervalType] = useState<IntervalType>('raw');
  const [operationType, setOperationType] = useState<OperationType>('sum');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleIntervalChange = (value: IntervalType) => {
    setIntervalType(value);
    if (value === 'raw') {
      // No specific operation needed for raw
    } else if (value === 'daily') {
      setOperationType('sum');
    } else { // monthly, yearly
      setOperationType('average');
    }
  };

  const processedChartData = useMemo((): ProcessedDataPoint[] => {
    if (!data || data.length === 0) return [];

    const sortedData = data
      .map(dp => ({
        ...dp,
        timestampDate: new Date(dp.timestamp),
      }))
      .sort((a, b) => a.timestampDate.getTime() - b.timestampDate.getTime());

    if (intervalType === 'raw') {
      return sortedData.map(dp => ({
        timestamp: dp.timestampDate.getTime(),
        value: dp.value,
        notes: dp.notes,
        originalDataPointCount: 1,
      }));
    }

    const aggregationMap: Record<string, AggregationGroup> = {};

    sortedData.forEach(dp => {
      let key = '';
      let groupTimestamp: Date;

      if (intervalType === 'daily') {
        key = format(dp.timestampDate, 'yyyy-MM-dd');
        groupTimestamp = startOfDay(dp.timestampDate);
      } else if (intervalType === 'monthly') {
        key = format(dp.timestampDate, 'yyyy-MM');
        groupTimestamp = startOfMonth(dp.timestampDate);
      } else { // yearly
        key = format(dp.timestampDate, 'yyyy');
        groupTimestamp = startOfYear(dp.timestampDate);
      }

      if (!aggregationMap[key]) {
        aggregationMap[key] = {
          timestamp: groupTimestamp.getTime(),
          values: [],
          notesArr: [],
        };
      }
      aggregationMap[key].values.push(dp.value);
      if (dp.notes) aggregationMap[key].notesArr.push(dp.notes);
    });

    return Object.values(aggregationMap).map(group => {
      let aggregatedValue: number;
      const count = group.values.length;
      if (count === 0) return null;

      switch (operationType) {
        case 'sum':
          aggregatedValue = group.values.reduce((acc, val) => acc + val, 0);
          break;
        case 'average':
          aggregatedValue = count > 0 ? group.values.reduce((acc, val) => acc + val, 0) / count : 0;
          break;
        case 'count':
          aggregatedValue = count;
          break;
        case 'min':
          aggregatedValue = Math.min(...group.values);
          break;
        case 'max':
          aggregatedValue = Math.max(...group.values);
          break;
        default:
          aggregatedValue = 0; 
      }
      
      const uniqueNotes = [...new Set(group.notesArr)];
      const notesSummary = uniqueNotes.length > 0 
        ? `${count} entr${count > 1 ? 'ies' : 'y'}. Notes: ${uniqueNotes.slice(0, 2).join('; ')}${uniqueNotes.length > 2 ? '...' : ''}`
        : `${count} entr${count > 1 ? 'ies' : 'y'}`;

      return {
        timestamp: group.timestamp,
        value: aggregatedValue,
        notes: notesSummary,
        originalDataPointCount: count,
      };
    }).filter(Boolean) as ProcessedDataPoint[];
  }, [data, intervalType, operationType]);

  if (!isClient) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center shadow-md">
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center shadow-md">
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground">No data points available for this metric yet.</p>
          <p className="text-sm text-muted-foreground">Add some data to see the chart.</p>
        </CardContent>
      </Card>
    );
  }

  const getOperationLabel = (op: OperationType) => op.charAt(0).toUpperCase() + op.slice(1);
  
  const getChartDisplayLabel = () => {
    if (intervalType === 'raw') {
      return metric.unit || "Value";
    }
    const opLabel = getOperationLabel(operationType);
    if (operationType === 'count') {
      return `${opLabel} of Entries`;
    }
    return `${opLabel} ${metric.unit}`;
  };
  
  // Use a unique key for the chart config to ensure ChartStyle updates
  const chartId = `metric-chart-${metric.id}`;

  const chartConfig = {
    value: { // This key 'value' must match dataKey in <Line />
      label: getChartDisplayLabel(),
      color: metric.color || "hsl(var(--primary))",
    },
  } satisfies ChartConfig;


  const getXAxisTickFormatter = () => {
    switch (intervalType) {
      case 'daily':
        return (unixTime: number) => format(new Date(unixTime), "MMM d, yy");
      case 'monthly':
        return (unixTime: number) => format(new Date(unixTime), "MMM yyyy");
      case 'yearly':
        return (unixTime: number) => format(new Date(unixTime), "yyyy");
      case 'raw':
      default:
        return (unixTime: number) => format(new Date(unixTime), "MMM d, yy p");
    }
  };

  const getTooltipDateFormat = (label: number) => {
     switch (intervalType) {
      case 'daily':
        return format(new Date(label), "PPP"); 
      case 'monthly':
        return format(new Date(label), "MMMM yyyy");
      case 'yearly':
        return format(new Date(label), "yyyy");
      case 'raw':
      default:
        return format(new Date(label), "PPP p");
    }
  };
  
  const getTooltipValuePrefix = () => {
    if (intervalType === 'raw') return "";
    return `${getOperationLabel(operationType)} `;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>{metric.name} Trend</CardTitle>
          <CardDescription>Unit: {metric.unit}</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="interval-select" className="text-xs text-muted-foreground">Interval</Label>
            <Select value={intervalType} onValueChange={handleIntervalChange}>
              <SelectTrigger id="interval-select" className="w-full sm:w-[150px]">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="raw">Raw Data</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
             <Label htmlFor="operation-select" className="text-xs text-muted-foreground">Operation</Label>
            <Select value={operationType} onValueChange={(value: OperationType) => setOperationType(value)} disabled={intervalType === 'raw'}>
              <SelectTrigger id="operation-select" className="w-full sm:w-[150px]">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sum">Sum</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="min">Min</SelectItem>
                <SelectItem value="max">Max</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {processedChartData.length === 0 && intervalType !== 'raw' ? (
            <div className="h-[400px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">Not enough data to display {intervalType} {operationType} aggregation.</p>
            </div>
        ) : (
        <ChartContainer config={chartConfig} className="h-[400px] w-full" id={chartId}>
          {/* ChartStyle is now managed by ChartContainer if it's a custom component, or ensure it's applied correctly */}
          <ResponsiveContainer>
            <LineChart
              data={processedChartData}
              margin={{ top: 5, right: 30, left: 5, bottom: 20 }} // Increased bottom margin for XAxis labels
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={getXAxisTickFormatter()}
                stroke="hsl(var(--muted-foreground))"
                tickMargin={10}
                interval={processedChartData.length > 30 && intervalType === 'raw' ? 'preserveStartEnd' : undefined}
                minTickGap={intervalType === 'raw' ? 80 : (intervalType === 'daily' ? 40 : 20)}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tickMargin={10}
                domain={['auto', 'auto']}
                allowDataOverflow={true}
                label={{ 
                  value: operationType === 'count' && intervalType !== 'raw' ? 'Count of Entries' : metric.unit, 
                  angle: -90, 
                  position: 'insideLeft', 
                  offset: -5,
                  style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && typeof label === 'number') {
                    const dataPoint = payload[0].payload as ProcessedDataPoint;
                    const value = dataPoint.value;
                    
                    let formattedValue: string;
                    let displayUnit: string;

                    if (intervalType !== 'raw' && operationType === 'count') {
                      formattedValue = Number(value).toLocaleString();
                      displayUnit = value === 1 ? 'entry' : 'entries';
                    } else {
                      formattedValue = Number(value).toLocaleString(undefined, { 
                        maximumFractionDigits: 2, 
                        minimumFractionDigits: (value % 1 !== 0 && (operationType === 'average' || intervalType === 'raw')) ? 2 : 0 
                      });
                      displayUnit = metric.unit;
                    }

                    return (
                      <div className="rounded-lg border bg-background p-2.5 shadow-sm max-w-xs">
                        <div className="grid grid-cols-1 gap-1.5">
                          <span className="text-sm font-medium">
                            {getTooltipDateFormat(label)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {getTooltipValuePrefix()}{metric.name}: <span className="font-bold text-foreground">{formattedValue} {displayUnit}</span>
                          </span>
                          {intervalType !== 'raw' && dataPoint.originalDataPointCount && (
                              <span className="text-xs text-muted-foreground">
                                  (Based on {dataPoint.originalDataPointCount} data point{dataPoint.originalDataPointCount !== 1 ? 's' : ''})
                              </span>
                          )}
                          {intervalType === 'raw' && dataPoint.notes && (
                             <span className="text-xs text-muted-foreground italic border-t pt-1 mt-1 break-words">
                               Note: {dataPoint.notes}
                             </span>
                          )}
                           {intervalType !== 'raw' && dataPoint.notes && ( 
                             <span className="text-xs text-muted-foreground italic border-t pt-1 mt-1 break-words">
                               Notes summary: {dataPoint.notes}
                             </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend content={<ChartLegendContent />} verticalAlign="top" />
              <Line
                type="monotone"
                dataKey="value" // This must match the key in chartConfig (e.g., chartConfig.value)
                stroke="var(--color-value)" // Uses the color defined in chartConfig through ChartStyle
                strokeWidth={2}
                dot={{
                  r: processedChartData.length < 50 || intervalType !== 'raw' ? 4 : 2,
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
          </ResponsiveContainer>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
