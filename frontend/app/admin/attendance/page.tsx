"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEvents, Event } from "@/lib/event-api";
import {
  startAttendance,
  stopAttendance,
  getAttendanceList,
  canStartEvent,
} from "@/lib/attendance-api";
import {
  PlayCircle,
  StopCircle,
  QrCode,
  Users,
  RefreshCw,
  Calendar,
  ArrowLeft,
  Clock,
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  name: string;
  matric_number: string;
  email: string;
  membership_number: string;
  marked_at: string;
  method: string;
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [canStart, setCanStart] = useState(false);
  const [canStartMessage, setCanStartMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [token, user, router]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getEvents();
        setEvents(data);
      } catch (err: any) {
        setMessage({
          type: "error",
          text: "Failed to fetch events",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchEvents();
    }
  }, [user]);

  // Fetch attendance list when event is selected and active
  useEffect(() => {
    if (selectedEvent?.attendance_status === "Active") {
      fetchAttendanceList();
    }
  }, [selectedEvent]);

  const fetchAttendanceList = async () => {
    if (!selectedEvent) return;

    try {
      const response = await getAttendanceList(selectedEvent.id);
      setAttendanceList(response.attendance_list || []);
    } catch (err: any) {
      console.error("Failed to fetch attendance list:", err);
    }
  };

  const handleSelectEvent = async (event: Event) => {
    setSelectedEvent(event);
    setMessage(null);

    // Check if event can be started
    try {
      const statusCheck = await canStartEvent(event.id);
      setCanStart(statusCheck.can_start);
      setCanStartMessage(statusCheck.message || "");
    } catch (err: any) {
      setCanStart(false);
      setCanStartMessage("Unable to check event status");
    }

    if (event.attendance_status === "Active") {
      await fetchAttendanceList();
    }
  };

  const handleStartAttendance = async () => {
    if (!selectedEvent) return;

    setAttendanceLoading(true);
    setMessage(null);

    try {
      const response = await startAttendance(selectedEvent.id);
      setMessage({
        type: "success",
        text: "Attendance started successfully!",
      });

      // Update selected event with new attendance data
      setSelectedEvent({
        ...selectedEvent,
        attendance_status: "Active",
        attendance_code: response.attendance_code,
      });

      // Fetch attendance list
      await fetchAttendanceList();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to start attendance",
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleStopAttendance = async () => {
    if (!selectedEvent) return;

    setAttendanceLoading(true);
    setMessage(null);

    try {
      await stopAttendance(selectedEvent.id);
      setMessage({
        type: "success",
        text: "Attendance stopped successfully!",
      });

      // Update selected event
      setSelectedEvent({
        ...selectedEvent,
        attendance_status: "Closed",
        attendance_code: null,
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to stop attendance",
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchAttendanceList();
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Attendance Management
          </h1>
          <p className="text-slate-600">
            Select an event to manage attendance check-ins
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* EVENT SELECTION */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  Select Event
                </CardTitle>
                <CardDescription>
                  Choose an event to manage attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <p className="text-slate-500">Loading events...</p>
                ) : events.length === 0 ? (
                  <p className="text-slate-500">No events available</p>
                ) : (
                  <div className="space-y-2">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                          selectedEvent?.id === event.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-indigo-300 bg-white"
                        }`}
                      >
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {event.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-2">
                          {new Date(event.start_date).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              event.attendance_status === "Active"
                                ? "bg-green-100 text-green-700"
                                : event.attendance_status === "Closed"
                                ? "bg-slate-100 text-slate-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {event.attendance_status}
                          </span>
                          {event.participant_count !== undefined && (
                            <span className="text-xs text-slate-500">
                              {event.participant_count} registered
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ATTENDANCE MANAGEMENT */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="space-y-6">
                {/* Event Info & Controls */}
                <Card className="shadow-lg border-2 border-indigo-200">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <CardTitle className="text-2xl">
                      {selectedEvent.title}
                    </CardTitle>
                    <CardDescription className="text-indigo-100">
                      {new Date(selectedEvent.start_date).toLocaleDateString()}{" "}
                      • {selectedEvent.participant_count || 0} registered
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Message */}
                    {message && (
                      <div
                        className={`mb-4 px-4 py-3 rounded-lg border ${
                          message.type === "success"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        {message.text}
                      </div>
                    )}

                    {/* Control Buttons */}
                    <div className="space-y-3">
                      {/* Event timing status message */}
                      {!canStart &&
                        selectedEvent.attendance_status === "Pending" && (
                          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800 font-medium">
                              ⏰ {canStartMessage}
                            </p>
                          </div>
                        )}

                      <div className="flex gap-3">
                        {selectedEvent.attendance_status === "Pending" && (
                          <Button
                            onClick={handleStartAttendance}
                            disabled={attendanceLoading || !canStart}
                            className={`flex-1 gap-2 h-12 ${
                              canStart
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-slate-400 cursor-not-allowed"
                            }`}
                          >
                            <PlayCircle size={18} />
                            {attendanceLoading
                              ? "Starting..."
                              : canStart
                              ? "Start Attendance"
                              : "Not Ready"}
                          </Button>
                        )}

                        {selectedEvent.attendance_status === "Active" && (
                          <Button
                            onClick={handleStopAttendance}
                            disabled={attendanceLoading}
                            variant="destructive"
                            className="flex-1 gap-2 h-12"
                          >
                            <StopCircle size={18} />
                            {attendanceLoading
                              ? "Stopping..."
                              : "Stop Attendance"}
                          </Button>
                        )}

                        {selectedEvent.attendance_status === "Closed" && (
                          <div className="flex-1 px-4 py-3 bg-slate-100 rounded-md text-center text-slate-600 font-medium">
                            Attendance Closed
                          </div>
                        )}
                      </div>
                    </div>

                    {/* QR CODE & CODE DISPLAY */}
                    {selectedEvent.attendance_status === "Active" &&
                      selectedEvent.attendance_code && (
                        <div className="grid md:grid-cols-2 gap-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                          {/* QR Code */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                              <QrCode size={18} />
                              QR Code
                            </h4>
                            <div className="bg-white p-4 rounded-lg border-2 border-indigo-300 flex justify-center">
                              <div className="text-center">
                                <QRCodeSVG
                                  value={`${window.location.origin}/attendance?code=${selectedEvent.attendance_code}`}
                                  size={192}
                                  level="H"
                                  includeMargin={true}
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                  Students scan to check in
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Attendance Code */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-indigo-900">
                              Attendance Code
                            </h4>
                            <div className="bg-white p-6 rounded-lg border-2 border-indigo-300">
                              <p className="text-5xl font-bold text-center tracking-wider text-indigo-600 font-mono">
                                {selectedEvent.attendance_code.substring(0, 4)}-
                                {selectedEvent.attendance_code.substring(4)}
                              </p>
                              <p className="text-center text-sm text-slate-600 mt-4">
                                Share this code with participants
                              </p>
                              <p className="text-center text-xs text-slate-500 mt-2">
                                Check-in URL:{" "}
                                <a
                                  href={`/attendance?code=${selectedEvent.attendance_code}`}
                                  target="_blank"
                                  className="text-blue-600 underline"
                                >
                                  /attendance
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>

                {/* LIVE ATTENDANCE LIST */}
                {selectedEvent.attendance_status === "Active" && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users size={20} />
                            Live Attendance
                          </CardTitle>
                          <CardDescription>
                            {attendanceList.length} students checked in
                          </CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRefresh}
                          className="gap-2"
                        >
                          <RefreshCw size={14} />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {attendanceList.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                          <Users
                            size={48}
                            className="mx-auto text-slate-300 mb-3"
                          />
                          <p className="text-slate-500 font-medium">
                            No one has checked in yet
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Students will appear here as they check in
                          </p>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Matric Number</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Check-in Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {attendanceList.map((record, index) => (
                                <TableRow key={record.id}>
                                  <TableCell className="font-mono text-slate-500">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {record.name}
                                  </TableCell>
                                  <TableCell className="font-mono">
                                    {record.matric_number}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        record.method === "QR"
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {record.method}
                                    </span>
                                  </TableCell>
                                  <TableCell className="flex items-center gap-1 text-sm text-slate-600">
                                    <Clock size={14} />
                                    {new Date(
                                      record.marked_at
                                    ).toLocaleTimeString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="shadow-lg">
                <CardContent className="py-20 text-center">
                  <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Event Selected
                  </h3>
                  <p className="text-slate-500">
                    Select an event from the list to manage attendance
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
