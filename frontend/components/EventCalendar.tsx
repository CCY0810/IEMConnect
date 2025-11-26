"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Event } from "@/lib/event-api";

interface EventCalendarProps {
  events: Event[];
  onDateClick?: (date: Date, events: Event[]) => void;
}

export default function EventCalendar({ events, onDateClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      const eventDateStr = eventDate.toISOString().split("T")[0];
      return eventDateStr === dateStr;
    });
  };

  // Check if user is registered for events on a date
  const hasRegisteredEvents = (date: Date): boolean => {
    const dateEvents = getEventsForDate(date);
    return dateEvents.some((event) => event.is_registered === true);
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-8 w-8"
        >
          <ChevronLeft size={16} />
        </Button>
        <h3 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h3>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateEvents = getEventsForDate(date);
          const hasEvents = dateEvents.length > 0;
          const isRegistered = hasRegisteredEvents(date);
          const isToday =
            date.toDateString() === new Date().toDateString();

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick?.(date, dateEvents)}
              className={`
                aspect-square rounded-md text-sm font-medium transition-colors
                flex flex-col items-center justify-center p-1
                ${isToday ? "ring-2 ring-blue-500" : ""}
                ${
                  hasEvents
                    ? isRegistered
                      ? "bg-blue-100 hover:bg-blue-200 text-blue-900"
                      : "bg-orange-100 hover:bg-orange-200 text-orange-900"
                    : "hover:bg-slate-100 text-slate-700"
                }
                ${dateEvents.length > 0 ? "cursor-pointer" : ""}
              `}
              title={
                dateEvents.length > 0
                  ? `${dateEvents.length} event(s) - ${
                      isRegistered ? "Registered" : "Not Registered"
                    }`
                  : undefined
              }
            >
              <span>{date.getDate()}</span>
              {hasEvents && (
                <span className="text-xs mt-0.5">
                  {dateEvents.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
          <span>Registered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 border border-orange-300"></div>
          <span>Not Registered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-500"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

