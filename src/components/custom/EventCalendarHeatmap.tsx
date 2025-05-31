
"use client";

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Tracker, DataPoint } from '@/types';
import { format, getDaysInMonth, getYear, getMonth, getDate, startOfMonth, getDay, addYears, subYears, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCalendarHeatmapProps {
  tracker: Tracker;
  data: DataPoint[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function EventCalendarHeatmap({ tracker, data }: EventCalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date()); // Represents the year to display

  const eventMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(dp => {
      const dateKey = format(parseISO(dp.timestamp), 'yyyy-MM-dd');
      map.set(dateKey, (map.get(dateKey) || 0) + 1); // Count occurrences if needed, or just 1 for presence
    });
    return map;
  }, [data]);

  const yearToDisplay = getYear(currentDate);

  const getMonthData = (year: number, month: number) => {
    const firstDayOfMonth = startOfMonth(new Date(year, month));
    const startingDayOfWeek = getDay(firstDayOfMonth); // 0 for Sunday, 1 for Monday, etc.
    const daysInMonth = getDaysInMonth(firstDayOfMonth);
    const monthData: ({ date: Date; hasEvent: boolean; count: number } | null)[] = [];

    // Add empty cells for days before the start of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      monthData.push(null);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = format(date, 'yyyy-MM-dd');
      const eventCount = eventMap.get(dateKey) || 0;
      monthData.push({ date, hasEvent: eventCount > 0, count: eventCount });
    }
    return monthData;
  };

  const handlePrevYear = () => {
    setCurrentDate(prev => subYears(prev, 1));
  };

  const handleNextYear = () => {
    setCurrentDate(prev => addYears(prev, 1));
  };
  
  const baseColor = tracker.color || 'hsl(var(--primary))';
  // Function to generate shades. This is a simple example.
  // For HSL, you might decrease lightness for darker shades or vary saturation.
  // This example just provides one shade for "event occurred".
  const getEventColor = (hasEvent: boolean, count: number) => {
    if (!hasEvent) return 'bg-muted/50'; // Default for no event

    // Simple intensity logic:
    if (baseColor.startsWith('hsl(var(--')) {
      // For theme variables, it's harder to dynamically create shades without JS access to actual HSL values.
      // We'll use a fixed shade or a stepped approach.
      // This example just returns the base color if an event exists.
      // A more complex solution would involve parsing the CSS var or having predefined shades.
      return `bg-[${baseColor}]`; // This might not work directly for Tailwind JIT with dynamic hsl(var())
                                    // Better to use a known class or inline style with computed HSL.
                                    // For simplicity, let's use a hardcoded green scale for now if tracker.color is a theme var.
      // return `hsla(${getComputedStyle(document.documentElement).getPropertyValue(baseColor.slice(8,-1)).trim().split(' ')[0]}, 70%, 60%, 1)`
    }
    
    // If tracker.color is a direct HSL string e.g. "hsl(120, 60%, 70%)"
    // We can try to parse it. For now, just return it.
    // return `bg-[${baseColor}]`; // Same JIT issue
    
    // Fallback to a predefined green scale for simplicity if dynamic coloring is too complex for JIT
    if (count > 0 && count <= 1) return 'bg-green-300 dark:bg-green-700';
    if (count > 1 && count <= 3) return 'bg-green-500 dark:bg-green-500';
    if (count > 3) return 'bg-green-700 dark:bg-green-300';
    return 'bg-muted/50';
  };
  
  const trackerColorStyle = { backgroundColor: tracker.color || 'hsl(var(--primary))' };


  if (!tracker) return <p>Loading tracker data...</p>;

  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle>{tracker.name}: Event Heatmap</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevYear}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium tabular-nums">{yearToDisplay}</span>
              <Button variant="outline" size="icon" onClick={handleNextYear}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
           <CardDescription>Yearly overview of '{tracker.name}' occurrences. Each colored square represents a day the event was logged.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {MONTH_NAMES.map((monthName, monthIndex) => {
              const monthData = getMonthData(yearToDisplay, monthIndex);
              return (
                <div key={monthIndex} className="space-y-1">
                  <h3 className="text-sm font-medium text-center mb-1.5">{monthName} {yearToDisplay}</h3>
                  <div className="grid grid-cols-7 gap-0.5">
                    {WEEKDAYS.map(day => (
                      <div key={day} className="text-xs font-medium text-muted-foreground text-center pb-1">{day.charAt(0)}</div>
                    ))}
                    {monthData.map((dayObj, dayIdx) => (
                      <Tooltip key={dayIdx} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-5 w-full rounded-sm aspect-square",
                              dayObj ? (dayObj.hasEvent ? (tracker.color ? '' : getEventColor(true, dayObj.count)) : 'bg-muted/10 dark:bg-muted/30 hover:bg-muted/20 dark:hover:bg-muted/40') : 'bg-transparent',
                              "border border-transparent hover:border-primary/50"
                            )}
                            style={dayObj && dayObj.hasEvent && tracker.color ? trackerColorStyle : (dayObj && dayObj.hasEvent ? {backgroundColor: getEventColor(true, dayObj.count).replace('bg-','')} : {})}
                          >
                           <span className="sr-only">{dayObj ? format(dayObj.date, 'PPP') : ''}</span>
                          </div>
                        </TooltipTrigger>
                        {dayObj && (
                          <TooltipContent className="bg-background border shadow-lg rounded-md p-2 text-xs">
                            <p className="font-semibold">{format(dayObj.date, 'MMMM d, yyyy')}</p>
                            {dayObj.hasEvent ? (
                              <p className="text-green-600 dark:text-green-400">Event logged ({dayObj.count}x)</p>
                            ) : (
                              <p className="text-muted-foreground">No event</p>
                            )}
                            {data.filter(dp => isSameDay(parseISO(dp.timestamp), dayObj.date) && dp.notes).map(dp => dp.notes).join('; ') && (
                                <p className="italic mt-1 border-t pt-1">Notes: {data.filter(dp => isSameDay(parseISO(dp.timestamp), dayObj.date) && dp.notes).map(dp => dp.notes).join('; ')}</p>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

