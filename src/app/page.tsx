
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AddTrackerDialog } from "@/components/custom/AddTrackerDialog";
import { TrackerCard } from "@/components/custom/TrackerCard";
import { AddDataPointDialog } from "@/components/custom/AddDataPointDialog";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Tracker, DataPoint } from "@/types";
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
} from "@/components/ui/alert-dialog";

const defaultTrackerColor = "hsl(var(--primary))";

export default function DashboardPage() {
  const [trackers, setTrackers] = useLocalStorage<Tracker[]>("trackers", []);
  const [dataPoints, setDataPoints] = useLocalStorage<DataPoint[]>("dataPoints", []);
  
  const [isAddTrackerDialogOpen, setIsAddTrackerDialogOpen] = useState(false);
  const [trackerToEdit, setTrackerToEdit] = useState<Tracker | undefined>(undefined);

  const [isAddDataPointDialogOpen, setIsAddDataPointDialogOpen] = useState(false);
  const [selectedTrackerForDataPoint, setSelectedTrackerForDataPoint] = useState<Tracker | null>(null);

  const [trackerToDelete, setTrackerToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSaveTracker = (trackerData: Omit<Tracker, "id" | "createdAt">, id?: string) => {
    if (id) { 
      setTrackers(prevTrackers => 
        prevTrackers.map(t => t.id === id ? { ...t, ...trackerData, id: t.id, createdAt: t.createdAt } : t)
      );
      toast({ title: "Tracker Updated", description: `"${trackerData.name}" has been updated.` });
    } else { 
      const newTracker: Tracker = {
        id: Date.now().toString(), 
        createdAt: new Date().toISOString(),
        name: trackerData.name,
        unit: trackerData.unit,
        color: trackerData.color || defaultTrackerColor,
        isPinned: !!trackerData.isPinned,
      };
      setTrackers(prevTrackers => [...prevTrackers, newTracker]);
      toast({ title: "Tracker Added", description: `"${newTracker.name}" has been added.` });
    }
    setTrackerToEdit(undefined);
  };

  const handleSaveDataPoint = (dataPointData: Omit<DataPoint, "id" | "trackerId">) => {
    if (!selectedTrackerForDataPoint) return;
    const newDataPoint: DataPoint = {
      ...dataPointData,
      id: Date.now().toString(),
      trackerId: selectedTrackerForDataPoint.id,
    };
    setDataPoints(prevDataPoints => [...prevDataPoints, newDataPoint]);
    toast({ title: "Data Point Added", description: `Value ${newDataPoint.value} for "${selectedTrackerForDataPoint.name}" recorded.` });
  };

  const openAddDataPointDialog = (trackerId: string) => {
    const tracker = trackers.find(t => t.id === trackerId);
    if (tracker) {
      setSelectedTrackerForDataPoint(tracker);
      setIsAddDataPointDialogOpen(true);
    }
  };

  const openEditTrackerDialog = (tracker: Tracker) => {
    setTrackerToEdit(tracker);
    setIsAddTrackerDialogOpen(true);
  };
  
  const handleDeleteTracker = (trackerId: string) => {
    setTrackers(prevTrackers => prevTrackers.filter(t => t.id !== trackerId));
    setDataPoints(prevDataPoints => prevDataPoints.filter(dp => dp.trackerId !== trackerId));
    toast({ title: "Tracker Deleted", description: "The tracker and its data have been deleted." });
    setTrackerToDelete(null);
  };

  const handleTogglePin = (trackerId: string) => {
    let trackerName = "";
    let isNowPinned = false;
    setTrackers(prevTrackers =>
      prevTrackers.map(t => {
        if (t.id === trackerId) {
          trackerName = t.name;
          isNowPinned = !t.isPinned;
          return { ...t, isPinned: !t.isPinned };
        }
        return t;
      })
    );
    if (trackerName) {
      toast({ title: isNowPinned ? "Tracker Pinned" : "Tracker Unpinned", description: `"${trackerName}" has been ${isNowPinned ? 'pinned' : 'unpinned'}.` });
    }
  };

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center"><LayoutGrid className="mr-3 h-8 w-8 text-primary" /> Your Trackers</h1>
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
  
  const sortedTrackers = [...trackers].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center">
          <LayoutGrid className="mr-3 h-8 w-8 text-primary" /> Your Trackers
        </h1>
        <Button onClick={() => { setTrackerToEdit(undefined); setIsAddTrackerDialogOpen(true); }} variant="default" size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Tracker
        </Button>
      </div>

      {sortedTrackers.length === 0 ? (
        <Card className="text-center p-10 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">No trackers yet!</CardTitle>
            <CardDescription className="mt-2 text-lg">
              Start tracking by adding your first tracker.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => { setTrackerToEdit(undefined); setIsAddTrackerDialogOpen(true); }} size="lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Tracker
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTrackers.map(tracker => (
            <TrackerCard 
              key={tracker.id} 
              tracker={tracker} 
              onAddDataPoint={openAddDataPointDialog}
              onEditTracker={openEditTrackerDialog}
              onDeleteTracker={(id) => setTrackerToDelete(id)}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      <AddTrackerDialog
        isOpen={isAddTrackerDialogOpen}
        onClose={() => { setIsAddTrackerDialogOpen(false); setTrackerToEdit(undefined); }}
        onSave={handleSaveTracker}
        trackerToEdit={trackerToEdit}
      />
      <AddDataPointDialog
        isOpen={isAddDataPointDialogOpen}
        onClose={() => setIsAddDataPointDialogOpen(false)}
        onSave={handleSaveDataPoint}
        tracker={selectedTrackerForDataPoint}
      />
      <AlertDialog open={!!trackerToDelete} onOpenChange={(open) => !open && setTrackerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tracker
              and all its associated data points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTrackerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => trackerToDelete && handleDeleteTracker(trackerToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
