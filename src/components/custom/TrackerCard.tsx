
"use client";

import Link from "next/link";
import { BarChartHorizontalBig, Edit, Trash2, PlusSquare, MoreHorizontal, Pin, PinOff, CheckSquare, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tracker } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TrackerCardProps {
  tracker: Tracker;
  onAddDataPoint: (trackerId: string) => void;
  onEditTracker: (tracker: Tracker) => void;
  onDeleteTracker: (trackerId: string) => void;
  onTogglePin: (trackerId: string) => void;
}

export function TrackerCard({ tracker, onAddDataPoint, onEditTracker, onDeleteTracker, onTogglePin }: TrackerCardProps) {
  const trackerColorStyle = tracker.color ? { color: tracker.color } : {};
  const currentTrackerType = tracker.type || 'value';

  const cardIcon = currentTrackerType === 'event' 
    ? <CheckSquare className="mr-2 h-5 w-5 shrink-0" style={trackerColorStyle} /> 
    : <TrendingUp className="mr-2 h-5 w-5 shrink-0" style={trackerColorStyle} />;
  
  const addDataButtonText = currentTrackerType === 'event' ? "Log Event" : "Add Data";
  const addDataIcon = currentTrackerType === 'event' ? <CheckSquare className="mr-2 h-4 w-4" /> : <PlusSquare className="mr-2 h-4 w-4" />;


  return (
    <Card className={cn( 
        "flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200",
        tracker.isPinned && "border-2 border-primary/70 shadow-primary/20"
      )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold flex items-center truncate" style={trackerColorStyle}>
              {cardIcon}
              <span className="truncate" title={tracker.name}>{tracker.name}</span>
            </CardTitle>
            <CardDescription>
              {currentTrackerType === 'value' ? `Unit: ${tracker.unit}` : `Type: Event Tracker`}
            </CardDescription>
          </div>
          <div className="flex items-center shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onTogglePin(tracker.id)} className="h-8 w-8 mr-1" title={tracker.isPinned ? "Unpin Tracker" : "Pin Tracker"}>
              {tracker.isPinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditTracker(tracker)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Tracker
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddDataPoint(tracker.id)}>
                  {addDataIcon}
                  {addDataButtonText}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteTracker(tracker.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Tracker
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          Created: {format(new Date(tracker.createdAt), "PPP")}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/trackers/${tracker.id}`}>View Details</Link>
        </Button>
        <Button onClick={() => onAddDataPoint(tracker.id)} className="w-full sm:w-auto" variant="default">
          {addDataIcon}
          {addDataButtonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
