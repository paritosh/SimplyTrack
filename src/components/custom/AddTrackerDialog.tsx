
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tracker } from "@/types";
import { PlusCircle, Edit3, Palette, Pin, Activity, TrendingUp } from "lucide-react";
import React from "react";

const availableColors = [
  { label: "Primary", value: "hsl(var(--primary))" },
  { label: "Accent", value: "hsl(var(--accent))" },
  { label: "Chart 1 (Purple)", value: "hsl(var(--chart-1))" },
  { label: "Chart 2 (Blue)", value: "hsl(var(--chart-2))" },
  { label: "Chart 3 (Teal)", value: "hsl(var(--chart-3))" },
  { label: "Chart 4 (Orange)", value: "hsl(var(--chart-4))" },
  { label: "Chart 5 (Salmon)", value: "hsl(var(--chart-5))" },
  { label: "Green", value: "hsl(145, 63%, 49%)" },
  { label: "Yellow", value: "hsl(45, 100%, 51%)" },
  { label: "Red", value: "hsl(0, 84%, 60%)" },
];

const trackerFormSchema = z.object({
  name: z.string().min(1, "Tracker name is required."),
  type: z.enum(['value', 'event']).default('value'),
  unit: z.string().optional(),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
}).refine(data => {
  if (data.type === 'value' && (!data.unit || data.unit.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Unit is required for value-based trackers.",
  path: ["unit"],
});

type TrackerFormValues = z.infer<typeof trackerFormSchema>;

interface AddTrackerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tracker: Omit<Tracker, "id" | "createdAt">, id?: string) => void;
  trackerToEdit?: Tracker;
}

export function AddTrackerDialog({ isOpen, onClose, onSave, trackerToEdit }: AddTrackerDialogProps) {
  const form = useForm<TrackerFormValues>({
    resolver: zodResolver(trackerFormSchema),
    defaultValues: {
      name: "",
      type: 'value',
      unit: "",
      color: availableColors[0].value,
      isPinned: false,
    },
  });

  const trackerType = form.watch("type");

  React.useEffect(() => {
    if (isOpen) {
      if (trackerToEdit) {
        form.reset({
          name: trackerToEdit.name,
          type: trackerToEdit.type || 'value',
          unit: trackerToEdit.unit || "",
          color: trackerToEdit.color || availableColors[0].value,
          isPinned: !!trackerToEdit.isPinned,
        });
      } else {
        form.reset({
          name: "",
          type: 'value',
          unit: "",
          color: availableColors[0].value,
          isPinned: false,
        });
      }
    }
  }, [isOpen, trackerToEdit, form]);

  const handleSubmit = (values: TrackerFormValues) => {
    let unitToSave = values.unit;
    if (values.type === 'event') {
      unitToSave = 'occurrence'; // Default unit for event trackers
    }
    onSave({
      name: values.name,
      type: values.type,
      unit: unitToSave!,
      color: values.color,
      isPinned: values.isPinned,
    }, trackerToEdit?.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {trackerToEdit ? <Edit3 className="mr-2 h-5 w-5" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            {trackerToEdit ? "Edit Tracker" : "Add New Tracker"}
          </DialogTitle>
          <DialogDescription>
            {trackerToEdit ? "Update the details of your tracker." : "Define a new tracker or event you want to track."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracker Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Daily Water Intake, Morning Exercise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Activity className="mr-2 h-4 w-4 text-muted-foreground" /> Tracker Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tracker type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="value">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" /> Value-based (e.g., weight, mood score)
                        </div>
                      </SelectItem>
                      <SelectItem value="event">
                        <div className="flex items-center gap-2">
                          <Pin className="h-4 w-4" /> Event-based (e.g., exercised, meditated)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {trackerType === 'value' && (
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ml, USD, reps, hours" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
                      Pinned items appear at the top of your dashboard.
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
                {trackerToEdit ? "Save Changes" : "Add Tracker"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
