"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { checkInToEvent, getMyAttendedEvents } from "@/lib/attendance-api";
import { downloadCertificate } from "@/lib/certificate-api";
import NotificationBell from "@/components/NotificationBell";
import { getFileUrl } from "@/lib/event-api";
import {
  CheckCircle,
  QrCode,
  Keyboard,
  Calendar,
  Clock,
  Award,
  Eye,
  RefreshCw,
} from "lucide-react";

interface AttendanceResult {
  event: {
    id: number;
    title: string;
    date: string;
  };
  attendance: {
    id: number;
    marked_at: string;
    method: string;
    status: string;
  };
}

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

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [attendanceResult, setAttendanceResult] =
    useState<AttendanceResult | null>(null);
  
  // Attended events state
  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([]);
  const [loadingAttendedEvents, setLoadingAttendedEvents] = useState(false);
  const [downloadingCertificates, setDownloadingCertificates] = useState<{
    [eventId: number]: boolean;
  }>({});
  const [activeTab, setActiveTab] = useState("give-attendance");

  // Pre-fill code from URL parameter if provided (QR code scan)
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setCode(codeFromUrl);
    }
  }, [searchParams]);

  // Fetch attended events on mount
  useEffect(() => {
    if (token) {
      fetchAttendedEvents();
    }
  }, [token]);

  const fetchAttendedEvents = async () => {
    setLoadingAttendedEvents(true);
    try {
      const data = await getMyAttendedEvents();
      // Ensure we set the events array even if empty, and handle all statuses
      const events = data.events || [];
      
      // Filter out any events that might be null or invalid
      const validEvents = events.filter((e: AttendedEvent) => e && e.id && e.title);
      setAttendedEvents(validEvents);
      
    } catch (err: any) {
      console.error("Failed to fetch attended events:", err);
      console.error("Error details:", err.response?.data);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to load attended events. Please try again.",
        variant: "destructive",
      });
      // Set empty array on error to show proper empty state
      setAttendedEvents([]);
    } finally {
      setLoadingAttendedEvents(false);
    }
  };

  // Redirect if not logged in
  if (!token) {
    router.push("/login");
    return null;
  }

  const handleCheckIn = async () => {
    if (!code) {
      setMessage({
        type: "error",
        text: "Please enter the attendance code",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await checkInToEvent(code, "Code");
      setAttendanceResult(result);
      setMessage({
        type: "success",
        text: result.message || "Attendance marked successfully!",
      });
      // Refresh attended events list after successful check-in
      await fetchAttendedEvents();
      // Switch to attended tab after a short delay
      setTimeout(() => {
        setActiveTab("attended");
      }, 2000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to check in",
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

  const handleReset = () => {
    setCode("");
    setMessage(null);
    setAttendanceResult(null);
  };

  return (
    // APPLY DARK BACKGROUND
    <div className="min-h-screen bg-slate-900 py-12 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">
              Event Attendance
            </h1>
            <p className="text-slate-400">
              Check in to events or view your attendance history
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <NotificationBell />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-6 bg-slate-800 border border-slate-700">
            <TabsTrigger 
              value="give-attendance"
              className="text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Give Attendance
            </TabsTrigger>
            <TabsTrigger 
              value="attended"
              className="text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Attended ({attendedEvents.length})
            </TabsTrigger>
          </TabsList>

          {/* Give Attendance Tab */}
          <TabsContent value="give-attendance">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-2xl border-2 border-slate-700 bg-slate-800">
          <CardHeader className="bg-indigo-700 text-white rounded-t-lg border-b border-indigo-600">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <QrCode size={28} />
              Check In
            </CardTitle>
            <CardDescription className="text-white/70">
              Welcome, {user?.name}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {!attendanceResult ? (
              // FORM VIEW
              <div className="space-y-6">
                {/* Input Section */}
                <div className="space-y-3">
                  <label htmlFor="code" className="text-lg font-semibold block text-white">
                    Attendance Code
                  </label>
                  <div className="flex gap-3">
                    <Input
                      id="code"
                      type="text"
                      placeholder="1234-5678"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={9}
                      // APPLY DARK INPUT STYLE
                      className="text-2xl font-mono tracking-wider text-center h-14 text-indigo-400 bg-slate-700 border-slate-600 placeholder-slate-500"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleCheckIn();
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <Keyboard size={16} />
                    Enter the 8-digit code provided by your event organizer
                  </p>
                </div>

                {/* Message Display */}
                {message && (
                  // APPLY DARK MESSAGE STYLES
                  <div
                    className={`px-4 py-3 rounded-lg border ${
                      message.type === "success"
                        ? "bg-green-900/50 border-green-700 text-green-300"
                        : "bg-red-900/50 border-red-700 text-red-300"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* Check In Button */}
                <Button
                  onClick={handleCheckIn}
                  disabled={loading || !code}
                  className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {loading ? "Checking In..." : "Check In"}
                </Button>

                {/* QR Code Scanner Placeholder */}
                <div className="pt-6 border-t border-slate-700">
                  <p className="text-center text-sm text-slate-400 mb-3">
                    Or scan QR code
                  </p>
                  <div className="bg-slate-700 rounded-lg p-8 text-center text-slate-400 border border-slate-600">
                    <QrCode size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">QR Scanner Coming Soon</p>
                  </div>
                </div>
              </div>
            ) : (
              // SUCCESS VIEW
              <div className="space-y-6 text-center">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="bg-green-900/50 rounded-full p-6 border border-green-700">
                    <CheckCircle size={64} className="text-green-400" />
                  </div>
                </div>

                {/* Success Message */}
                <div>
                  <h2 className="text-3xl font-bold text-green-400 mb-2">
                    Attendance Confirmed!
                  </h2>
                  <p className="text-slate-400">
                    You have successfully checked in
                  </p>
                </div>

                {/* Event Details */}
                <div className="bg-slate-700 rounded-lg p-6 space-y-4 border border-slate-600">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400 font-semibold uppercase tracking-wide">
                      Event Name
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {attendanceResult.event.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-600">
                    <div className="text-left">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <Calendar size={14} />
                        Date
                      </p>
                      <p className="font-semibold text-white">
                        {new Date(
                          attendanceResult.event.date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <Clock size={14} />
                        Check-in Time
                      </p>
                      <p className="font-semibold text-white">
                        {new Date(
                          attendanceResult.attendance.marked_at
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-600">
                    <div className="inline-block bg-green-600 text-white px-6 py-2 rounded-full font-bold text-lg">
                      ✓ {attendanceResult.attendance.status}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Check In to Another Event
                  </Button>
                  <Button
                    onClick={() => router.push("/event")}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    View My Events
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

          {/* Back to Dashboard */}
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </TabsContent>

          {/* Attended Tab */}
          <TabsContent value="attended">
            <div className="space-y-6">
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAttendedEvents}
                  disabled={loadingAttendedEvents}
                  className="gap-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                >
                  <RefreshCw
                    size={16}
                    className={loadingAttendedEvents ? "animate-spin" : ""}
                  />
                  Refresh
                </Button>
              </div>
              {loadingAttendedEvents ? (
                <Card className="shadow-lg bg-slate-800 border border-slate-700">
                  <CardContent className="py-12 text-center">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-slate-400 mb-4" />
                    <p className="text-slate-400">Loading attended events...</p>
                  </CardContent>
                </Card>
              ) : attendedEvents.length === 0 ? (
                <Card className="shadow-lg bg-slate-800 border border-slate-700">
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Events Attended Yet
                    </h3>
                    <p className="text-slate-400">
                      You haven't attended any events yet. Check in to events to
                      see them here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {attendedEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-slate-800 border border-slate-700"
                      onClick={() => router.push(`/view_event?id=${event.id}`)}
                    >
                      {event.poster_url && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg bg-slate-700">
                          <AttendedEventPoster posterUrl={event.poster_url} />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-2 text-white">
                            {event.title}
                          </CardTitle>
                          <Badge
                            className={`shrink-0 ${
                              event.status === "Completed"
                                ? "bg-slate-600 text-slate-300 border-slate-500"
                                : event.status === "Open"
                                ? "bg-green-900/50 text-green-300 border-green-700"
                                : "bg-yellow-900/50 text-yellow-300 border-yellow-700"
                            }`}
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2 text-slate-400">
                          {event.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={16} />
                            <span>
                              {new Date(event.start_date).toLocaleDateString()}
                              {event.end_date !== event.start_date &&
                                ` - ${new Date(
                                  event.end_date
                                ).toLocaleDateString()}`}
                            </span>
                          </div>
                          {event.start_time && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Clock size={16} />
                              <span>
                                {event.start_time}
                                {event.end_time && ` - ${event.end_time}`}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle size={16} className="text-green-400" />
                            <span>
                              Attended:{" "}
                              {new Date(
                                event.attendance.marked_at
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-xs font-medium px-2 py-1 bg-blue-800 text-blue-300 rounded border border-blue-700">
                              {event.attendance.method}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            {event.was_registered ? (
                              <span className="text-xs font-medium px-2 py-1 bg-green-900/50 text-green-300 rounded flex items-center gap-1 border border-green-700">
                                <CheckCircle size={12} />
                                You registered for this event
                              </span>
                            ) : (
                              <span className="text-xs font-medium px-2 py-1 bg-slate-700 text-slate-400 rounded">
                                You didn't register for this event
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-700">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/view_event?id=${event.id}`);
                            }}
                          >
                            <Eye size={16} className="mr-2" />
                            View Event
                          </Button>
                          {event.status === "Completed" && (
                            <Button
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadCertificate(event.id);
                              }}
                              disabled={downloadingCertificates[event.id]}
                            >
                              {downloadingCertificates[event.id] ? (
                                <>
                                  <RefreshCw
                                    size={16}
                                    className="mr-2 animate-spin"
                                  />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Award size={16} className="mr-2" />
                                  Certificate
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Attended Event Poster Component - Loads poster with authentication
function AttendedEventPoster({ posterUrl }: { posterUrl: string }) {
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

    // Construct the full URL
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

    // Fetch image as blob with auth token
    const token = localStorage.getItem("token");
    if (token) {
      setLoading(true);
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load image: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          setImageError(false);
        })
        .catch((error) => {
          console.error("Failed to load poster:", error);
          setImageError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setImageUrl(url);
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [posterUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

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
        <span className="text-xs text-slate-400">Failed to load poster</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Event Poster"
      className="w-full h-full object-cover"
    />
  );
}