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
      setAttendedEvents(data.events || []);
    } catch (err: any) {
      console.error("Failed to fetch attended events:", err);
      toast({
        title: "Error",
        description: "Failed to load attended events",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Event Attendance
          </h1>
          <p className="text-slate-600">
            Check in to events or view your attendance history
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="give-attendance">Give Attendance</TabsTrigger>
            <TabsTrigger value="attended">
              Attended ({attendedEvents.length})
            </TabsTrigger>
          </TabsList>

          {/* Give Attendance Tab */}
          <TabsContent value="give-attendance">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-2xl border-2 border-indigo-100">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <QrCode size={28} />
              Check In
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Welcome, {user?.name}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {!attendanceResult ? (
              // FORM VIEW
              <div className="space-y-6">
                {/* Input Section */}
                <div className="space-y-3">
                  <label htmlFor="code" className="text-lg font-semibold block">
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
                      className="text-2xl font-mono tracking-wider text-center h-14 text-indigo-600"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleCheckIn();
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Keyboard size={16} />
                    Enter the 8-digit code provided by your event organizer
                  </p>
                </div>

                {/* Message Display */}
                {message && (
                  <div
                    className={`px-4 py-3 rounded-lg border ${
                      message.type === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
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
                <div className="pt-6 border-t border-slate-200">
                  <p className="text-center text-sm text-slate-500 mb-3">
                    Or scan QR code
                  </p>
                  <div className="bg-slate-100 rounded-lg p-8 text-center text-slate-400">
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
                  <div className="bg-green-100 rounded-full p-6">
                    <CheckCircle size={64} className="text-green-600" />
                  </div>
                </div>

                {/* Success Message */}
                <div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">
                    Attendance Confirmed!
                  </h2>
                  <p className="text-slate-600">
                    You have successfully checked in
                  </p>
                </div>

                {/* Event Details */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">
                      Event Name
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {attendanceResult.event.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-200">
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Calendar size={14} />
                        Date
                      </p>
                      <p className="font-semibold text-slate-800">
                        {new Date(
                          attendanceResult.event.date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Clock size={14} />
                        Check-in Time
                      </p>
                      <p className="font-semibold text-slate-800">
                        {new Date(
                          attendanceResult.attendance.marked_at
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-indigo-200">
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
                    className="flex-1"
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
                  className="text-slate-600"
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
                  className="gap-2"
                >
                  <RefreshCw
                    size={16}
                    className={loadingAttendedEvents ? "animate-spin" : ""}
                  />
                  Refresh
                </Button>
              </div>
              {loadingAttendedEvents ? (
                <Card className="shadow-lg">
                  <CardContent className="py-12 text-center">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin text-slate-400 mb-4" />
                    <p className="text-slate-500">Loading attended events...</p>
                  </CardContent>
                </Card>
              ) : attendedEvents.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No Events Attended Yet
                    </h3>
                    <p className="text-slate-500">
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
                      className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => router.push(`/view_event?id=${event.id}`)}
                    >
                      {event.poster_url && (
                        <div className="relative h-48 overflow-hidden rounded-t-lg">
                          <img
                            src={`http://localhost:5000${event.poster_url}`}
                            alt={event.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-2">
                            {event.title}
                          </CardTitle>
                          <Badge
                            className={`shrink-0 ${
                              event.status === "Completed"
                                ? "bg-slate-200 text-slate-700"
                                : event.status === "Open"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {event.description || "No description available"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
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
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock size={16} />
                              <span>
                                {event.start_time}
                                {event.end_time && ` - ${event.end_time}`}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-slate-600">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>
                              Attended:{" "}
                              {new Date(
                                event.attendance.marked_at
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {event.attendance.method}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-200">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
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
