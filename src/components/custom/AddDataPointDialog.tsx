
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import type { DataPoint, Tracker } from "@/types";
import { PlusCircle, Edit3, NotebookPen, CheckSquare } from "lucide-react";
import React, { useEffect } from "react";
import { format, parseISO } from 'date-fns';

const dataPointFormSchema = z.object({
  value: z.coerce.number().optional(), // Optional for event trackers, will be set to 1
  date: z.date({ required_error: "Date is required." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format. Use HH:mm (e.g., 14:30)." }),
  notes: z.string().optional(),
});

type DataPointFormValues = z.infer<typeof dataPointFormSchema>;

interface AddDataPointDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataPoint: Omit<DataPoint, "trackerId">, id?: string) => void;
  tracker: Tracker | null;
  dataPointToEdit?: DataPoint | null;
}

export function AddDataPointDialog({ isOpen, onClose, onSave, tracker, dataPointToEdit }: AddDataPointDialogProps) {
  const form = useForm<DataPointFormValues>({
    resolver: zodResolver(dataPointFormSchema),
  });

  const currentTrackerType = tracker?.type || 'value';

  useEffect(() => {
    if (isOpen) {
      if (dataPointToEdit) {
        const timestampDate = parseISO(dataPointToEdit.timestamp);
        form.reset({
          value: currentTrackerType === 'value' ? dataPointToEdit.value : undefined,
          date: timestampDate,
          time: format(timestampDate, "HH:mm"),
          notes: dataPointToEdit.notes || "",
        });
      } else {
        form.reset({
          value: currentTrackerType === 'value' ? ('' as unknown as number) : undefined,
          date: new Date(),
          time: format(new Date(), "HH:mm"),
          notes: "",
        });
      }
    }
  }, [isOpen, dataPointToEdit, form, currentTrackerType]);

  const handleSubmit = (values: DataPointFormValues) => {
    if (!tracker) return;

    const { value, date: selectedDateValue, time: timeString, notes } = values;
    
    const combinedDateTime = new Date(selectedDateValue);
    const [hours, minutes] = timeString.split(':').map(Number);
    combinedDateTime.setHours(hours, minutes, 0, 0);

    const dataPointPayload: Omit<DataPoint, "trackerId"> = {
      id: dataPointToEdit ? dataPointToEdit.id : Date.now().toString(),
      value: currentTrackerType === 'event' ? 1 : value!, // Force value to 1 for events
      timestamp: combinedDateTime.toISOString(),
      notes,
    };
    
    onSave(dataPointPayload, dataPointToEdit?.id);
    onClose();
  };

  if (!tracker) return null;

  const isEditing = !!dataPointToEdit;
  const dialogTitleIcon = isEditing ? <Edit3 className="mr-2 h-5 w-5" /> : (currentTrackerType === 'event' ? <CheckSquare className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />);
  const dialogTitleText = isEditing 
    ? (currentTrackerType === 'event' ? "Edit Event Log" : "Edit Data Point")
    : (currentTrackerType === 'event' ? `Log ${tracker.name}` : `Add Data for ${tracker.name}`);
  const dialogDescriptionText = isEditing
    ? (currentTrackerType === 'event' ? `Update the details for this logged event.` : `Update the details for this data point.`)
    : (currentTrackerType === 'event' ? `Confirm logging "${tracker.name}" for the selected date and time.` : `Log a new data point for "${tracker.name}" (Unit: ${tracker.unit}).`);
  const submitButtonText = isEditing 
    ? "Save Changes" 
    : (currentTrackerType === 'event' ? "Log Event" : "Add Data Point");


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {dialogTitleIcon}
            {dialogTitleText}
          </DialogTitle>
          <DialogDescription>
            {dialogDescriptionText}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            {currentTrackerType === 'value' && (
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value ({tracker.unit})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={`Enter value in ${tracker.unit}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <NotebookPen className="mr-2 h-4 w-4 text-muted-foreground"/>
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional context or notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="default">
                {submitButtonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
