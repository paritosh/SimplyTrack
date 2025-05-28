"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AddMetricDialog } from "@/components/custom/AddMetricDialog";
import { MetricCard } from "@/components/custom/MetricCard";
import { AddDataPointDialog } from "@/components/custom/AddDataPointDialog";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Metric, DataPoint } from "@/types";
import { PlusCircle, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const [metrics, setMetrics] = useLocalStorage<Metric[]>("metrics", []);
  const [dataPoints, setDataPoints] = useLocalStorage<DataPoint[]>("dataPoints", []);
  
  const [isAddMetricDialogOpen, setIsAddMetricDialogOpen] = useState(false);
  const [metricToEdit, setMetricToEdit] = useState<Metric | undefined>(undefined);

  const [isAddDataPointDialogOpen, setIsAddDataPointDialogOpen] = useState(false);
  const [selectedMetricForDataPoint, setSelectedMetricForDataPoint] = useState<Metric | null>(null);

  const [metricToDelete, setMetricToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSaveMetric = (metricData: Omit<Metric, "id" | "createdAt">, id?: string) => {
    if (id) { // Editing existing metric
      setMetrics(prevMetrics => 
        prevMetrics.map(m => m.id === id ? { ...m, ...metricData } : m)
      );
      toast({ title: "Metric Updated", description: `"${metricData.name}" has been updated.` });
    } else { // Adding new metric
      const newMetric: Metric = {
        ...metricData,
        id: Date.now().toString(), // Simple ID generation
        createdAt: new Date().toISOString(),
      };
      setMetrics(prevMetrics => [...prevMetrics, newMetric]);
      toast({ title: "Metric Added", description: `"${newMetric.name}" has been added.` });
    }
    setMetricToEdit(undefined);
  };

  const handleSaveDataPoint = (dataPointData: Omit<DataPoint, "id" | "metricId">) => {
    if (!selectedMetricForDataPoint) return;
    const newDataPoint: DataPoint = {
      ...dataPointData,
      id: Date.now().toString(),
      metricId: selectedMetricForDataPoint.id,
    };
    setDataPoints(prevDataPoints => [...prevDataPoints, newDataPoint]);
    toast({ title: "Data Point Added", description: `Value ${newDataPoint.value} for "${selectedMetricForDataPoint.name}" recorded.` });
  };

  const openAddDataPointDialog = (metricId: string) => {
    const metric = metrics.find(m => m.id === metricId);
    if (metric) {
      setSelectedMetricForDataPoint(metric);
      setIsAddDataPointDialogOpen(true);
    }
  };

  const openEditMetricDialog = (metric: Metric) => {
    setMetricToEdit(metric);
    setIsAddMetricDialogOpen(true);
  };
  
  const handleDeleteMetric = (metricId: string) => {
    setMetrics(prevMetrics => prevMetrics.filter(m => m.id !== metricId));
    setDataPoints(prevDataPoints => prevDataPoints.filter(dp => dp.metricId !== metricId));
    toast({ title: "Metric Deleted", description: "The metric and its data have been deleted." });
    setMetricToDelete(null);
  };

  if (!isMounted) {
    // Render a loading state or null until the component is mounted to avoid hydration mismatch with localStorage
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center"><LayoutGrid className="mr-3 h-8 w-8 text-primary" /> Your Metrics</h1>
        </div>
        <div className="animate-pulse bg-muted h-12 w-40 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-card p-6 rounded-lg shadow-sm h-[200px] animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center">
          <LayoutGrid className="mr-3 h-8 w-8 text-primary" /> Your Metrics
        </h1>
        <Button onClick={() => { setMetricToEdit(undefined); setIsAddMetricDialogOpen(true); }} variant="default" size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Metric
        </Button>
      </div>

      {metrics.length === 0 ? (
        <Card className="text-center p-10 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">No metrics yet!</CardTitle>
            <CardDescription className="mt-2 text-lg">
              Start tracking by adding your first metric.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => { setMetricToEdit(undefined); setIsAddMetricDialogOpen(true); }} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Metric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(metric => (
            <MetricCard 
              key={metric.id} 
              metric={metric} 
              onAddDataPoint={openAddDataPointDialog}
              onEditMetric={openEditMetricDialog}
              onDeleteMetric={(id) => setMetricToDelete(id)}
            />
          ))}
        </div>
      )}

      <AddMetricDialog
        isOpen={isAddMetricDialogOpen}
        onClose={() => { setIsAddMetricDialogOpen(false); setMetricToEdit(undefined); }}
        onSave={handleSaveMetric}
        metricToEdit={metricToEdit}
      />
      <AddDataPointDialog
        isOpen={isAddDataPointDialogOpen}
        onClose={() => setIsAddDataPointDialogOpen(false)}
        onSave={handleSaveDataPoint}
        metric={selectedMetricForDataPoint}
      />
      <AlertDialog open={!!metricToDelete} onOpenChange={(open) => !open && setMetricToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this metric?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the metric
              and all its associated data points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMetricToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => metricToDelete && handleDeleteMetric(metricToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
