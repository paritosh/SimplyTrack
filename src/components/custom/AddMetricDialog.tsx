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
import type { Metric } from "@/types";
import { PlusCircle, Edit3 } from "lucide-react";

const metricFormSchema = z.object({
  name: z.string().min(1, "Metric name is required."),
  unit: z.string().min(1, "Unit is required (e.g., kg, %, count)."),
});

type MetricFormValues = z.infer<typeof metricFormSchema>;

interface AddMetricDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metric: Omit<Metric, "id" | "createdAt">, id?: string) => void;
  metricToEdit?: Metric;
}

export function AddMetricDialog({ isOpen, onClose, onSave, metricToEdit }: AddMetricDialogProps) {
  const form = useForm<MetricFormValues>({
    resolver: zodResolver(metricFormSchema),
    defaultValues: metricToEdit ? { name: metricToEdit.name, unit: metricToEdit.unit } : { name: "", unit: "" },
  });

  const handleSubmit = (values: MetricFormValues) => {
    onSave(values, metricToEdit?.id);
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {metricToEdit ? <Edit3 className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            {metricToEdit ? "Edit Metric" : "Add New Metric"}
          </DialogTitle>
          <DialogDescription>
            {metricToEdit ? "Update the details of your metric." : "Define a new metric you want to track."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metric Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Daily Water Intake, Portfolio Value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ml, USD, reps, hours" {...field} />
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
                {metricToEdit ? "Save Changes" : "Add Metric"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
