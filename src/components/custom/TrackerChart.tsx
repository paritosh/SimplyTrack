
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Label as RechartsLabel, // Alias to avoid conflict with ShadCN Label
} from "recharts";
import {
  ChartContainer,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import type { DataPoint, Tracker } from "@/types";
import { format, startOfDay, startOfMonth, startOfYear, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label'; // ShadCN Label

interface TrackerChartProps {
  tracker: Tracker;
  data: DataPoint[];
}

type IntervalType = 'raw' | 'daily' | 'monthly' | 'yearly';
type OperationType = 'sum' | 'average' | 'count' | 'min' | 'max';

interface ProcessedDataPoint {
  timestamp: number; // Unix timestamp for XAxis
  value: number;
  notes?: string;
  originalDataPointCount?: number; // For aggregated points
  dateLabel: string; // Formatted date string for display
}

interface AggregationGroup {
  timestamp: number;
  values: number[];
  notesArr: string[];
  dateLabel: string;
}

export function TrackerChart({ tracker, data }: TrackerChartProps) {
  const trackerType = tracker.type || 'value';
  const [intervalType, setIntervalType] = useState<IntervalType>('raw');
  const [operationType, setOperationType] = useState<OperationType>(trackerType === 'event' ? 'count' : 'sum');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (trackerType === 'event') {
      setOperationType('count');
    } else {
      if (intervalType === 'raw') {
        // For raw value data, no specific operation is 'applied' by default, it just shows values
      } else if (intervalType === 'daily') {
        setOperationType('sum');
      } else { 
        setOperationType('average');
      }
    }
  }, [trackerType, intervalType]);


  const handleIntervalChange = (value: IntervalType) => {
    setIntervalType(value);
  };

  const processedChartData = useMemo((): ProcessedDataPoint[] => {
    if (!data || data.length === 0) return [];

    const sortedData = data
      .map(dp => ({
        ...dp,
        timestampDate: parseISO(dp.timestamp),
      }))
      .sort((a, b) => a.timestampDate.getTime() - b.timestampDate.getTime());

    if (intervalType === 'raw') {
      return sortedData.map(dp => ({
        timestamp: dp.timestampDate.getTime(),
        value: trackerType === 'event' ? 1 : dp.value, 
        notes: dp.notes,
        originalDataPointCount: 1,
        dateLabel: format(dp.timestampDate, "MMM d, yy p"),
      }));
    }

    const aggregationMap: Record<string, AggregationGroup> = {};

    sortedData.forEach(dp => {
      let key = '';
      let groupTimestamp: Date;
      let dateLabelFormat = '';

      if (intervalType === 'daily') {
        key = format(dp.timestampDate, 'yyyy-MM-dd');
        groupTimestamp = startOfDay(dp.timestampDate);
        dateLabelFormat = "MMM d, yyyy";
      } else if (intervalType === 'monthly') {
        key = format(dp.timestampDate, 'yyyy-MM');
        groupTimestamp = startOfMonth(dp.timestampDate);
        dateLabelFormat = "MMM yyyy";
      } else { // yearly
        key = format(dp.timestampDate, 'yyyy');
        groupTimestamp = startOfYear(dp.timestampDate);
        dateLabelFormat = "yyyy";
      }

      if (!aggregationMap[key]) {
        aggregationMap[key] = {
          timestamp: groupTimestamp.getTime(),
          values: [],
          notesArr: [],
          dateLabel: format(groupTimestamp, dateLabelFormat),
        };
      }
      aggregationMap[key].values.push(trackerType === 'event' ? 1 : dp.value);
      if (dp.notes) aggregationMap[key].notesArr.push(dp.notes);
    });

    return Object.values(aggregationMap).map(group => {
      let aggregatedValue: number;
      const count = group.values.length;
      if (count === 0) return null; 

      let currentOperation = operationType;
      if (trackerType === 'event' && intervalType !== 'raw') {
        currentOperation = 'count'; 
      }


      switch (currentOperation) {
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
          aggregatedValue = trackerType === 'event' ? count : group.values.reduce((acc, val) => acc + val, 0); 
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
        dateLabel: group.dateLabel,
      };
    }).filter(Boolean) as ProcessedDataPoint[];
  }, [data, intervalType, operationType, trackerType, tracker.unit]);

  if (!isClient) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center shadow-md">
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    );
  }
  
  const noDataMessage = trackerType === 'event' 
    ? "No events logged for this tracker yet." 
    : "No data points available for this tracker yet.";
  const addDataPrompt = trackerType === 'event' 
    ? "Log an event to see the chart." 
    : "Add some data to see the chart.";

  if (!data || data.length === 0) {
    return (
      <Card className="w-full h-[400px] flex items-center justify-center shadow-md">
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground">{noDataMessage}</p>
          <p className="text-sm text-muted-foreground">{addDataPrompt}</p>
        </CardContent>
      </Card>
    );
  }
  
  const getChartDisplayLabel = () => {
    if (trackerType === 'event') {
      return intervalType === 'raw' ? "Event Logged" : "Count of Events";
    }
    if (intervalType === 'raw') {
      return tracker.unit || "Value";
    }
    const opLabel = operationType.charAt(0).toUpperCase() + operationType.slice(1);
    if (operationType === 'count') {
      return `${opLabel} of Entries`;
    }
    return `${opLabel} ${tracker.unit}`;
  };
  
  const chartId = `tracker-chart-${tracker.id}-${trackerType}-${intervalType}`;

  const chartConfig = {
    value: { 
      label: getChartDisplayLabel(),
      color: tracker.color || "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const yAxisLabelValue = (trackerType === 'event' && (intervalType === 'raw' || operationType === 'count'))
    ? (intervalType === 'raw' ? '' : 'Count') // No Y-axis label for raw event scatter
    : tracker.unit;


  const getXAxisTickFormatter = () => (unixTime: number) => {
    const point = processedChartData.find(p => p.timestamp === unixTime);
    return point ? point.dateLabel : format(new Date(unixTime), "MMM d");
  };

  const getTooltipDateFormat = (labelTimestamp: number) => {
    const point = processedChartData.find(p => p.timestamp === labelTimestamp);
    if (point) return point.dateLabel;
     switch (intervalType) {
      case 'daily': return format(new Date(labelTimestamp), "PPP"); 
      case 'monthly': return format(new Date(labelTimestamp), "MMMM yyyy");
      case 'yearly': return format(new Date(labelTimestamp), "yyyy");
      case 'raw': default: return format(new Date(labelTimestamp), "PPP p");
    }
  };
  
  const isRawEventChart = trackerType === 'event' && intervalType === 'raw';
  const ChartComponent = isRawEventChart ? ScatterChart : (trackerType === 'event' && intervalType !== 'raw' ? BarChart : LineChart);
  const ChartSeriesComponent = isRawEventChart ? Scatter : (trackerType === 'event' && intervalType !== 'raw' ? Bar : Line);

  let yAxisProps: any = {
    stroke: "hsl(var(--muted-foreground))",
    tickMargin: 10,
    domain: ['auto', 'auto'],
    allowDataOverflow: true,
    label: yAxisLabelValue ? { 
      value: yAxisLabelValue, 
      angle: -90, 
      position: 'insideLeft', 
      offset: -5,
      style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }
    } : undefined,
  };

  if (isRawEventChart) {
    yAxisProps = {
      ...yAxisProps,
      type: "number",
      domain: [0, 2], // Simple domain for scatter points
      ticks: [1], // Only show tick at 1
      tickFormatter: () => '', // Hide Y-axis tick labels
      axisLine: false, // Hide Y-axis line
      tickLine: false, // Hide Y-axis tick lines
      label: undefined, // No Y-axis label for raw event scatter
      width: 10 // Minimal width for hidden Y axis
    };
  }


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <CardTitle>{tracker.name} Trend</CardTitle>
          <CardDescription>
            {trackerType === 'value' ? `Unit: ${tracker.unit}` : 'Type: Event Tracker'}
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${chartId}-interval-select`} className="text-xs text-muted-foreground">Interval</Label>
            <Select value={intervalType} onValueChange={handleIntervalChange}>
              <SelectTrigger id={`${chartId}-interval-select`} className="w-full sm:w-[150px]">
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
          {trackerType === 'value' && intervalType !== 'raw' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${chartId}-operation-select`} className="text-xs text-muted-foreground">Operation</Label>
              <Select 
                value={operationType} 
                onValueChange={(value: OperationType) => setOperationType(value)} 
                disabled={intervalType === 'raw' || trackerType === 'event'}
              >
                <SelectTrigger id={`${chartId}-operation-select`} className="w-full sm:w-[150px]">
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
          )}
        </div>
      </CardHeader>
      <CardContent>
        {processedChartData.length === 0 && intervalType !== 'raw' ? (
            <div className="h-[400px] w-full flex items-center justify-center">
                <p className="text-muted-foreground">Not enough data to display {intervalType} {operationType} aggregation.</p>
            </div>
        ) : (
        <ChartContainer config={chartConfig} className="h-[400px] w-full" id={chartId}>
          <ResponsiveContainer>
            <ChartComponent
              data={processedChartData}
              margin={{ top: 5, right: 30, left: isRawEventChart ? -25 : 5, bottom: 20 }} // Adjust left margin for hidden Y axis
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
              <YAxis {...yAxisProps} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && typeof label === 'number') {
                    const dataPoint = payload[0].payload as ProcessedDataPoint;
                    const value = dataPoint.value;
                    
                    let formattedValue: string;
                    let displayUnit: string = "";

                    if (trackerType === 'event') {
                      if (intervalType === 'raw') {
                        formattedValue = "Logged"; // For scatter plot, value is 1
                        // displayUnit is already set to empty string
                      } else { // Aggregated event data (count)
                        formattedValue = Number(value).toLocaleString();
                        displayUnit = value === 1 ? 'event' : 'events';
                      }
                    } else { // Value-based tracker
                      if (intervalType !== 'raw' && operationType === 'count') {
                        formattedValue = Number(value).toLocaleString();
                        displayUnit = value === 1 ? 'entry' : 'entries';
                      } else {
                        formattedValue = Number(value).toLocaleString(undefined, { 
                          maximumFractionDigits: 2, 
                          minimumFractionDigits: (value % 1 !== 0 && (operationType === 'average' || intervalType === 'raw')) ? 2 : 0 
                        });
                        displayUnit = tracker.unit;
                      }
                    }

                    return (
                      <div className="rounded-lg border bg-background p-2.5 shadow-sm max-w-xs">
                        <div className="grid grid-cols-1 gap-1.5">
                          <span className="text-sm font-medium">
                            {getTooltipDateFormat(label)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {tracker.name}: <span className="font-bold text-foreground">{formattedValue} {displayUnit}</span>
                          </span>
                          {intervalType !== 'raw' && dataPoint.originalDataPointCount && (
                              <span className="text-xs text-muted-foreground">
                                  (Based on {dataPoint.originalDataPointCount} data point{dataPoint.originalDataPointCount !== 1 ? 's' : ''})
                              </span>
                          )}
                          {dataPoint.notes && ( // Show notes for both raw and aggregated if available
                             <span className="text-xs text-muted-foreground italic border-t pt-1 mt-1 break-words">
                               {intervalType === 'raw' ? "Note: " : "Notes summary: "}{dataPoint.notes}
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
              
              {isRawEventChart ? (
                <ChartSeriesComponent
                  dataKey="value" 
                  name={chartConfig.value.label}
                  fill="var(--color-value)"
                  shape="square"
                  size={100} // Adjust size of the square, this might need tweaking based on data density
                />
              ) : ChartSeriesComponent === Bar ? (
                 <ChartSeriesComponent
                    dataKey="value"
                    name={chartConfig.value.label}
                    fill="var(--color-value)"
                    barSize={intervalType === 'daily' ? 20 : undefined} // Adjust bar size for daily view
                 />
              ) : ( // Line chart
                <ChartSeriesComponent
                  type="monotone"
                  dataKey="value" 
                  name={chartConfig.value.label}
                  stroke="var(--color-value)"
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
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

