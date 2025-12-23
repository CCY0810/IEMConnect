"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
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
import { Skeleton } from "@/components/ui/skeleton";

import {
  Menu,
  LogOut,
  FileText,
  Calendar,
  CheckSquare,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon,
  Download,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  ArrowUpRight,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import React from "react";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import {
  getUsersInsights as fetchUsersInsights,
  getEventOperations as fetchEventOperations,
  getAttendanceEngagement as fetchAttendanceEngagement,
  getAttendanceByFaculty as fetchAttendanceByFaculty,
  getRegistrationsVsAttendance as fetchTrend,
  getRecentActivity as fetchRecentActivity,
  getTopEvents as fetchTopEvents,
} from "@/lib/reports-api";
import { getEvents, getEventById, Event } from "@/lib/event-api";
import { getEventParticipants } from "@/lib/event-api";
import { getAttendanceList } from "@/lib/attendance-api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function ReportsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  // Analytics state
  const [usersInsights, setUsersInsights] =
    useState<null | Awaited<ReturnType<typeof fetchUsersInsights>>>(null);
  const [eventOps, setEventOps] =
    useState<null | Awaited<ReturnType<typeof fetchEventOperations>>>(null);
  const [engagement, setEngagement] =
    useState<null | Awaited<ReturnType<typeof fetchAttendanceEngagement>>>(
      null
    );
  const [facultyData, setFacultyData] = useState<
    { name: string; value: number }[]
  >([]);
  const [trendData, setTrendData] = useState<
    { month: string; registrations: number; attendees: number }[]
  >([]);
  const [recentActivity, setRecentActivity] =
    useState<Awaited<ReturnType<typeof fetchRecentActivity>>>([]);
  const [topEvents, setTopEvents] =
    useState<Awaited<ReturnType<typeof fetchTopEvents>>>([]);

  // Loading states for progressive rendering
  const [loadingStates, setLoadingStates] = useState({
    kpis: true,
    charts: true,
    tables: true,
  });

  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("overall");

  // Individual event stats state
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventStats, setEventStats] = useState<any>(null);
  const [loadingEventStats, setLoadingEventStats] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!token) router.push("/login");
    if (!isAdmin) router.push("/dashboard");
  }, [token, isAdmin, router]);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  // Fetch events list for individual stats
  useEffect(() => {
    if (!isAdmin) return;
    const loadEvents = async () => {
      try {
        const eventsList = await getEvents();
        setEvents(eventsList);
      } catch (err) {
        console.error("Failed to load events:", err);
      }
    };
    loadEvents();
  }, [isAdmin]);

  // Fetch individual event stats (Backend Logic Unchanged)
  useEffect(() => {
    if (!selectedEventId || !isAdmin) return;

    const loadEventStats = async () => {
      setLoadingEventStats(true);
      try {
        const [event, participantsData, attendanceData] = await Promise.all([
          getEventById(selectedEventId),
          getEventParticipants(selectedEventId),
          getAttendanceList(selectedEventId).catch(() => ({
            attendance_list: [],
          })),
        ]);

        const participants = participantsData.participants || [];
        const attendanceList = attendanceData.attendance_list || [];

        // Calculate stats
        const totalRegistrations = participants.length;
        const totalAttended = attendanceList.length;
        const attendanceRate =
          totalRegistrations > 0
            ? ((totalAttended / totalRegistrations) * 100).toFixed(2)
            : "0.00";

        // Attendance methods breakdown
        const methods = { QR: 0, Code: 0, Manual: 0 };
        attendanceList.forEach((record: any) => {
          if (record.method && methods.hasOwnProperty(record.method)) {
            methods[record.method as keyof typeof methods]++;
          }
        });

        // Faculty distribution - get from participants list
        const facultyDist: Record<string, number> = {};
        attendanceList.forEach((record: any) => {
          // Find participant by matching email or matric number
          const participant = participants.find(
            (p: any) =>
              p.user.email === record.email ||
              p.user.matric_number === record.matric_number
          );
          const faculty = participant?.user?.faculty || "Unknown";
          facultyDist[faculty] = (facultyDist[faculty] || 0) + 1;
        });

        // Calculate daily registration and attendance timeline
        const registrationTimeline: Record<string, number> = {};
        const attendanceTimeline: Record<string, number> = {};

        // Process registrations by day
        participants.forEach((p: any) => {
          if (p.registration_date) {
            const date = new Date(p.registration_date)
              .toISOString()
              .split("T")[0];
            registrationTimeline[date] =
              (registrationTimeline[date] || 0) + 1;
          }
        });

        // Process attendance by day
        attendanceList.forEach((record: any) => {
          if (record.marked_at) {
            const date = new Date(record.marked_at)
              .toISOString()
              .split("T")[0];
            attendanceTimeline[date] = (attendanceTimeline[date] || 0) + 1;
          }
        });

        // Get date range from event start to today or event end
        const eventStart = new Date(event.start_date);
        const eventEnd = event.end_date ? new Date(event.end_date) : new Date();
        const today = new Date();
        const endDate = eventEnd > today ? today : eventEnd;

        // Generate all dates in range
        const allDates: string[] = [];
        const currentDate = new Date(eventStart);
        while (currentDate <= endDate) {
          allDates.push(currentDate.toISOString().split("T")[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Create cumulative timeline data
        let cumulativeRegistrations = 0;
        let cumulativeAttendance = 0;
        const timelineData = allDates.map((date) => {
          cumulativeRegistrations += registrationTimeline[date] || 0;
          cumulativeAttendance += attendanceTimeline[date] || 0;
          return {
            date: new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            registrations: cumulativeRegistrations,
            attendance: cumulativeAttendance,
          };
        });

        setEventStats({
          event,
          registrations: {
            total: totalRegistrations,
            attended: totalAttended,
            attendance_rate: parseFloat(attendanceRate),
          },
          attendance_methods: methods,
          faculty_distribution: facultyDist,
          timeline: timelineData,
          participants: participants.map((p: any) => {
            const attendance = attendanceList.find(
              (a: any) =>
                a.email === p.user.email ||
                a.matric_number === p.user.matric_number
            );
            return {
              user: p.user,
              status: p.status,
              registration_date: p.registration_date,
              attendance_date: attendance?.marked_at,
              method: attendance?.method,
            };
          }),
          attendance_list: attendanceList,
        });
      } catch (err) {
        console.error("Failed to load event stats:", err);
        setEventStats(null);
      } finally {
        setLoadingEventStats(false);
      }
    };

    loadEventStats();
  }, [selectedEventId, isAdmin]);

  // Fetch analytics for admin with progressive loading (Backend Logic Unchanged)
  useEffect(() => {
    if (!isAdmin) return;

    // Load KPIs first (fast queries)
    const loadKPIs = async () => {
      try {
        const [ui, eo, ae] = await Promise.all([
          fetchUsersInsights(),
          fetchEventOperations(),
          fetchAttendanceEngagement(),
        ]);
        setUsersInsights(ui);
        setEventOps(eo);
        setEngagement(ae);
        setLoadingStates((prev) => ({ ...prev, kpis: false }));
      } catch (err) {
        console.error("Failed to load KPIs:", err);
        setLoadingStates((prev) => ({ ...prev, kpis: false }));
      }
    };

    // Load charts after KPIs
    const loadCharts = async () => {
      try {
        const [af, tr] = await Promise.all([
          fetchAttendanceByFaculty(),
          fetchTrend(6),
        ]);
        setFacultyData(
          Object.entries(af).map(([name, value]) => ({ name, value }))
        );
        setTrendData(tr);
        setLoadingStates((prev) => ({ ...prev, charts: false }));
      } catch (err) {
        console.error("Failed to load charts:", err);
        setLoadingStates((prev) => ({ ...prev, charts: false }));
      }
    };

    // Load tables last
    const loadTables = async () => {
      try {
        const [ra, te] = await Promise.all([
          fetchRecentActivity(),
          fetchTopEvents(),
        ]);
        setRecentActivity(ra);
        setTopEvents(te);
        setLoadingStates((prev) => ({ ...prev, tables: false }));
      } catch (err) {
        console.error("Failed to load tables:", err);
        setLoadingStates((prev) => ({ ...prev, tables: false }));
      }
    };

    // Progressive loading: KPIs -> Charts -> Tables
    loadKPIs();
    setTimeout(() => loadCharts(), 100);
    setTimeout(() => loadTables(), 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Download Excel Logic (Unchanged)
  const downloadExcel = (type: "overall" | "event") => {
    setDownloading(true);
    try {
      const workbook = XLSX.utils.book_new();

      if (type === "overall") {
        if (!usersInsights || !eventOps || !engagement) return;

        // Summary Sheet
        const summaryData = [
          ["Metric", "Value"],
          ["Total Users", usersInsights.total_users],
          ["User Growth % MoM", usersInsights.growth_percent],
          ["Pending Approvals", usersInsights.pending_approvals],
          ["Total Events Held", eventOps.total_events_held],
          ["Avg Attendance Rate %", engagement.participation_rate],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // Faculty Distribution Sheet
        const facultySheetData = [
          ["Faculty", "Attendance Count"],
          ...facultyData.map((f) => [f.name, f.value]),
        ];
        const facultySheet = XLSX.utils.aoa_to_sheet(facultySheetData);
        XLSX.utils.book_append_sheet(
          workbook,
          facultySheet,
          "Faculty Distribution"
        );

        // Trends Sheet
        const trendsSheetData = [
          ["Month", "Registrations", "Attendees"],
          ...trendData.map((t) => [t.month, t.registrations, t.attendees]),
        ];
        const trendsSheet = XLSX.utils.aoa_to_sheet(trendsSheetData);
        XLSX.utils.book_append_sheet(workbook, trendsSheet, "Trends");

        // Top Events Sheet
        const topEventsSheetData = [
          ["Event", "Date", "Attendance"],
          ...topEvents.map((e) => [
            e.event.title,
            e.event.start_date || "",
            e.attendance_count,
          ]),
        ];
        const topEventsSheet = XLSX.utils.aoa_to_sheet(topEventsSheetData);
        XLSX.utils.book_append_sheet(workbook, topEventsSheet, "Top Events");

        // Recent Activity Sheet
        const activitySheetData = [
          ["Type", "User", "Event", "Method", "Time"],
          ...recentActivity.map((a) => [
            a.type.replace("_", " "),
            a.user?.name || "",
            a.event?.title || "-",
            a.method || "-",
            new Date(a.timestamp).toLocaleString(),
          ]),
        ];
        const activitySheet = XLSX.utils.aoa_to_sheet(activitySheetData);
        XLSX.utils.book_append_sheet(
          workbook,
          activitySheet,
          "Recent Activity"
        );

        const fileName = `analytics-overall-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
      } else {
        // Individual Event Stats
        if (!eventStats) return;

        const eventName = eventStats.event.title
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");

        // Event Summary Sheet
        const summaryData = [
          ["Event Information", ""],
          ["Title", eventStats.event.title],
          ["Start Date", eventStats.event.start_date],
          ["End Date", eventStats.event.end_date],
          ["Status", eventStats.event.status],
          ["", ""],
          ["Statistics", ""],
          ["Total Registrations", eventStats.registrations.total],
          ["Total Attended", eventStats.registrations.attended],
          ["Attendance Rate %", eventStats.registrations.attendance_rate],
          ["", ""],
          ["Attendance Methods", ""],
          ["QR Code", eventStats.attendance_methods.QR],
          ["Code", eventStats.attendance_methods.Code],
          ["Manual", eventStats.attendance_methods.Manual],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // Participants Sheet
        const participantsSheetData = [
          [
            "Name",
            "Email",
            "Matric Number",
            "Membership Number",
            "Faculty",
            "Status",
            "Registration Date",
            "Attendance Date",
            "Method",
          ],
          ...eventStats.participants.map((p: any) => [
            p.user.name,
            p.user.email,
            p.user.matric_number || "",
            p.user.membership_number || "",
            p.user.faculty || "",
            p.status,
            p.registration_date
              ? new Date(p.registration_date).toLocaleString()
              : "",
            p.attendance_date
              ? new Date(p.attendance_date).toLocaleString()
              : "",
            p.method || "",
          ]),
        ];
        const participantsSheet =
          XLSX.utils.aoa_to_sheet(participantsSheetData);
        XLSX.utils.book_append_sheet(
          workbook,
          participantsSheet,
          "Participants"
        );

        // Faculty Distribution Sheet
        const facultySheetData = [
          ["Faculty", "Attendance Count"],
          ...Object.entries(eventStats.faculty_distribution).map(
            ([faculty, count]) => [faculty, count]
          ),
        ];
        const facultySheet = XLSX.utils.aoa_to_sheet(facultySheetData);
        XLSX.utils.book_append_sheet(
          workbook,
          facultySheet,
          "Faculty Distribution"
        );

        // Timeline Sheet
        if (eventStats.timeline && eventStats.timeline.length > 0) {
          const timelineSheetData = [
            ["Date", "Cumulative Registrations", "Cumulative Attendance"],
            ...eventStats.timeline.map((t: any) => [
              t.date,
              t.registrations,
              t.attendance,
            ]),
          ];
          const timelineSheet =
            XLSX.utils.aoa_to_sheet(timelineSheetData);
          XLSX.utils.book_append_sheet(
            workbook,
            timelineSheet,
            "Timeline"
          );
        }

        const fileName = `analytics-event-${eventName}-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
      }
    } catch (err) {
      console.error("Failed to export Excel:", err);
      alert("Failed to export Excel file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (!user || !isAdmin) return null;

  // Data for Event Status Pie Chart
  const eventStatusData = eventOps
    ? [
        { name: "Open", value: eventOps.status_funnel.Open },
        { name: "Completed", value: eventOps.status_funnel.Completed },
      ]
    : [];
  const totalOverallEvents = eventOps
    ? eventStatusData.reduce((sum, entry) => sum + entry.value, 0)
    : 0;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {isLogoutModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 text-red-500">
                      <AlertTriangle size={32} />
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white">Logout Confirmation</h3>
                    <p className="mb-6 text-slate-400">
                      Are you sure you want to end your session?
                    </p>
                    <div className="flex w-full gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-slate-600 bg-transparent text-white hover:bg-slate-700"
                        onClick={() => setIsLogoutModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 bg-red-600 text-white hover:bg-red-700"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
      {/* SIDEBAR (matches dashboard style) */}
      <aside
        className={`sticky top-0 h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col`}
      >
        {/* sidebar header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`bg-white rounded-xl p-2 shadow-md flex items-center justify-center ${
                sidebarOpen ? "w-12 h-12" : "w-10 h-10"
              }`}
            >
              <img
                src="/iem-logo.jpg"
                alt="IEM UTM Logo"
                className="object-contain w-full h-full"
              />
            </div>

            {sidebarOpen && (
              <div>
                <div className="text-base font-extrabold tracking-wide">
                  IEM Connect
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Admin Portal
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 text-slate-200 rounded-lg hover:bg-white/10"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* menu (matches dashboard nav structure) */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                  <SidebarButton
                    open={sidebarOpen}
                    icon={<PieChartIcon size={20} />}
                    label="Dashboard"
                    onClick={() => router.push("/dashboard")}
                  />
                  {isAdmin && (
                    <SidebarButton
                      open={sidebarOpen}
                      icon={<UserCheck size={20} />}
                      label="Admin Panel"
                      onClick={() => router.push("/admin/admin_panel")}
                    />
                  )}
                  {isAdmin && (
                    <SidebarButton
                      open={sidebarOpen}
                      icon={<FileText size={20} />}
                      label="Analytics & Reports"
                      onClick={() => router.push("/admin/reports")}
                      active
                    />
                  )}
                  <SidebarButton
                    open={sidebarOpen}
                    icon={<Calendar size={20} />}
                    label="Events"
                    onClick={() => router.push("/event")}
                  />
                  <SidebarButton
                    open={sidebarOpen}
                    icon={<CheckSquare size={20} />}
                    label="Attendance"
                    onClick={() => router.push("/attendance")}
                  />
                  <SidebarButton
                    open={sidebarOpen}
                    icon={<Settings size={20} />}
                    label="Settings"
                    onClick={() => router.push("/settings")}
                  />
                  <SidebarButton
                    open={sidebarOpen}
                    icon={<HelpCircle size={20} />}
                    label="Help Center"
                    onClick={() => router.push("/admin/help")}
                  />
        
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <SidebarButton
                      open={sidebarOpen}
                      icon={<LogOut size={20} />}
                      label="Logout"
                      onClick={() => setIsLogoutModalOpen(true)} // Open Modal
                      variant="destructive"
                    />
                  </div>
                </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 min-h-screen">
        {/* Glassy dark header (matches dashboard) */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Analytics
            </h2>
            <p className="text-sm text-slate-300">
              Monitor membership, events, and attendance performance in one
              place.
            </p>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Info */}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-white">
                {user.name}
              </div>
              <div className="text-xs text-slate-400 capitalize">
                {user.role}
              </div>
            </div>

            {/* Profile Picture - Clickable */}
            <button
              onClick={() => router.push("/profile")}
              className="rounded-full overflow-hidden border-2 border-transparent shadow hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
              title="View Profile"
            >
              <UserAvatar size="md" />
            </button>

            {/* Download Button */}
            <Button
              onClick={() =>
                downloadExcel(activeTab === "overall" ? "overall" : "event")
              }
              disabled={downloading || (activeTab === "event" && !eventStats)}
              className="gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Download size={18} />
              {downloading
                ? "Preparing Export..."
                : activeTab === "overall"
                ? "Export Overall Data"
                : "Export Event Data"}
            </Button>

            {/* Top-right Logout (same style as dashboard) */}
            <button 
                className="p-2 rounded-lg hover:bg-white/10 text-white" 
                onClick={() => setIsLogoutModalOpen(true)} // Open Modal
              >
                <LogOut size={18} />
              </button>
          </div>
        </header>

        {/* content (kept same analytics layout, just sitting on dark bg) */}
        <main className="px-8 py-10 space-y-8 max-w-[90rem] mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="inline-flex mb-6 rounded-full bg-slate-800/80 border border-slate-700 p-1 shadow-md">
              <TabsTrigger
                value="overall"
                className="px-6 py-2 rounded-full text-sm font-medium text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30"
              >
                Overall Statistics
              </TabsTrigger>
              <TabsTrigger
                value="event"
                className="px-6 py-2 rounded-full text-sm font-medium text-slate-300 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/30"
              >
                Individual Event Statistics
              </TabsTrigger>
            </TabsList>

            {/* ================= OVERALL TAB ================= */}
            <TabsContent value="overall" className="space-y-8">
              {/* Top Row: KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingStates.kpis ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card
                        key={i}
                        className="bg-slate-800 border-0 shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl"
                      >
                        <CardHeader className="pb-3">
                          <Skeleton className="h-5 w-24 mb-2" />
                        </CardHeader>
                        <CardContent className="flex justify-between items-end">
                          <Skeleton className="h-10 w-28" />
                          <Skeleton className="h-5 w-16" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : usersInsights && eventOps && engagement ? (
                  <>
                    {/* Total Users */}
                    <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-indigo-900/40 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                              <Users className="w-4 h-4 text-indigo-400" />
                              Total Users
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs text-slate-400">
                              +{usersInsights.growth_percent}% vs last month
                            </CardDescription>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 text-emerald-200 text-xs px-2 py-0.5 border border-emerald-600 font-semibold">
                            <TrendingUp className="w-3 h-3" />
                            Growth
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex items-end justify-between">
                        <div className="text-4xl font-extrabold tracking-tight text-white">
                          {usersInsights.total_users}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Events */}
                    <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-blue-900/40 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              Total Events Held
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs text-slate-400">
                              All-time completed & open events
                            </CardDescription>
                          </div>
                          <div className="rounded-full bg-blue-900/40 text-blue-200 px-2 py-0.5 text-xs border border-blue-600 flex items-center gap-1 font-semibold">
                            <BarChart2 className="w-3 h-3" />
                            Events
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-extrabold tracking-tight text-white">
                          {eventOps.total_events_held}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Avg Attendance */}
                    <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-emerald-900/40 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                              <UserCheck className="w-4 h-4 text-emerald-400" />
                              Avg. Attendance Rate
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs text-slate-400">
                              Across all completed events
                            </CardDescription>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 text-emerald-200 text-xs px-2 py-0.5 border border-emerald-600 font-semibold">
                            <Activity className="w-3 h-3" />
                            Engagement
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-extrabold tracking-tight text-emerald-300">
                          {engagement.participation_rate}%
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pending Approvals */}
                    <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-amber-900/40 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                              <FileText className="w-4 h-4 text-amber-400" />
                              Pending Approvals
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs text-slate-400">
                              Quick action required
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <button
                          className="text-left w-full group"
                          onClick={() => {
                            router.push("/admin/admin_panel");
                            setTimeout(() => {
                              const el =
                                document.getElementById("approvals-panel");
                              el?.scrollIntoView({ behavior: "smooth" });
                            }, 100);
                          }}
                        >
                          <div className="flex items-end justify-between">
                            <div className="text-4xl font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                              {usersInsights.pending_approvals}
                            </div>
                            <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold">
                              Review now
                              <ArrowUpRight className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>

              {/* Middle Row: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {loadingStates.charts ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Card
                        key={i}
                        className="bg-slate-800 border-0 shadow-lg rounded-xl"
                      >
                        <CardHeader className="pb-3">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-64 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : eventOps && facultyData.length > 0 && trendData.length > 0 ? (
                  <>
                    {/* Chart 1: Attendance by Faculty (Horizontal Bar) */}
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <BarChart2 className="w-5 h-5 text-indigo-400" />
                          Attendance by Faculty
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Which faculty is most active? (Overall attendance count)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={facultyData}
                              layout="vertical"
                              margin={{ right: 20, left: 10, top: 0, bottom: 0 }}
                            >
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tickLine={false}
                                style={{ fontSize: "10px", fill: "#cbd5f5" }}
                                interval={0}
                                tickFormatter={(value) =>
                                  value.length > 15
                                    ? value.substring(0, 15) + "..."
                                    : value
                                }
                              />
                              <XAxis type="number" hide />
                              <ReTooltip
                                labelFormatter={(label) => `Attendance: ${label}`}
                                formatter={(value, name) => [value, name]}
                              />
                              <Bar
                                dataKey="value"
                                fill="#3b82f6"
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chart 2: Registration vs Attendance (6 months) */}
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          Registration vs. Attendance Trend
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Last 6 months
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                              <XAxis
                                dataKey="month"
                                style={{ fontSize: "12px", fill: "#cbd5f5" }}
                              />
                              <YAxis
                                style={{ fontSize: "12px", fill: "#cbd5f5" }}
                              />
                              <ReTooltip
                                wrapperClassName="rounded-md shadow-md border border-slate-700 bg-slate-900 text-slate-100 p-2 text-sm"
                                labelClassName="font-bold"
                              />
                              <Line
                                type="monotone"
                                dataKey="registrations"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                name="Registrations"
                              />
                              <Line
                                type="monotone"
                                dataKey="attendees"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ r: 4 }}
                                name="Attendees"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-end gap-4 text-xs text-slate-400 mt-3 font-medium">
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                            Registrations
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-1 bg-red-500 rounded-full" />
                            Attendees
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chart 3: Event Status Pie (Doughnut with Center Label) */}
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl lg:col-span-1">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <PieChartIcon className="w-5 h-5 text-amber-400" />
                          Event Status
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Open vs. Completed Events
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={eventStatusData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={110}
                                innerRadius={70}
                                labelLine={false}
                              >
                                <Cell fill="#f59e0b" name="Open" />
                                <Cell fill="#22c55e" name="Completed" />
                              </Pie>
                              <ReTooltip
                                formatter={(value, name) => [value, name]}
                                wrapperClassName="rounded-md shadow-md border border-slate-700 bg-slate-900 text-slate-100 p-2 text-sm"
                                labelClassName="font-bold"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Center Text Overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold text-slate-100">
                              {totalOverallEvents}
                            </span>
                            <span className="text-xs text-slate-400 mt-1">
                              Total
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-6 text-sm text-slate-300 mt-2 font-medium">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Open
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Completed
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>

              {/* Bottom Row: Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loadingStates.tables ? (
                  <>
                    {[1, 2].map((i) => (
                      <Card
                        key={i}
                        className="bg-slate-800 border-0 shadow-lg rounded-xl"
                      >
                        <CardHeader>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map((j) => (
                              <Skeleton key={j} className="h-10 w-full" />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : recentActivity.length > 0 || topEvents.length > 0 ? (
                  <>
                    {/* Recent Activity */}
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <Activity className="w-5 h-5 text-indigo-400" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Last 5 users registered or checked in
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-900/60">
                              <TableHead className="text-slate-200">
                                Type
                              </TableHead>
                              <TableHead className="text-slate-200">
                                User
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Event
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Method
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Time
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {recentActivity.length > 0 ? (
                              recentActivity.slice(0, 5).map((a, index) => (
                                <TableRow
                                  key={a.id}
                                  className={
                                    index % 2 === 1
                                      ? "bg-slate-900/40"
                                      : "bg-transparent"
                                  }
                                >
                                  <TableCell className="capitalize text-sm font-medium text-slate-100">
                                    {a.type.replace("_", " ")}
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-200">
                                    {a.user?.name}
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-200">
                                    {a.event?.title ?? "-"}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-300">
                                    {a.method ?? "-"}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-400">
                                    {new Date(a.timestamp).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center text-slate-500 py-6"
                                >
                                  No recent activity
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Top Events */}
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <BarChart2 className="w-5 h-5 text-blue-400" />
                          Top Events
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Sorted by highest attendance
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-900/60">
                              <TableHead className="text-slate-200">
                                Event
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Date
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Attendance
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topEvents.length > 0 ? (
                              topEvents.slice(0, 5).map((e, index) => (
                                <TableRow
                                  key={e.event.id}
                                  className={
                                    index % 2 === 1
                                      ? "bg-slate-900/40"
                                      : "bg-transparent"
                                  }
                                >
                                  <TableCell className="text-sm font-medium text-slate-100">
                                    {e.event.title}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-300">
                                    {e.event.start_date}{" "}
                                    {e.event.end_date &&
                                    e.event.end_date !== e.event.start_date
                                      ? `- ${e.event.end_date}`
                                      : ""}
                                  </TableCell>
                                  <TableCell className="font-bold text-base text-blue-300">
                                    {e.attendance_count}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={3}
                                  className="text-center text-slate-500 py-6"
                                >
                                  No top events found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>
            </TabsContent>

            {/* ================= INDIVIDUAL EVENT TAB ================= */}
            <TabsContent value="event" className="space-y-8">
              {/* Event Selector */}
              <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    Event Details Report
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Choose an event to view its detailed statistics and
                    participant list.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedEventId?.toString() || ""}
                    onValueChange={(value) =>
                      setSelectedEventId(parseInt(value))
                    }
                  >
                    <SelectTrigger className="w-full max-w-lg bg-slate-900 border-slate-600 text-slate-100 shadow-sm">
                      <SelectValue placeholder="Select an event to load data..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border border-slate-700 text-slate-100">
                      {events.map((event) => (
                        <SelectItem
                          key={event.id}
                          value={event.id.toString()}
                          className="hover:bg-slate-800"
                        >
                          {event.title} ({event.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Event Stats */}
              {loadingEventStats ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <Card
                      key={i}
                      className="bg-slate-800 border-0 shadow-sm rounded-2xl"
                    >
                      <CardHeader>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-64 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : eventStats ? (
                <>
                  {/* Event Info Card */}
                  <Card className="bg-slate-800 border-0 shadow-lg rounded-xl p-4">
                    <CardHeader className="p-0">
                      <CardTitle className="flex items-center justify-between text-2xl font-bold text-slate-100">
                        <span>{eventStats.event.title}</span>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full text-xs px-3 py-1 font-semibold ${
                            eventStats.event.status === "Completed"
                              ? "bg-emerald-900/40 text-emerald-200 border border-emerald-600"
                              : "bg-amber-900/40 text-amber-200 border border-amber-600"
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {eventStats.event.status}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-base text-slate-400 mt-1">
                        {new Date(
                          eventStats.event.start_date
                        ).toLocaleDateString()}{" "}
                        {eventStats.event.end_date !==
                          eventStats.event.start_date &&
                          ` - ${new Date(
                            eventStats.event.end_date
                          ).toLocaleDateString()}`}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* KPI Cards (3 in a row) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-indigo-900/40 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                          <Users className="w-4 h-4 text-indigo-400" />
                          Total Registrations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-extrabold text-white">
                          {eventStats.registrations.total}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-blue-900/40 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                          Total Attended
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-extrabold text-blue-300">
                          {eventStats.registrations.attended}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden border-0 rounded-xl bg-gradient-to-br from-slate-800 to-emerald-900/40 shadow-md">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-200">
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                          Attendance Rate
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-extrabold text-emerald-300">
                          {eventStats.registrations.attendance_rate}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Methods (Doughnut with Center Label) */}
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <QrCodeIcon />
                          Attendance Methods
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Breakdown by check-in method
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    name: "QR Code",
                                    value: eventStats.attendance_methods.QR,
                                  },
                                  {
                                    name: "Code",
                                    value: eventStats.attendance_methods.Code,
                                  },
                                  {
                                    name: "Manual",
                                    value: eventStats.attendance_methods.Manual,
                                  },
                                ]}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={110}
                                innerRadius={70}
                                labelLine={false}
                              >
                                <Cell fill="#3b82f6" name="QR Code" />
                                <Cell fill="#10b981" name="Code" />
                                <Cell fill="#f59e0b" name="Manual" />
                              </Pie>
                              <ReTooltip
                                formatter={(value, name) => [value, name]}
                                wrapperClassName="rounded-md shadow-md border border-slate-700 bg-slate-900 text-slate-100 p-2 text-sm"
                                labelClassName="font-bold"
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Center Text Overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold text-slate-100">
                              {eventStats.registrations.attended}
                            </span>
                            <span className="text-xs text-slate-400 mt-1">
                              Checked In
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Faculty Distribution (Horizontal Bar) */}
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <BarChart2 className="w-5 h-5 text-purple-400" />
                          Attendance by Faculty
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Faculty distribution for this event
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={Object.entries(
                                eventStats.faculty_distribution
                              ).map(([name, value]) => ({ name, value }))}
                              layout="vertical"
                              margin={{ right: 20, left: 10, top: 0, bottom: 0 }}
                            >
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                tickLine={false}
                                style={{ fontSize: "10px", fill: "#cbd5f5" }}
                                interval={0}
                                tickFormatter={(value) =>
                                  value.length > 15
                                    ? value.substring(0, 15) + "..."
                                    : value
                                }
                              />
                              <XAxis type="number" hide />
                              <ReTooltip
                                labelFormatter={(label) => `Attendance: ${label}`}
                                formatter={(value, name) => [value, name]}
                              />
                              <Bar
                                dataKey="value"
                                fill="#8b5cf6"
                                radius={[0, 4, 4, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Registration vs Attendance Timeline */}
                  {eventStats.timeline && eventStats.timeline.length > 0 && (
                    <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                          Registration vs. Attendance Timeline
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                          Cumulative registrations and attendance over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={eventStats.timeline}>
                              <XAxis
                                dataKey="date"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval="preserveStartEnd"
                                style={{ fontSize: "10px", fill: "#cbd5f5" }}
                              />
                              <YAxis
                                style={{ fontSize: "10px", fill: "#cbd5f5" }}
                              />
                              <ReTooltip
                                wrapperClassName="rounded-md shadow-md border border-slate-700 bg-slate-900 text-slate-100 p-2 text-sm"
                                labelClassName="font-bold"
                              />
                              <Line
                                type="monotone"
                                dataKey="registrations"
                                stroke="#10b981"
                                strokeWidth={3}
                                name="Registrations"
                                dot={{ r: 4 }}
                              />
                              <Line
                                type="monotone"
                                dataKey="attendance"
                                stroke="#ef4444"
                                strokeWidth={3}
                                name="Attendance"
                                dot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-end gap-4 text-xs text-slate-400 mt-3 font-medium">
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                            Registrations
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="w-3 h-1 bg-red-500 rounded-full" />
                            Attendance
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Participants Table */}
                  <Card className="bg-slate-800 border-0 shadow-lg rounded-xl lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-100">
                        <span>Participant List</span>
                        <span className="text-sm text-slate-400">
                          Total: {eventStats.participants.length} participant(s)
                        </span>
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Full list of registered users and their attendance status.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-900/60">
                              <TableHead className="text-slate-200">
                                Name
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Email
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Matric
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Faculty
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Status
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Registration Date
                              </TableHead>
                              <TableHead className="text-slate-200">
                                Attendance
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {eventStats.participants.length > 0 ? (
                              eventStats.participants.map(
                                (p: any, index: number) => (
                                  <TableRow
                                    key={index}
                                    className={
                                      index % 2 === 1
                                        ? "bg-slate-900/40"
                                        : "bg-transparent"
                                    }
                                  >
                                    <TableCell className="text-sm font-medium text-slate-100">
                                      {p.user.name}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-200">
                                      {p.user.email}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-300">
                                      {p.user.matric_number || "-"}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-300">
                                      {p.user.faculty || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                          p.attendance_date
                                            ? "bg-emerald-900/50 text-emerald-200 border border-emerald-600"
                                            : "bg-blue-900/50 text-blue-200 border border-blue-600"
                                        }`}
                                      >
                                        {p.attendance_date
                                          ? "Attended"
                                          : "Registered"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-400">
                                      {p.registration_date
                                        ? new Date(
                                            p.registration_date
                                          ).toLocaleDateString()
                                        : "-"}
                                    </TableCell>
                                    <TableCell>
                                      {p.attendance_date ? (
                                        <div>
                                          <div className="text-xs text-slate-300">
                                            {new Date(
                                              p.attendance_date
                                            ).toLocaleString()}
                                          </div>
                                          {p.method && (
                                            <div className="text-xs text-slate-500">
                                              via {p.method}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-500 text-xs">
                                          N/A
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              )
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="text-center text-slate-500 py-6"
                                >
                                  No participants found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : selectedEventId ? (
                <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                  <CardContent className="pt-6">
                    <p className="text-center text-slate-500 py-8">
                      Loading event statistics...
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-800 border-0 shadow-lg rounded-xl">
                  <CardContent className="pt-6">
                    <p className="text-center text-slate-300 py-8 text-lg font-medium">
                      Please select an event above to view its detailed
                      statistics.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// =========================================================================
// HELPER COMPONENTS
// =========================================================================

/* Simple QR icon so we don't mess with imports or dependencies */
function QrCodeIcon() {
  return (
    <div className="w-4 h-4 rounded-sm border border-slate-400 grid grid-cols-2 grid-rows-2 overflow-hidden">
      <div className="bg-slate-800" />
      <div className="bg-slate-800" />
      <div className="bg-slate-800" />
      <div />
    </div>
  );
}

/* Sidebar Button Component – same style as dashboard */
function SidebarButton({
  icon,
  label,
  open,
  active,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "destructive";
}) {
  const baseClasses =
    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-200 font-medium";
  const activeClasses = active
    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
    : variant === "destructive"
    ? "text-rose-300 hover:bg-rose-900/30"
    : "text-slate-300 hover:bg-gray-800 hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      <div
        className={`w-6 h-6 flex items-center justify-center transition-transform ${
          active ? "scale-100" : "scale-90"
        }`}
      >
        {icon}
      </div>
      {open && <span className="truncate">{label}</span>}
      {open && active && (
        <ChevronRight size={16} className="ml-auto text-white/70" />
      )}
    </button>
  );
}
