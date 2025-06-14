
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Metric } from "@/types";
import { PlusCircle, Edit3, Palette, Pin } from "lucide-react";
import React from "react";

const availableColors = [
  { label: "Primary", value: "hsl(var(--primary))" },
  { label: "Accent", value: "hsl(var(--accent))" },
  { label: "Chart 1 (Purple)", value: "hsl(var(--chart-1))" },
  { label: "Chart 2 (Blue)", value: "hsl(var(--chart-2))" },
  { label: "Chart 3 (Teal)", value: "hsl(var(--chart-3))" },
  { label: "Chart 4 (Orange)", value: "hsl(var(--chart-4))" },
  { label: "Chart 5 (Salmon)", value: "hsl(var(--chart-5))" },
  { label: "Green", value: "hsl(145, 63%, 49%)" }, // A distinct green
  { label: "Yellow", value: "hsl(45, 100%, 51%)" }, // A distinct yellow
  { label: "Red", value: "hsl(0, 84%, 60%)" }, // A distinct red for emphasis
];

const metricFormSchema = z.object({
  name: z.string().min(1, "Metric name is required."),
  unit: z.string().min(1, "Unit is required (e.g., kg, %, count)."),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
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
    defaultValues: metricToEdit 
      ? { 
          name: metricToEdit.name, 
          unit: metricToEdit.unit,
          color: metricToEdit.color || availableColors[0].value,
          isPinned: !!metricToEdit.isPinned,
        } 
      : { 
          name: "", 
          unit: "",
          color: availableColors[0].value,
          isPinned: false,
        },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        metricToEdit
        ? { 
            name: metricToEdit.name, 
            unit: metricToEdit.unit,
            color: metricToEdit.color || availableColors[0].value,
            isPinned: !!metricToEdit.isPinned,
          }
        : { 
            name: "", 
            unit: "",
            color: availableColors[0].value,
            isPinned: false,
          }
      );
    }
  }, [isOpen, metricToEdit, form]);

  const handleSubmit = (values: MetricFormValues) => {
    onSave({
      name: values.name,
      unit: values.unit,
      color: values.color,
      isPinned: values.isPinned,
    }, metricToEdit?.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
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
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Palette className="mr-2 h-4 w-4 text-muted-foreground" /> Chart Color</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableColors.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value.startsWith('hsl(var(--') ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue(color.value.slice(8,-1)).trim()})` : color.value }} />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center"><Pin className="mr-2 h-4 w-4 text-muted-foreground"/> Pin to Dashboard</FormLabel>
                    <DialogDescription className="text-xs">
                      Pinned metrics appear at the top of your dashboard.
                    </DialogDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
