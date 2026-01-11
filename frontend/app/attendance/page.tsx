"use client";

import { useState, useEffect, Suspense } from "react";
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
import { canSubmitFeedback } from "@/lib/feedback-api";
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from "@/lib/dateFormatter";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import FeedbackForm from "@/components/FeedbackForm";
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
  MessageSquare,
  Menu,
  LogOut,
  CheckSquare,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon,
  FileText,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import HeaderLogoutButton from "@/components/HeaderLogoutButton";

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
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-slate-900 items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <AttendancePageContent />
    </Suspense>
  );
}

function AttendancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, logout } = useAuth();
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
  
  // Feedback state
  const [feedbackModalEvent, setFeedbackModalEvent] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [feedbackEligibility, setFeedbackEligibility] = useState<{
    [eventId: number]: boolean;
  }>({});
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isAdmin = user?.role === "admin";

  // Pre-fill code from URL parameter if provided (QR code scan)
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setCode(codeFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // Fetch attended events when tab changes
  useEffect(() => {
    if (activeTab === "attended" && token) {
      fetchAttendedEvents();
    }
  }, [activeTab, token]);

  const fetchAttendedEvents = async () => {
    try {
      setLoadingAttendedEvents(true);
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
        description: err.message || "Failed to fetch attended events",
        variant: "destructive",
      });
    } finally {
      setLoadingAttendedEvents(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      setMessage({ type: "error", text: "Please enter an attendance code" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const result = await checkInToEvent(code.trim());
      setAttendanceResult(result);
      setMessage({ type: "success", text: "Check-in successful!" });

      toast({
        title: "Success!",
        description: `You've checked in to ${result.event.title}`,
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || err.message || "Check-in failed";
      setMessage({ type: "error", text: errorMessage });
      toast({
        title: "Check-in Failed",
        description: errorMessage,
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

  const handleReset = () => {
    setCode("");
    setMessage(null);
    setAttendanceResult(null);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* SIDEBAR - Now using shared AdminSidebar component */}
      <AdminSidebar activePage="attendance" />

      {/* MAIN CONTENT */}
      <div className="flex-1 min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Event Attendance</h2>
            <p className="text-sm text-slate-300">Check in to events or view your attendance history</p>
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

                  <CardContent className="p-6 space-y-6">
                    {attendanceResult ? (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-green-900/50 rounded-full flex items-center justify-center border-4 border-green-500">
                          <CheckCircle size={40} className="text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-green-400">Check-in Successful!</h3>
                          <p className="text-slate-400 mt-1">
                            You have been marked present for:
                          </p>
                          <p className="text-xl font-semibold text-white mt-2">
                            {attendanceResult.event.title}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            {formatDateTimeDDMMYYYY(attendanceResult.attendance.marked_at)}
                          </p>
                        </div>
                        <Button
                          onClick={handleReset}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          Check In Again
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-4 justify-center">
                          <div className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg border border-slate-600">
                            <div className="w-12 h-12 bg-indigo-900/50 rounded-full flex items-center justify-center">
                              <QrCode className="text-indigo-400" size={24} />
                            </div>
                            <span className="text-sm text-slate-300">Scan QR</span>
                          </div>
                          <div className="flex items-center text-slate-500">or</div>
                          <div className="flex flex-col items-center gap-2 p-4 bg-slate-700 rounded-lg border border-slate-600">
                            <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center">
                              <Keyboard className="text-purple-400" size={24} />
                            </div>
                            <span className="text-sm text-slate-300">Enter Code</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Attendance Code
                          </label>
                          <Input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Enter 8-character code"
                            maxLength={8}
                            className="text-center text-2xl font-mono tracking-widest bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                          />
                        </div>

                        {message && (
                          <div
                            className={`p-4 rounded-lg ${
                              message.type === "error"
                                ? "bg-red-900/50 border border-red-700 text-red-300"
                                : "bg-green-900/50 border border-green-700 text-green-300"
                            }`}
                          >
                            {message.text}
                          </div>
                        )}

                        <Button
                          onClick={handleSubmitCode}
                          disabled={loading || code.length !== 8}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-6"
                        >
                          {loading ? (
                            <>
                              <RefreshCw size={20} className="mr-2 animate-spin" />
                              Checking In...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={20} className="mr-2" />
                              Check In
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Attended Events Tab */}
            <TabsContent value="attended">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Your Attended Events</h2>
                  <Button
                    onClick={fetchAttendedEvents}
                    variant="outline"
                    size="sm"
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    disabled={loadingAttendedEvents}
                  >
                    <RefreshCw size={16} className={`mr-2 ${loadingAttendedEvents ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                {loadingAttendedEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
                    <span className="ml-3 text-slate-400">Loading your attended events...</span>
                  </div>
                ) : attendedEvents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-700 rounded-lg bg-slate-800/50">
                    <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400 text-lg">No attended events yet</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Check in to events to see them here
                    </p>
                  </div>
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
                            <AttendedEventPoster posterUrl={event.poster_url} />
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
                              {event.was_registered ? (
                                <span className="text-xs font-medium px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded ml-2">
                                  Pre-registered
                                </span>
                              ) : (
                                <span className="text-xs font-medium px-2 py-1 bg-slate-700 text-slate-400 rounded ml-2">
                                  Walk-in
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
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
                              <>
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
                                <Button
                                  size="sm"
                                  variant={feedbackEligibility[event.id] ? "default" : "outline"}
                                  className={
                                    feedbackEligibility[event.id]
                                      ? "flex-1 bg-purple-600 hover:bg-purple-700"
                                      : "flex-1 bg-slate-700 border-slate-600 text-slate-400 cursor-default"
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (feedbackEligibility[event.id]) {
                                      setFeedbackModalEvent({
                                        id: event.id,
                                        title: event.title,
                                      });
                                    }
                                  }}
                                  disabled={!feedbackEligibility[event.id]}
                                >
                                  <MessageSquare size={16} className="mr-2" />
                                  {feedbackEligibility[event.id]
                                    ? "Give Feedback"
                                    : "Feedback Submitted"}
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
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {/* Feedback Modal Overlay */}
      {feedbackModalEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <FeedbackForm
            eventId={feedbackModalEvent.id}
            eventTitle={feedbackModalEvent.title}
            onClose={() => setFeedbackModalEvent(null)}
            onSuccess={() => {
              setFeedbackModalEvent(null);
              // Update eligibility to show button as submitted
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