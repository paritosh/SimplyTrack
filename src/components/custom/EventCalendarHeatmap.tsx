
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  isSameDay, 
  parseISO,
  addMonths,
  subMonths,
  setMonth
} from 'date-fns';
import { cn } from '@/lib/utils';

interface EventCalendarHeatmapProps {
  tracker: Tracker;
  data: DataPoint[];
}

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // For yearly view month header
const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // For monthly view header

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

type CalendarDay = { date: Date; hasEvent: boolean; count: number; notes: string[] };

export function EventCalendarHeatmap({ tracker, data }: EventCalendarHeatmapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year');
  const [displayDate, setDisplayDate] = useState(new Date()); // Controls current year in year view, or current month in month view

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
    return eventMap;
  }, [data]);

  const currentYear = getYear(displayDate);
  const currentMonthIndex = getMonth(displayDate);

  const getMonthDataArray = (year: number, month: number): (CalendarDay | null)[] => {
    const firstDayOfMonth = startOfMonth(new Date(year, month));
    const startingDayOfWeek = getDay(firstDayOfMonth); // 0 (Sun) to 6 (Sat)
    const daysInMonth = getDaysInMonth(firstDayOfMonth);
    const monthData: (CalendarDay | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      monthData.push(null); // Add nulls for days before the first day of the month
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = format(date, 'yyyy-MM-dd');
      const eventDetails = eventMap.get(dateKey) || { count: 0, notes: [] };
      monthData.push({ date, hasEvent: eventDetails.count > 0, count: eventDetails.count, notes: eventDetails.notes });
    }
    return monthData;
  };

  const handlePrevYear = () => setDisplayDate(prev => subYears(prev, 1));
  const handleNextYear = () => setDisplayDate(prev => addYears(prev, 1));
  const handlePrevMonth = () => setDisplayDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setDisplayDate(prev => addMonths(prev, 1));

  const switchToMonthView = (monthIndex: number) => {
    setDisplayDate(current => new Date(getYear(current), monthIndex, 1));
    setViewMode('month');
  };
  const switchToYearView = () => setViewMode('year');
  
  const getDayClassAndStyle = (dayObj: CalendarDay | null, inMonthView: boolean = false): { className: string; style: React.CSSProperties } => {
    const sizeClass = inMonthView ? "h-10 w-10 md:h-12 md:w-12" : "h-5 w-full"; // Adjusted size for year view
    const baseClasses = cn(sizeClass, "rounded-sm aspect-square border border-transparent hover:border-primary/50 transition-colors duration-150 relative flex items-center justify-center");

    if (!dayObj) return { className: cn(baseClasses, 'bg-transparent pointer-events-none'), style: {} };

    if (dayObj.hasEvent) {
      if (tracker.color) {
        const opacity = Math.min(1, 0.4 + dayObj.count * 0.2).toFixed(2);
        const customColorWithOpacity = tracker.color.startsWith('hsl(var(--') 
          ? `hsla(var(${tracker.color.slice(8,-1)}), ${opacity})` 
          : (tracker.color.startsWith('hsl(') && tracker.color.endsWith(')') 
              ? tracker.color.replace(')', `, ${opacity})`).replace('hsl(', 'hsla(')
              : tracker.color); // If it's a direct hex/rgb, opacity might not apply this way.
                               // Consider if tracker.color can be hex. If so, need a robust way to add alpha.
                               // For now, assuming HSL from theme or direct HSL strings.

        return { className: cn(baseClasses), style: { backgroundColor: customColorWithOpacity } };
      }
      // Default green intensity scale if no tracker.color
      if (dayObj.count >= 5) return { className: cn(baseClasses, 'bg-green-700 dark:bg-green-300'), style: {} };
      if (dayObj.count >= 3) return { className: cn(baseClasses, 'bg-green-600 dark:bg-green-400'), style: {} };
      if (dayObj.count >= 2) return { className: cn(baseClasses, 'bg-green-500 dark:bg-green-500'), style: {} };
      if (dayObj.count >= 1) return { className: cn(baseClasses, 'bg-green-400 dark:bg-green-600'), style: {} };
       return { className: cn(baseClasses, 'bg-green-300 dark:bg-green-700'), style: {} }; // Fallback if count is weirdly 0 but hasEvent is true
    }
    return { className: cn(baseClasses, 'bg-muted/20 dark:bg-muted/40 hover:bg-muted/30 dark:hover:bg-muted/50'), style: {} };
  };

  if (!isMounted || !tracker) return <div className="p-4 text-muted-foreground">Loading tracker data...</div>;

  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-1">
              <CardTitle>
                {tracker.name}: Event Heatmap 
                {viewMode === 'month' && ` - ${MONTH_NAMES[currentMonthIndex]} ${currentYear}`}
              </CardTitle>
              <CardDescription>
                {viewMode === 'year' 
                  ? `Yearly overview of '${tracker.name}' occurrences. Click a month for details.` 
                  : `Monthly overview for ${MONTH_NAMES[currentMonthIndex]}, ${currentYear}.`}
                 Each colored square represents a day the event was logged.
              </CardDescription>
            </div>
            {viewMode === 'year' && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevYear} aria-label="Previous year">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium tabular-nums">{currentYear}</span>
                <Button variant="outline" size="icon" onClick={handleNextYear} aria-label="Next year">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            {viewMode === 'month' && (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                 <Button variant="outline" onClick={switchToYearView} className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Year View
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium tabular-nums whitespace-nowrap">{MONTH_NAMES[currentMonthIndex]} {currentYear}</span>
                  <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {viewMode === 'year' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
              {MONTH_NAMES.map((monthName, monthIndex) => {
                const monthData = getMonthDataArray(currentYear, monthIndex);
                return (
                  <div key={monthIndex} className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center text-sm font-medium mb-1.5 h-auto py-1 px-2 hover:bg-accent"
                      onClick={() => switchToMonthView(monthIndex)}
                      aria-label={`View ${monthName} ${currentYear}`}
                    >
                      {monthName} {currentYear}
                    </Button>
                    <div className="grid grid-cols-7 gap-px"> {/* gap-px for thin lines between cells */}
                      {WEEKDAYS_SHORT.map((day, weekdayIndex) => (
                        <div key={`${monthIndex}-${day}-${weekdayIndex}`} className="text-xs font-medium text-muted-foreground text-center pb-0.5">{day}</div>
                      ))}
                      {monthData.map((dayObj, dayIdx) => {
                        const { className: dayClassName, style: dayStyle } = getDayClassAndStyle(dayObj, false);
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
            <div className="max-w-md mx-auto"> {/* Or adjust max-width as needed */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS_LONG.map(day => (
                  <div key={day} className="text-sm font-medium text-muted-foreground text-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getMonthDataArray(currentYear, currentMonthIndex).map((dayObj, dayIdx) => {
                   const { className: dayClassName, style: dayStyle } = getDayClassAndStyle(dayObj, true);
                  return (
                    <Tooltip key={dayIdx} delayDuration={100}>
                      <TooltipTrigger asChild>
                         <div className={dayClassName} style={dayStyle}>
                            <span className="sr-only">{dayObj ? format(dayObj.date, 'PPP') : ''}</span>
                            {dayObj && <span className="text-xs text-foreground/70 mix-blend-difference font-medium">{getDate(dayObj.date)}</span>}
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
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

    