
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Edit3, Trash2, ListChecks, BarChart3, CheckSquare, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddDataPointDialog } from '@/components/custom/AddDataPointDialog';
import { TrackerChart } from '@/components/custom/TrackerChart';
import { EventCalendarHeatmap } from '@/components/custom/EventCalendarHeatmap';
import type { Tracker, DataPoint } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddTrackerDialog } from '@/components/custom/AddTrackerDialog';
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

export default function TrackerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trackerId = params.trackerId as string;

  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [trackerDataPoints, setTrackerDataPoints] = useState<DataPoint[]>([]);
  
  const [isDataPointDialogOpen, setIsDataPointDialogOpen] = useState(false);
  const [dataPointToEdit, setDataPointToEdit] = useState<DataPoint | null>(null);
  const [isEditTrackerDialogOpen, setIsEditTrackerDialogOpen] = useState(false);
  const [isDeleteTrackerDialogOpen, setIsDeleteTrackerDialogOpen] = useState(false);
  const [dataPointIdToDelete, setDataPointIdToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrackerDetails = useCallback(async () => {
    if (!trackerId) return;
    setIsLoading(true);
    try {
      const fetchedTracker = await idb.getTrackerById(trackerId);
      if (fetchedTracker) {
        setTracker({
            ...fetchedTracker,
            type: fetchedTracker.type || 'value',
            unit: (fetchedTracker.type === 'event' && (fetchedTracker.unit === "" || !fetchedTracker.unit)) ? 'occurrence' : fetchedTracker.unit || '',
            color: fetchedTracker.color || defaultTrackerColor,
            isPinned: !!fetchedTracker.isPinned,
        });
        const relatedDataPoints = await idb.getDataPointsByTrackerId(trackerId);
        setTrackerDataPoints(relatedDataPoints.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        toast({ title: "Tracker Not Found", description: "The requested tracker could not be found.", variant: "destructive" });
        router.push('/');
      }
    } catch (error) {
      console.error("Failed to fetch tracker details:", error);
      toast({ title: "Error", description: "Could not load tracker data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [trackerId, router, toast]);

  useEffect(() => {
    setIsMounted(true);
    fetchTrackerDetails();
  }, [fetchTrackerDetails]);


  const handleSaveDataPoint = async (dataPointData: Omit<DataPoint, "trackerId">, idToUpdate?: string) => {
    if (!tracker) return;
    
    const finalDataPointData = {
        ...dataPointData, // id is already in dataPointData from dialog
        value: tracker.type === 'event' ? 1 : dataPointData.value,
    };

    try {
      if (idToUpdate) { 
        const dpToUpdate: DataPoint = { ...finalDataPointData, id: idToUpdate, trackerId: tracker.id };
        await idb.updateDataPoint(dpToUpdate);
        setTrackerDataPoints(prevDataPoints =>
          prevDataPoints.map(dp =>
            dp.id === idToUpdate ? dpToUpdate : dp
          ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );
        toast({ title: tracker.type === 'event' ? "Event Updated" : "Data Point Updated", description: `${tracker.type === 'event' ? 'Event' : 'Data point'} for "${tracker.name}" has been updated.` });
      } else { 
        const newDataPoint: DataPoint = {
          ...finalDataPointData, 
          trackerId: tracker.id,
        };
        await idb.addDataPoint(newDataPoint);
        setTrackerDataPoints(prevDataPoints => 
            [...prevDataPoints, newDataPoint].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );
        const toastMessage = tracker.type === 'event' 
          ? `Event "${tracker.name}" logged.` 
          : `Value ${newDataPoint.value} for "${tracker.name}" recorded.`;
        toast({ title: tracker.type === 'event' ? "Event Logged" : "Data Point Added", description: toastMessage });
      }
    } catch (error) {
      toast({ title: "Error", description: `Could not save ${tracker.type === 'event' ? 'event' : 'data point'}.`, variant: "destructive" });
    }
    setDataPointToEdit(null); 
    setIsDataPointDialogOpen(false);
  };

  const handleSaveTracker = async (trackerData: Omit<Tracker, "id" | "createdAt">) => {
    if (!tracker) return;
    const unit = trackerData.type === 'event' ? 'occurrence' : trackerData.unit;
    const updatedTrackerData: Tracker = {
      ...tracker,
      ...trackerData,
      unit: unit!,
      color: trackerData.color || tracker.color || defaultTrackerColor,
      isPinned: trackerData.isPinned !== undefined ? trackerData.isPinned : tracker.isPinned,
    };

    try {
      await idb.updateTracker(updatedTrackerData);
      setTracker(updatedTrackerData);
      toast({ title: "Tracker Updated", description: `"${updatedTrackerData.name}" has been updated.` });
    } catch (error) {
       toast({ title: "Error", description: "Could not update tracker.", variant: "destructive" });
    }
    setIsEditTrackerDialogOpen(false);
  };

  const handleDeleteTracker = async () => {
    if (!tracker) return;
    try {
      await idb.deleteTracker(tracker.id);
      await idb.deleteDataPointsByTrackerId(tracker.id);
      toast({ title: "Tracker Deleted", description: "The tracker and its data have been deleted." });
      router.push('/');
    } catch (error) {
      toast({ title: "Error", description: "Could not delete tracker.", variant: "destructive" });
    }
    setIsDeleteTrackerDialogOpen(false);
  };

  const handleDeleteDataPoint = async (dpId: string) => {
    try {
      await idb.deleteDataPoint(dpId);
      setTrackerDataPoints(prevDataPoints => prevDataPoints.filter(dp => dp.id !== dpId));
      toast({ title: tracker?.type === 'event' ? "Event Log Removed" : "Data Point Deleted", description: `The ${tracker?.type === 'event' ? 'event log' : 'data point'} has been removed.` });
    } catch (error) {
      toast({ title: "Error", description: `Could not delete ${tracker?.type === 'event' ? 'event log' : 'data point'}.`, variant: "destructive" });
    }
    setDataPointIdToDelete(null);
  };

  const openEditDataPointDialog = (dataPoint: DataPoint) => {
    setDataPointToEdit(dataPoint);
    setIsDataPointDialogOpen(true);
  };

  const openAddDataPointDialog = () => {
    setDataPointToEdit(null); 
    setIsDataPointDialogOpen(true);
  };

  if (!isMounted || isLoading || !tracker) {
    return (
       <div className="space-y-6">
        <div className="animate-pulse bg-muted h-8 w-32 rounded-md mb-4"></div>
        <div className="animate-pulse bg-card h-20 w-full rounded-md"></div>
        <div className="animate-pulse bg-card h-96 w-full rounded-md mt-6"></div>
        <div className="animate-pulse bg-card h-64 w-full rounded-md mt-6"></div>
      </div>
    );
  }
  
  const trackerColorStyle = tracker.color ? { color: tracker.color } : { color: 'hsl(var(--primary))' };
  const currentTrackerType = tracker.type || 'value';
  const cardTitleIcon = currentTrackerType === 'event' 
    ? <CalendarDays className="mr-3 h-8 w-8" style={trackerColorStyle} /> 
    : <BarChart3 className="mr-3 h-8 w-8" style={trackerColorStyle} />;
  const dataLogTitleIcon = currentTrackerType === 'event' 
    ? <CheckSquare className="mr-2 h-6 w-6" style={trackerColorStyle} /> 
    : <ListChecks className="mr-2 h-6 w-6" style={trackerColorStyle} />;
  const addDataButtonText = currentTrackerType === 'event' ? "Log Event" : "Add Data Point";
  const valueColumnHeaderText = currentTrackerType === 'event' ? "Status" : `Value (${tracker.unit})`;

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
              <CardTitle className="text-3xl font-bold flex items-center" style={trackerColorStyle}>
                {cardTitleIcon}
                {tracker.name}
              </CardTitle>
              <CardDescription>
                {currentTrackerType === 'value' ? `Unit: ${tracker.unit}` : `Type: Event Tracker`} | Created: {format(parseISO(tracker.createdAt), "PPP")}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
               <Button onClick={() => setIsEditTrackerDialogOpen(true)} variant="outline" className="w-full sm:w-auto">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Tracker
              </Button>
              <Button onClick={() => setIsDeleteTrackerDialogOpen(true)} variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Tracker
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      {currentTrackerType === 'event' ? (
        <EventCalendarHeatmap tracker={tracker} data={trackerDataPoints} />
      ) : (
        <TrackerChart tracker={tracker} data={trackerDataPoints} />
      )}

      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center">
              {dataLogTitleIcon}
              Data Log
            </CardTitle>
            <CardDescription>
              Recorded {currentTrackerType === 'event' ? 'events' : 'data points'} for {tracker.name}.
            </CardDescription>
          </div>
          <Button onClick={openAddDataPointDialog} variant="default" size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> {addDataButtonText}
          </Button>
        </CardHeader>
        <CardContent>
          {trackerDataPoints.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No {currentTrackerType === 'event' ? 'events logged' : 'data points recorded'} yet. Click &quot;{addDataButtonText}&quot; to start.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead className={currentTrackerType === 'event' ? 'text-left' : 'text-right'}>{valueColumnHeaderText}</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackerDataPoints.map((dp) => (
                    <TableRow key={dp.id}>
                      <TableCell>{format(parseISO(dp.timestamp), "PPP p")}</TableCell>
                      {currentTrackerType === 'event' ? (
                        <TableCell className="text-left"><CheckSquare className="h-5 w-5 text-green-600" /></TableCell>
                      ) : (
                        <TableCell className="text-right font-medium">{dp.value}</TableCell>
                      )}
                      <TableCell className="max-w-xs truncate" title={dp.notes}>{dp.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDataPointDialog(dp)} className="text-muted-foreground hover:text-foreground">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDataPointIdToDelete(dp.id)} className="text-destructive hover:text-destructive/80">
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
        isOpen={isDataPointDialogOpen}
        onClose={() => { setIsDataPointDialogOpen(false); setDataPointToEdit(null); }}
        onSave={handleSaveDataPoint}
        tracker={tracker}
        dataPointToEdit={dataPointToEdit}
      />
      <AddTrackerDialog
        isOpen={isEditTrackerDialogOpen}
        onClose={() => setIsEditTrackerDialogOpen(false)}
        onSave={handleSaveTracker}
        trackerToEdit={tracker}
      />
       <AlertDialog open={isDeleteTrackerDialogOpen} onOpenChange={setIsDeleteTrackerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete &quot;{tracker.name}&quot;
              and all its associated data points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTracker} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Tracker
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!dataPointIdToDelete} onOpenChange={(open) => !open && setDataPointIdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {currentTrackerType === 'event' ? 'Event Log' : 'Data Point'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {currentTrackerType === 'event' ? 'event log' : 'data point'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDataPointIdToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => dataPointIdToDelete && handleDeleteDataPoint(dataPointIdToDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
