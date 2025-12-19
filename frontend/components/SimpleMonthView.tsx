"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Event } from "@/lib/event-api";

interface SimpleMonthViewProps {
  events: Event[];
  onDateClick: (date: Date, dateEvents: Event[]) => void;
}

/**
 * Timezone-safe date parsing helper
 * Prevents timezone-related date shifting by using UTC
 */
const parseDate = (dateString: string): Date => {
  const parts = dateString.split("-");
  return new Date(
    Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  );
};

interface DayObject {
  day: number | null;
  date: Date | null;
  dateKey: string | null;
  eventType: "registered" | "open" | "none";
  isToday: boolean;
}

/**
 * SimpleMonthView Calendar Component
 * Interactive monthly calendar with event status coloring, hover previews,
 * multi-event selection modal, and timezone-safe date handling.
 */
export default function SimpleMonthView({
  events,
  onDateClick,
}: SimpleMonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, currentYear] = [
    currentDate.getMonth(),
    currentDate.getFullYear(),
  ];
  const [hoveredEvents, setHoveredEvents] = useState<Event[] | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  // Multi-event modal state
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[] | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Pre-process events into a map keyed by date
  const eventsMap = useMemo(() => {
    const map = new Map<string, { events: Event[]; isRegistered: boolean }>();
    events.forEach((event) => {
      const dateKey = parseDate(event.start_date).toISOString().split("T")[0];

      let entry = map.get(dateKey) || { events: [], isRegistered: false };
      entry.events.push(event);

      if (event.is_registered) {
        entry.isRegistered = true;
      }

      map.set(dateKey, entry);
    });
    return map;
  }, [events]);

  // Build calendar grid
  const daysInMonth = useMemo(() => {
    const date = parseDate(`${currentYear}-${currentMonth + 1}-01`);
    const days: DayObject[] = [];
    const firstDayOfWeek = date.getUTCDay();

    // Empty leading cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({
        day: null,
        date: null,
        dateKey: null,
        eventType: "none",
        isToday: false,
      });
    }

    let currentDay = 1;
    let tempDate = parseDate(`${currentYear}-${currentMonth + 1}-${currentDay}`);

    while (tempDate.getUTCMonth() === currentMonth) {
      const dayNum = tempDate.getUTCDate();
      const dateKey = tempDate.toISOString().split("T")[0];

      const today = new Date();
      const todayKey = parseDate(
        `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`
      )
        .toISOString()
        .split("T")[0];
      const isToday = dateKey === todayKey;

      const eventData = eventsMap.get(dateKey);
      let eventType: "registered" | "open" | "none" = "none";

      if (eventData) {
        if (eventData.isRegistered) {
          eventType = "registered";
        } else if (eventData.events.length > 0) {
          eventType = "open";
        }
      }

      days.push({
        day: dayNum,
        date: new Date(tempDate),
        dateKey,
        eventType,
        isToday,
      });

      tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    }

    return days;
  }, [currentMonth, currentYear, eventsMap]);

  const changeMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Hover handlers
  const handleMouseEnter = (
    e: React.MouseEvent<HTMLButtonElement>,
    dayObj: DayObject
  ) => {
    if (dayObj.eventType !== "none" && dayObj.dateKey) {
      const dayEvents = eventsMap.get(dayObj.dateKey)?.events || [];
      setHoveredEvents(dayEvents);

      const rect = e.currentTarget.getBoundingClientRect();
      const calendarRect =
        e.currentTarget
          .closest(".calendar-container")
          ?.getBoundingClientRect() || { left: 0, width: 0 };

      setHoverPosition({
        top: rect.bottom + 10,
        left: calendarRect.left + calendarRect.width / 2,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredEvents(null);
  };

  // Click handler - opens modal for multi-event selection
  const handleDayClick = (dayObj: DayObject) => {
    if (!dayObj.date || !dayObj.dateKey) return;

    const dayEvents = eventsMap.get(dayObj.dateKey)?.events || [];

    if (dayEvents.length > 0) {
      setSelectedDayEvents(dayEvents);
      setSelectedDate(dayObj.date);
    } else {
      onDateClick(dayObj.date, []);
    }
  };

  const closeModal = () => {
    setSelectedDayEvents(null);
    setSelectedDate(null);
  };

  const handleEventSelect = (event: Event) => {
    if (selectedDate) {
      onDateClick(selectedDate, [event]);
    }
    closeModal();
  };

  // Legend component
  const CalendarLegend = () => (
    <div className="flex justify-center items-center space-x-6 text-xs text-slate-400 mt-8 px-1 mx-auto">
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-indigo-600 border border-indigo-700 shadow-sm"></span>
        <span>Today</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-emerald-50 border border-emerald-300 shadow-sm"></span>
        <span>Registered</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-amber-50 border border-amber-300 shadow-sm"></span>
        <span>Open/Not Registered</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-4 bg-slate-800 rounded-lg relative calendar-container">
        {/* Hover Tooltip */}
        {hoveredEvents && hoveredEvents.length > 0 && (
          <div
            style={{
              position: "fixed",
              top: hoverPosition.top,
              left: hoverPosition.left,
              transform: "translateX(-50%)",
              zIndex: 50,
            }}
            className="bg-gray-800 text-white p-3 rounded-lg shadow-2xl pointer-events-none min-w-[200px] max-w-[300px]"
          >
            <h4 className="font-bold text-sm mb-1 border-b border-gray-600 pb-1">
              Events on{" "}
              {parseDate(hoveredEvents[0].start_date).toLocaleDateString(
                "default",
                { month: "short", day: "numeric" }
              )}
            </h4>
            <ul className="list-disc list-inside space-y-1">
              {hoveredEvents.map((event) => (
                <li key={event.id} className="text-xs">
                  <strong>{event.title}</strong> ({event.start_time || "TBD"})
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Header: Month and Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeMonth(-1)}
            className="text-slate-300 hover:bg-slate-700"
          >
            <ChevronLeft size={20} />
          </Button>
          <h3 className="text-xl font-extrabold text-white">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => changeMonth(1)}
            className="text-slate-300 hover:bg-slate-700"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {/* Day Names */}
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="font-semibold text-indigo-400 pt-1 pb-2 uppercase text-xs tracking-wider"
            >
              {day}
            </div>
          ))}

          {/* Days */}
          {daysInMonth.map((dayObj, index) => {
            const isRegisteredDay = dayObj.eventType === "registered";
            const isOpenDay = dayObj.eventType === "open";

            return (
              <button
                key={index}
                onClick={() => handleDayClick(dayObj)}
                onMouseEnter={(e) => handleMouseEnter(e, dayObj)}
                onMouseLeave={handleMouseLeave}
                disabled={!dayObj.day}
                className={`
                  min-h-[5rem] w-full flex flex-col items-start justify-start p-2 rounded-lg relative transition-all duration-150 border
                  ${!dayObj.day ? "border-transparent cursor-default" : "border-slate-600 hover:shadow-md hover:border-slate-500"}
                  ${dayObj.isToday ? "bg-indigo-600 text-white font-bold border-indigo-700 shadow-lg" : ""}
                  ${isRegisteredDay && !dayObj.isToday ? "bg-emerald-900/40 text-emerald-400 font-medium border-emerald-700" : ""}
                  ${isOpenDay && !dayObj.isToday ? "bg-amber-900/40 text-amber-400 font-medium border-amber-700" : ""}
                  ${dayObj.day && !dayObj.isToday && dayObj.eventType === "none" ? "bg-slate-700 text-white hover:bg-slate-600" : ""}
                  ${!dayObj.day ? "text-gray-400" : ""}
                `}
              >
                <span className="text-sm">{dayObj.day}</span>

                {dayObj.eventType !== "none" && (
                  <div className="mt-auto flex gap-1 pt-2">
                    {dayObj.eventType === "registered" && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    )}
                    {dayObj.eventType === "open" && (
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <CalendarLegend />
      </div>

      {/* Multi-Event Picker Modal */}
      {selectedDayEvents && selectedDayEvents.length > 0 && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">
                Events on{" "}
                {selectedDate?.toLocaleDateString("default", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Event List */}
            <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
              {selectedDayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md
                    ${
                      event.is_registered
                        ? "bg-emerald-900/40 border-emerald-700 hover:bg-emerald-900/60"
                        : "bg-amber-900/40 border-amber-700 hover:bg-amber-900/60"
                    }`}
                >
                  <div className="font-semibold text-white">{event.title}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {event.start_time
                      ? event.start_time.substring(0, 5)
                      : "Time TBD"}
                    {" • "}
                    {event.is_registered ? "Registered" : "Not Registered"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
