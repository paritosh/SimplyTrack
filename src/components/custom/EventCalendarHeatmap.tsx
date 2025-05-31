
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added Tabs
import type { Tracker, DataPoint } from '@/types';
import { 
  format, 
  getDaysInMonth, 
  getYear, 
  getMonth, 
  getDate, 
  startOfMonth, 
  getDay, 
  addYears, 
  subYears,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCalendarHeatmapProps {
  tracker: Tracker;
  data: DataPoint[];
}

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; 
const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; 

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

type CalendarDay = { date: Date; hasEvent: boolean; count: number; notes: string[] };
type ViewMode = 'week' | 'month' | 'year';

export function EventCalendarHeatmap({ tracker, data }: EventCalendarHeatmapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('month'); // Default to month view
  const [displayDate, setDisplayDate] = useState(new Date()); 

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const eventMap = useMemo(() => {
    const map = new Map<string, { count: number, notes: string[] }>();
    data.forEach(dp => {
      const dateKey = format(parseISO(dp.timestamp), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || { count: 0, notes: [] };
      existing.count += 1;
      if (dp.notes) {
        existing.notes.push(dp.notes);
      }
      map.set(dateKey, existing);
    });
    return map;
  }, [data]);

  const getMonthDataArray = useCallback((year: number, month: number): (CalendarDay | null)[] => {
    const firstDayOfMonth = startOfMonth(new Date(year, month));
    const startingDayOfWeek = getDay(firstDayOfMonth); 
    const daysInMonth = getDaysInMonth(firstDayOfMonth);
    const monthData: (CalendarDay | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      monthData.push(null); 
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = format(date, 'yyyy-MM-dd');
      const eventDetails = eventMap.get(dateKey) || { count: 0, notes: [] };
      monthData.push({ date, hasEvent: eventDetails.count > 0, count: eventDetails.count, notes: eventDetails.notes });
    }
    return monthData;
  }, [eventMap]);

  const getWeekDataArray = useCallback((currentDate: Date): CalendarDay[] => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    const daysInWeek = eachDayOfInterval({ start, end });
    
    return daysInWeek.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const eventDetails = eventMap.get(dateKey) || { count: 0, notes: [] };
      return { date, hasEvent: eventDetails.count > 0, count: eventDetails.count, notes: eventDetails.notes };
    });
  }, [eventMap]);


  const handlePrev = () => {
    if (viewMode === 'year') setDisplayDate(prev => subYears(prev, 1));
    else if (viewMode === 'month') setDisplayDate(prev => subMonths(prev, 1));
    else if (viewMode === 'week') setDisplayDate(prev => subWeeks(prev, 1));
  };

  const handleNext = () => {
    if (viewMode === 'year') setDisplayDate(prev => addYears(prev, 1));
    else if (viewMode === 'month') setDisplayDate(prev => addMonths(prev, 1));
    else if (viewMode === 'week') setDisplayDate(prev => addWeeks(prev, 1));
  };

  const switchToMonthView = (year: number, monthIndex: number) => {
    setDisplayDate(new Date(year, monthIndex, 1));
    setViewMode('month');
  };
  
  const getDayClassAndStyle = (dayObj: CalendarDay | null, size: 'sm' | 'md' | 'lg'): { className: string; style: React.CSSProperties } => {
    let sizeClass = "";
    switch(size) {
      case 'sm': sizeClass = "h-auto w-full"; break; 
      case 'md': sizeClass = "h-10 w-10 md:h-12 md:w-12"; break;
      case 'lg': sizeClass = "h-14 w-14 md:h-16 md:w-16"; break; 
    }
    const baseClasses = cn(sizeClass, "rounded-sm aspect-square border border-transparent hover:border-primary/50 transition-colors duration-150 relative flex items-center justify-center");

    if (!dayObj) return { className: cn(baseClasses, 'bg-transparent pointer-events-none'), style: {} };

    if (dayObj.hasEvent) {
      // Always use green scale for event days
      if (dayObj.count >= 5) return { className: cn(baseClasses, 'bg-green-700 dark:bg-green-300'), style: {} };
      if (dayObj.count >= 3) return { className: cn(baseClasses, 'bg-green-600 dark:bg-green-400'), style: {} };
      if (dayObj.count >= 2) return { className: cn(baseClasses, 'bg-green-500 dark:bg-green-500'), style: {} };
      if (dayObj.count >= 1) return { className: cn(baseClasses, 'bg-green-400 dark:bg-green-600'), style: {} };
      return { className: cn(baseClasses, 'bg-green-300 dark:bg-green-700'), style: {} }; 
    }
    return { className: cn(baseClasses, 'bg-muted/20 dark:bg-muted/40 hover:bg-muted/30 dark:hover:bg-muted/50'), style: {} };
  };

  const getCurrentDateRangeDisplay = () => {
    if (viewMode === 'year') return format(displayDate, 'yyyy');
    if (viewMode === 'month') return format(displayDate, 'MMMM yyyy');
    if (viewMode === 'week') {
      const start = startOfWeek(displayDate, { weekStartsOn: 0 });
      const end = endOfWeek(displayDate, { weekStartsOn: 0 });
      if (getMonth(start) === getMonth(end)) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return '';
  };

  const getCardDescription = () => {
    if (viewMode === 'year') return `Yearly overview of '${tracker.name}' occurrences. Click a month for details.`;
    if (viewMode === 'month') return `Monthly overview for ${format(displayDate, 'MMMM yyyy')}.`;
    if (viewMode === 'week') return `Weekly overview for ${format(startOfWeek(displayDate, { weekStartsOn: 0 }), 'MMM d')} - ${format(endOfWeek(displayDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}.`;
    return 'Event occurrences heatmap.';
  };

  if (!isMounted || !tracker) return <div className="p-4 text-muted-foreground">Loading tracker data...</div>;

  const currentYear = getYear(displayDate);
  const currentMonthIndex = getMonth(displayDate);
  const weekData = viewMode === 'week' ? getWeekDataArray(displayDate) : [];

  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>{tracker.name}: Event Heatmap</CardTitle>
              <CardDescription>{getCardDescription()}</CardDescription>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <Button variant="outline" size="icon" onClick={handlePrev} aria-label={`Previous ${viewMode}`}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-base sm:text-lg font-medium tabular-nums whitespace-nowrap text-center min-w-[120px] sm:min-w-[180px]">
                  {getCurrentDateRangeDisplay()}
                </span>
                <Button variant="outline" size="icon" onClick={handleNext} aria-label={`Next ${viewMode}`}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {viewMode === 'year' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-4 md:gap-x-6 gap-y-4 sm:gap-y-6 md:gap-y-8">
              {MONTH_NAMES.map((monthName, monthIndex) => {
                const monthData = getMonthDataArray(currentYear, monthIndex);
                return (
                  <div key={monthIndex} className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center text-sm font-medium mb-1.5 h-auto py-1 px-2 hover:bg-accent"
                      onClick={() => switchToMonthView(currentYear, monthIndex)}
                      aria-label={`View ${monthName} ${currentYear}`}
                    >
                      {monthName}
                    </Button>
                    <div className="grid grid-cols-7 gap-px">
                      {WEEKDAYS_SHORT.map((day, weekdayIndex) => (
                        <div key={`${monthIndex}-${day}-${weekdayIndex}`} className="text-xs font-medium text-muted-foreground text-center pb-0.5">{day}</div>
                      ))}
                      {monthData.map((dayObj, dayIdx) => {
                        const { className: dayClassName, style: dayStyle } = getDayClassAndStyle(dayObj, 'sm');
                        return (
                          <Tooltip key={dayIdx} delayDuration={100}>
                            <TooltipTrigger asChild>
                              <div className={dayClassName} style={dayStyle}>
                                <span className="sr-only">{dayObj ? format(dayObj.date, 'PPP') : ''}</span>
                              </div>
                            </TooltipTrigger>
                            {dayObj && (
                              <TooltipContent className="bg-background border shadow-lg rounded-md p-2 text-xs max-w-xs">
                                <p className="font-semibold">{format(dayObj.date, 'MMMM d, yyyy')}</p>
                                {dayObj.hasEvent ? (
                                  <p style={{color: tracker.color || 'hsl(var(--chart-2))'}} className="font-medium">Event logged ({dayObj.count}x)</p>
                                ) : (
                                  <p className="text-muted-foreground">No event</p>
                                )}
                                {dayObj.notes.length > 0 && (
                                    <p className="italic mt-1 border-t pt-1">Notes: {dayObj.notes.join('; ')}</p>
                                )}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'month' && (
            <div className="max-w-md mx-auto"> 
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS_LONG.map(day => (
                  <div key={day} className="text-sm font-medium text-muted-foreground text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getMonthDataArray(currentYear, currentMonthIndex).map((dayObj, dayIdx) => {
                   const { className: dayClassName, style: dayStyle } = getDayClassAndStyle(dayObj, 'md');
                  return (
                    <Tooltip key={dayIdx} delayDuration={100}>
                      <TooltipTrigger asChild>
                         <div className={dayClassName} style={dayStyle}>
                            <span className="sr-only">{dayObj ? format(dayObj.date, 'PPP') : ''}</span>
                            {dayObj && <span className="text-black dark:text-white mix-blend-difference font-medium">{getDate(dayObj.date)}</span>}
                          </div>
                      </TooltipTrigger>
                      {dayObj && (
                        <TooltipContent className="bg-background border shadow-lg rounded-md p-2 text-xs max-w-xs">
                          <p className="font-semibold">{format(dayObj.date, 'MMMM d, yyyy')}</p>
                          {dayObj.hasEvent ? (
                             <p style={{color: tracker.color || 'hsl(var(--chart-2))'}} className="font-medium">Event logged ({dayObj.count}x)</p>
                          ) : (
                            <p className="text-muted-foreground">No event</p>
                          )}
                           {dayObj.notes.length > 0 && (
                              <p className="italic mt-1 border-t pt-1">Notes: {dayObj.notes.join('; ')}</p>
                          )}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="max-w-xl mx-auto">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekData.map(dayObj => (
                  <div key={format(dayObj.date, 'E')} className="text-sm font-medium text-muted-foreground text-center">
                    {format(dayObj.date, 'E')} {/* Short day name e.g., Mon */}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekData.map((dayObj, dayIdx) => {
                  const { className: dayClassName, style: dayStyle } = getDayClassAndStyle(dayObj, 'lg');
                  return (
                    <Tooltip key={dayIdx} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div className={dayClassName} style={dayStyle}>
                          <span className="sr-only">{format(dayObj.date, 'PPP')}</span>
                          <span className="text-black dark:text-white mix-blend-difference font-medium text-lg">
                            {getDate(dayObj.date)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background border shadow-lg rounded-md p-2 text-xs max-w-xs">
                        <p className="font-semibold">{format(dayObj.date, 'MMMM d, yyyy')}</p>
                        {dayObj.hasEvent ? (
                          <p style={{color: tracker.color || 'hsl(var(--chart-2))'}} className="font-medium">Event logged ({dayObj.count}x)</p>
                        ) : (
                          <p className="text-muted-foreground">No event</p>
                        )}
                        {dayObj.notes.length > 0 && (
                          <p className="italic mt-1 border-t pt-1">Notes: {dayObj.notes.join('; ')}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
