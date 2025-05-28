"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Edit3, Trash2, ListChecks, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddDataPointDialog } from '@/components/custom/AddDataPointDialog';
import { MetricChart } from '@/components/custom/MetricChart';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Metric, DataPoint } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddMetricDialog } from '@/components/custom/AddMetricDialog';
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


export default function MetricDetailPage() {
  const params = useParams();
  const router = useRouter();
  const metricId = params.metricId as string;

  const [metrics, setMetrics] = useLocalStorage<Metric[]>("metrics", []);
  const [dataPoints, setDataPoints] = useLocalStorage<DataPoint[]>("dataPoints", []);
  
  const [metric, setMetric] = useState<Metric | null>(null);
  const [metricDataPoints, setMetricDataPoints] = useState<DataPoint[]>([]);
  
  const [isAddDataPointDialogOpen, setIsAddDataPointDialogOpen] = useState(false);
  const [isEditMetricDialogOpen, setIsEditMetricDialogOpen] = useState(false);
  const [isDeleteMetricDialogOpen, setIsDeleteMetricDialogOpen] = useState(false);
  const [dataPointToDelete, setDataPointToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const foundMetric = metrics.find(m => m.id === metricId);
    if (foundMetric) {
      setMetric(foundMetric);
      const relatedDataPoints = dataPoints.filter(dp => dp.metricId === metricId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMetricDataPoints(relatedDataPoints);
    } else if (isMounted && metrics.length > 0) { // only redirect if not found after initial load
      toast({ title: "Metric Not Found", description: "The requested metric could not be found.", variant: "destructive" });
      router.push('/');
    }
  }, [metricId, metrics, dataPoints, router, toast, isMounted]);


  const handleSaveDataPoint = (dataPointData: Omit<DataPoint, "id" | "metricId">) => {
    if (!metric) return;
    const newDataPoint: DataPoint = {
      ...dataPointData,
      id: Date.now().toString(),
      metricId: metric.id,
    };
    setDataPoints(prevDataPoints => [...prevDataPoints, newDataPoint]);
    toast({ title: "Data Point Added", description: `Value ${newDataPoint.value} for "${metric.name}" recorded.` });
  };

  const handleSaveMetric = (metricData: Omit<Metric, "id" | "createdAt">) => {
    if (!metric) return;
    setMetrics(prevMetrics => 
      prevMetrics.map(m => m.id === metric.id ? { ...m, ...metricData, id: m.id, createdAt: m.createdAt } : m)
    );
    toast({ title: "Metric Updated", description: `"${metricData.name}" has been updated.` });
  };

  const handleDeleteMetric = () => {
    if (!metric) return;
    setMetrics(prevMetrics => prevMetrics.filter(m => m.id !== metric.id));
    setDataPoints(prevDataPoints => prevDataPoints.filter(dp => dp.metricId !== metric.id));
    toast({ title: "Metric Deleted", description: "The metric and its data have been deleted." });
    router.push('/');
  };

  const handleDeleteDataPoint = (dataPointId: string) => {
    setDataPoints(prevDataPoints => prevDataPoints.filter(dp => dp.id !== dataPointId));
    toast({ title: "Data Point Deleted", description: "The data point has been removed." });
    setDataPointToDelete(null);
  };

  if (!isMounted || !metric) {
    return (
       <div className="space-y-6">
        <div className="animate-pulse bg-muted h-8 w-32 rounded-md mb-4"></div>
        <div className="animate-pulse bg-card h-12 w-full rounded-md"></div>
        <div className="animate-pulse bg-card h-96 w-full rounded-md mt-6"></div>
        <div className="animate-pulse bg-card h-64 w-full rounded-md mt-6"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <Card className="shadow-md">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-3xl font-bold text-primary flex items-center">
                <BarChart3 className="mr-3 h-8 w-8" />
                {metric.name}
              </CardTitle>
              <CardDescription>Unit: {metric.unit} | Created: {format(new Date(metric.createdAt), "PPP")}</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
               <Button onClick={() => setIsEditMetricDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Metric
              </Button>
              <Button onClick={() => setIsDeleteMetricDialogOpen(true)} variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Metric
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      <MetricChart metric={metric} data={metricDataPoints} />

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <ListChecks className="mr-2 h-6 w-6 text-primary" />
              Data Log
            </CardTitle>
            <CardDescription>
              Recorded data points for {metric.name}.
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDataPointDialogOpen(true)} variant="default" size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Data Point
          </Button>
        </CardHeader>
        <CardContent>
          {metricDataPoints.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No data points logged yet. Click &quot;Add Data Point&quot; to start.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead className="text-right">Value ({metric.unit})</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricDataPoints.map((dp) => (
                    <TableRow key={dp.id}>
                      <TableCell>{format(new Date(dp.timestamp), "PPP p")}</TableCell>
                      <TableCell className="text-right font-medium">{dp.value}</TableCell>
                      <TableCell className="max-w-xs truncate">{dp.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setDataPointToDelete(dp.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddDataPointDialog
        isOpen={isAddDataPointDialogOpen}
        onClose={() => setIsAddDataPointDialogOpen(false)}
        onSave={handleSaveDataPoint}
        metric={metric}
      />
      <AddMetricDialog
        isOpen={isEditMetricDialogOpen}
        onClose={() => setIsEditMetricDialogOpen(false)}
        onSave={handleSaveMetric}
        metricToEdit={metric}
      />
       <AlertDialog open={isDeleteMetricDialogOpen} onOpenChange={setIsDeleteMetricDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this metric?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete &quot;{metric.name}&quot;
              and all its associated data points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMetric} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Metric
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!dataPointToDelete} onOpenChange={(open) => !open && setDataPointToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data Point?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this data point? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDataPointToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => dataPointToDelete && handleDeleteDataPoint(dataPointToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
