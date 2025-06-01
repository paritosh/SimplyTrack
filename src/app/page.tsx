
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { AddTrackerDialog } from "@/components/custom/AddTrackerDialog";
import { TrackerCard } from "@/components/custom/TrackerCard";
import { AddDataPointDialog } from "@/components/custom/AddDataPointDialog";
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
import * as idb from '@/lib/idb';

const defaultTrackerColor = "hsl(var(--primary))";

export default function DashboardPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  // dataPoints state is not strictly needed on dashboard, but keeping for consistency if future features need it
  // For now, data points are added directly via dialog, and detail page fetches its own.
  
  const [isAddTrackerDialogOpen, setIsAddTrackerDialogOpen] = useState(false);
  const [trackerToEdit, setTrackerToEdit] = useState<Tracker | undefined>(undefined);

  const [isAddDataPointDialogOpen, setIsAddDataPointDialogOpen] = useState(false);
  const [selectedTrackerForDataPoint, setSelectedTrackerForDataPoint] = useState<Tracker | null>(null);

  const [trackerToDelete, setTrackerToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrackers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTrackers = await idb.getAllTrackers();
      const migratedTrackers = fetchedTrackers.map(t => ({
        ...t,
        type: t.type || 'value',
        unit: (t.type === 'event' && (t.unit === "" || !t.unit)) ? 'occurrence' : t.unit || '',
        color: t.color || defaultTrackerColor,
        isPinned: !!t.isPinned,
      }));
      setTrackers(migratedTrackers);
    } catch (error) {
      console.error("Failed to fetch trackers:", error);
      toast({ title: "Error", description: "Could not load trackers from the database.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    fetchTrackers();
  }, [fetchTrackers]);


  const handleSaveTracker = async (trackerData: Omit<Tracker, "id" | "createdAt">, id?: string) => {
    const unit = trackerData.type === 'event' ? 'occurrence' : trackerData.unit;

    if (id) { 
      const existingTracker = trackers.find(t => t.id === id);
      if (!existingTracker) return;

      const updatedTracker: Tracker = {
        ...existingTracker,
        ...trackerData,
        unit: unit!,
      };
      try {
        await idb.updateTracker(updatedTracker);
        setTrackers(prevTrackers => 
          prevTrackers.map(t => t.id === id ? updatedTracker : t)
        );
        toast({ title: "Tracker Updated", description: `"${updatedTracker.name}" has been updated.` });
      } catch (error) {
        toast({ title: "Error", description: "Could not update tracker.", variant: "destructive" });
      }
    } else { 
      const newTracker: Tracker = {
        id: Date.now().toString(), 
        createdAt: new Date().toISOString(),
        name: trackerData.name,
        type: trackerData.type || 'value',
        unit: unit!,
        color: trackerData.color || defaultTrackerColor,
        isPinned: !!trackerData.isPinned,
      };
      try {
        await idb.addTracker(newTracker);
        setTrackers(prevTrackers => [...prevTrackers, newTracker]);
        toast({ title: "Tracker Added", description: `"${newTracker.name}" has been added.` });
      } catch (error) {
        toast({ title: "Error", description: "Could not add tracker.", variant: "destructive" });
      }
    }
    setTrackerToEdit(undefined);
    setIsAddTrackerDialogOpen(false);
  };

  const handleSaveDataPoint = async (dataPointData: Omit<DataPoint, "trackerId">) => {
    if (!selectedTrackerForDataPoint) return;
    
    const newDataPoint: DataPoint = {
      ...dataPointData, // id is already in dataPointData from dialog
      trackerId: selectedTrackerForDataPoint.id,
      value: selectedTrackerForDataPoint.type === 'event' ? 1 : dataPointData.value,
    };
    
    try {
      await idb.addDataPoint(newDataPoint);
      // No need to update local dataPoints state here as this page doesn't display them directly.
      // The tracker detail page will fetch its own data.
      const toastMessage = selectedTrackerForDataPoint.type === 'event'
        ? `Event "${selectedTrackerForDataPoint.name}" logged.`
        : `Value ${newDataPoint.value} for "${selectedTrackerForDataPoint.name}" recorded.`;
      toast({ title: "Data Point Added", description: toastMessage });
      setIsAddDataPointDialogOpen(false);
      setSelectedTrackerForDataPoint(null);
    } catch (error) {
        toast({ title: "Error", description: "Could not add data point.", variant: "destructive" });
    }
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
  
  const handleDeleteTracker = async (trackerId: string) => {
    try {
      await idb.deleteTracker(trackerId);
      await idb.deleteDataPointsByTrackerId(trackerId); // Also delete associated data points
      setTrackers(prevTrackers => prevTrackers.filter(t => t.id !== trackerId));
      toast({ title: "Tracker Deleted", description: "The tracker and its data have been deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete tracker.", variant: "destructive" });
    }
    setTrackerToDelete(null);
  };

  const handleTogglePin = async (trackerId: string) => {
    const tracker = trackers.find(t => t.id === trackerId);
    if (!tracker) return;

    const updatedTracker = { ...tracker, isPinned: !tracker.isPinned };
    try {
      await idb.updateTracker(updatedTracker);
      setTrackers(prevTrackers =>
        prevTrackers.map(t => t.id === trackerId ? updatedTracker : t)
      );
      toast({ title: updatedTracker.isPinned ? "Tracker Pinned" : "Tracker Unpinned", description: `"${updatedTracker.name}" has been ${updatedTracker.isPinned ? 'pinned' : 'unpinned'}.` });
    } catch (error) {
       toast({ title: "Error", description: "Could not update pin status.", variant: "destructive" });
    }
  };

  if (!isMounted || isLoading) {
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
    // Fallback sort by creation date if pinning status is the same or not present
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
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
              Start tracking by adding your first value-based or event-based tracker.
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
        onClose={() => {
          setIsAddDataPointDialogOpen(false);
          setSelectedTrackerForDataPoint(null);
        }}
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
