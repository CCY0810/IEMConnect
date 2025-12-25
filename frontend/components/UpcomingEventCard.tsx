"use client";

import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Event } from "@/lib/event-api";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface UpcomingEventCardProps {
  event: Event;
  router: AppRouterInstance;
}

/**
 * UpcomingEventCard Component
 * Displays a single upcoming event in a clickable card format.
 * 
 * @param event - Event object with id, title, start_date, start_time, is_registered
 * @param router - Next.js router instance for navigation
 */
export default function UpcomingEventCard({
  event,
  router,
}: UpcomingEventCardProps) {
  const date = new Date(event.start_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = event.start_time ? event.start_time.substring(0, 5) : "TBD";
  const isRegistered = event.is_registered;

  return (
    <button
      onClick={() => router.push(`/view_event?id=${event.id}`)}
      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 group
        ${
          isRegistered
            ? "bg-emerald-900/40 border-emerald-700 hover:bg-emerald-900/50"
            : "bg-amber-900/40 border-amber-700 hover:bg-amber-900/50"
        }`}
    >
      {/* Date Badge */}
      <div
        className={`flex flex-col items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg shadow-sm
          ${isRegistered ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}
      >
        <span className="text-xs font-bold">{date.split(" ")[0]}</span>
        <span className="text-base font-extrabold -mt-1">
          {date.split(" ")[1]}
        </span>
      </div>

      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base text-white truncate">
          {event.title}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {time} |{" "}
          {isRegistered ? (
            <Badge className="bg-emerald-500 text-white shadow-sm">
              Registered
            </Badge>
          ) : (
            <Badge className="bg-amber-500 text-white shadow-sm">
              Not Registered
            </Badge>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight
        size={18}
        className="text-slate-400 group-hover:text-indigo-400 flex-shrink-0 transition-colors"
      />
    </button>
  );
}
