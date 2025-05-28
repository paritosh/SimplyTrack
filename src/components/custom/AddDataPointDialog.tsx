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
import type { DataPoint, Metric } from "@/types";
import { PlusCircle, NotebookPen } from "lucide-react";
import React, { useEffect } from "react";

const dataPointFormSchema = z.object({
  value: z.coerce.number({ invalid_type_error: "Value must be a number." }),
  timestamp: z.date({ required_error: "Timestamp is required." }),
  notes: z.string().optional(),
});

type DataPointFormValues = z.infer<typeof dataPointFormSchema>;

interface AddDataPointDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataPoint: Omit<DataPoint, "id" | "metricId">) => void;
  metric: Metric | null;
}

export function AddDataPointDialog({ isOpen, onClose, onSave, metric }: AddDataPointDialogProps) {
  const form = useForm<DataPointFormValues>({
    resolver: zodResolver(dataPointFormSchema),
    defaultValues: {
      value: '' as unknown as number, // Initialize with empty string for controlled input
      timestamp: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        value: '' as unknown as number, // Reset with empty string
        timestamp: new Date(),
        notes: "",
      });
    }
  }, [isOpen, form]);

  const handleSubmit = (values: DataPointFormValues) => {
    if (!metric) return;
    onSave({
      ...values,
      timestamp: values.timestamp.toISOString(),
    });
    onClose();
  };

  if (!metric) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Data for {metric.name}
          </DialogTitle>
          <DialogDescription>
            Log a new data point for &quot;{metric.name}&quot; (Unit: {metric.unit}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value ({metric.unit})</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={`Enter value in ${metric.unit}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Timestamp</FormLabel>
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
              <Button type="submit" variant="default">Add Data Point</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
