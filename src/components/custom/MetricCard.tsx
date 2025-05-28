
"use client";

import Link from "next/link";
import { BarChartHorizontalBig, Edit, Trash2, PlusSquare, MoreHorizontal, Pin, PinOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Metric } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  metric: Metric;
  onAddDataPoint: (metricId: string) => void;
  onEditMetric: (metric: Metric) => void;
  onDeleteMetric: (metricId: string) => void;
  onTogglePin: (metricId: string) => void;
}

export function MetricCard({ metric, onAddDataPoint, onEditMetric, onDeleteMetric, onTogglePin }: MetricCardProps) {
  const metricColorStyle = metric.color ? { color: metric.color } : {};

  return (
    <Card className={cn(
        "flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200",
        metric.isPinned && "border-2 border-primary/70 shadow-primary/20"
      )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold flex items-center truncate" style={metricColorStyle}>
              <BarChartHorizontalBig className="mr-2 h-5 w-5 shrink-0" style={metricColorStyle} />
              <span className="truncate" title={metric.name}>{metric.name}</span>
            </CardTitle>
            <CardDescription>Unit: {metric.unit}</CardDescription>
          </div>
          <div className="flex items-center shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onTogglePin(metric.id)} className="h-8 w-8 mr-1" title={metric.isPinned ? "Unpin Metric" : "Pin Metric"}>
              {metric.isPinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditMetric(metric)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Metric
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddDataPoint(metric.id)}>
                  <PlusSquare className="mr-2 h-4 w-4" />
                  Add Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteMetric(metric.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Metric
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          Created: {format(new Date(metric.createdAt), "PPP")}
        </p>
        {/* Placeholder for a mini chart or latest value in the future */}
        {/* <div className="mt-4 h-16 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
            Mini-chart / Latest Value
        </div> */}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/metrics/${metric.id}`}>View Details</Link>
        </Button>
        <Button onClick={() => onAddDataPoint(metric.id)} className="w-full sm:w-auto" variant="default">
          <PlusSquare className="mr-2 h-4 w-4" />
          Add Data
        </Button>
      </CardFooter>
    </Card>
  );
}
