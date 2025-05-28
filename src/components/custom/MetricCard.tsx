"use client";

import Link from "next/link";
import { BarChartHorizontalBig, Edit, Trash2, PlusSquare } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";

interface MetricCardProps {
  metric: Metric;
  onAddDataPoint: (metricId: string) => void;
  onEditMetric: (metric: Metric) => void;
  onDeleteMetric: (metricId: string) => void;
}

export function MetricCard({ metric, onAddDataPoint, onEditMetric, onDeleteMetric }: MetricCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold text-primary flex items-center">
              <BarChartHorizontalBig className="mr-2 h-5 w-5" />
              {metric.name}
            </CardTitle>
            <CardDescription>Unit: {metric.unit}</CardDescription>
          </div>
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
              <DropdownMenuItem onClick={() => onDeleteMetric(metric.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Metric
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
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
