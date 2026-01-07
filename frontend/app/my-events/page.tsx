"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyAttendedEvents } from "@/lib/attendance-api";
import { downloadCertificate } from "@/lib/certificate-api";
import { canSubmitFeedback } from "@/lib/feedback-api";
import { formatDateDDMMYYYY } from "@/lib/dateFormatter";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import FeedbackForm from "@/components/FeedbackForm";
import AdminSidebar from "@/components/AdminSidebar";
import HeaderLogoutButton from "@/components/HeaderLogoutButton";
import { getFileUrl } from "@/lib/event-api";
import {
  Calendar,
  Clock,
  Award,
  Eye,
  RefreshCw,
  MessageSquare,
  LogOut,
  CheckCircle,
  History,
} from "lucide-react";

interface AttendedEvent {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  status: "Upcoming" | "Open" | "Completed";
  poster_url: string | null;
  director_name: string;
  registration_status: "attended";
  was_registered: boolean;
  attendance: {
    marked_at: string;
    method: "QR" | "Code" | "Manual";
  };
}

export default function MyEventsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const { toast } = useToast();

  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCertificates, setDownloadingCertificates] = useState<{
    [eventId: number]: boolean;
  }>({});
  
  // Feedback state
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [feedbackEligibility, setFeedbackEligibility] = useState<{
    [eventId: number]: boolean;
  }>({});

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAttendedEvents();
  }, [token, router]);

  const fetchAttendedEvents = async () => {
    try {
      setLoading(true);
      const data = await getMyAttendedEvents();
      setAttendedEvents(data.events || []);
      
      // Check feedback eligibility for each completed event
      const eligibilityChecks = await Promise.all(
        (data.events || [])
          .filter((e: AttendedEvent) => e.status === "Completed")
          .map(async (event: AttendedEvent) => {
            try {
              const result = await canSubmitFeedback(event.id);
              return { eventId: event.id, canSubmit: result.can_submit };
            } catch {
              return { eventId: event.id, canSubmit: false };
            }
          })
      );
      
      const eligibilityMap: { [key: number]: boolean } = {};
      eligibilityChecks.forEach((check) => {
        eligibilityMap[check.eventId] = check.canSubmit;
      });
      setFeedbackEligibility(eligibilityMap);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch your events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (eventId: number) => {
    setDownloadingCertificates((prev) => ({ ...prev, [eventId]: true }));
    try {
      await downloadCertificate(eventId);
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate has been downloaded successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download certificate",
        variant: "destructive",
      });
    } finally {
      setDownloadingCertificates((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* SIDEBAR */}
      <AdminSidebar activePage="my-events" />

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <History size={28} className="text-indigo-400" />
              My Past Events
            </h2>
            <p className="text-sm text-slate-300">
              Events you've attended and your feedback history
            </p>
          </div>

          <div className="flex items-center gap-5">
            <NotificationBell />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white">{user?.name}</div>
                <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="rounded-full overflow-hidden border-2 border-transparent shadow hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                title="View Profile"
              >
                <UserAvatar size="md" />
              </button>

              <HeaderLogoutButton />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-8 py-10 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400">
                  {attendedEvents.length} event{attendedEvents.length !== 1 ? "s" : ""} attended
                </p>
              </div>
              <Button
                onClick={fetchAttendedEvents}
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                disabled={loading}
              >
                <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-400">Loading your events...</span>
              </div>
            ) : attendedEvents.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 border-dashed">
                <CardContent className="py-12 text-center">
                  <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">No events attended yet</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Check in to events to see them here
                  </p>
                  <Button
                    onClick={() => router.push("/event")}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Browse Events
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendedEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="bg-slate-800 border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
                  >
                    {/* Event Poster */}
                    <div className="h-32 bg-slate-700 overflow-hidden">
                      {event.poster_url ? (
                        <EventPoster posterUrl={event.poster_url} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <Calendar size={32} />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg line-clamp-1">
                          {event.title}
                        </h3>
                        <p className="text-sm text-slate-400">{event.director_name}</p>
                      </div>

                      {/* Date using dd/mm/yyyy format */}
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar size={14} />
                        <span>{formatDateDDMMYYYY(event.start_date)}</span>
                        {event.start_time && (
                          <>
                            <Clock size={14} className="ml-2" />
                            <span>{event.start_time.substring(0, 5)}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          className={
                            event.status === "Completed"
                              ? "bg-slate-700 text-slate-300"
                              : event.status === "Open"
                              ? "bg-green-700 text-green-100"
                              : "bg-blue-700 text-blue-100"
                          }
                        >
                          {event.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <CheckCircle size={12} className="text-green-500" />
                          {event.attendance.method}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          onClick={() => router.push(`/view_event?id=${event.id}`)}
                        >
                          <Eye size={16} className="mr-2" />
                          View
                        </Button>
                        
                        {event.status === "Completed" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleDownloadCertificate(event.id)}
                              disabled={downloadingCertificates[event.id]}
                            >
                              {downloadingCertificates[event.id] ? (
                                <>
                                  <RefreshCw size={16} className="mr-2 animate-spin" />
                                  ...
                                </>
                              ) : (
                                <>
                                  <Award size={16} className="mr-2" />
                                  Cert
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant={feedbackEligibility[event.id] ? "default" : "outline"}
                              className={
                                feedbackEligibility[event.id]
                                  ? "flex-1 bg-purple-600 hover:bg-purple-700"
                                  : "flex-1 bg-slate-700 border-slate-600 text-slate-400 cursor-default"
                              }
                              onClick={() => {
                                if (feedbackEligibility[event.id]) {
                                  setFeedbackModalEvent({
                                    id: event.id,
                                    title: event.title,
                                  });
                                }
                              }}
                              disabled={!feedbackEligibility[event.id]}
                            >
                              <MessageSquare size={16} className="mr-1" />
                              {feedbackEligibility[event.id] ? "Feedback" : "Sent ✓"}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Feedback Modal Overlay */}
      {feedbackModalEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <FeedbackForm
            eventId={feedbackModalEvent.id}
            eventTitle={feedbackModalEvent.title}
            onClose={() => setFeedbackModalEvent(null)}
            onSuccess={() => {
              setFeedbackModalEvent(null);
              setFeedbackEligibility((prev) => ({
                ...prev,
                [feedbackModalEvent.id]: false,
              }));
            }}
          />
        </div>
      )}
    </div>
  );
}

// Event Poster Component - Loads poster with authentication
function EventPoster({ posterUrl }: { posterUrl: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!posterUrl) {
      setImageUrl(null);
      setImageError(false);
      setLoading(false);
      return;
    }

    let url = "";
    if (posterUrl.startsWith("http")) {
      url = posterUrl;
    } else if (posterUrl.startsWith("/api/v1")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");
      url = `${baseUrl}${posterUrl}`;
    } else {
      url = getFileUrl(posterUrl);
    }

    const token = localStorage.getItem("token");
    if (token) {
      setLoading(true);
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Failed: ${response.status}`);
          return response.blob();
        })
        .then((blob) => {
          setImageUrl(URL.createObjectURL(blob));
          setImageError(false);
        })
        .catch(() => setImageError(true))
        .finally(() => setLoading(false));
    } else {
      setImageUrl(url);
      setLoading(false);
    }

    return () => {
      if (imageUrl?.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [posterUrl]);

  if (loading) {
    return (
      <div className="w-full h-full bg-slate-700 flex items-center justify-center">
        <span className="text-xs text-slate-400">Loading...</span>
      </div>
    );
  }

  if (imageError || !imageUrl) {
    return (
      <div className="w-full h-full bg-slate-700 flex items-center justify-center">
        <Calendar size={32} className="text-slate-500" />
      </div>
    );
  }

  return <img src={imageUrl} alt="Event Poster" className="w-full h-full object-cover" />;
}
