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
} from "lucide-react";
import React from "react";
import NotificationBell from "@/components/NotificationBell";
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

export default function ReportsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Analytics state
  const [usersInsights, setUsersInsights] = useState<null | Awaited<ReturnType<typeof fetchUsersInsights>>>(null);
  const [eventOps, setEventOps] = useState<null | Awaited<ReturnType<typeof fetchEventOperations>>>(null);
  const [engagement, setEngagement] = useState<null | Awaited<ReturnType<typeof fetchAttendanceEngagement>>>(null);
  const [facultyData, setFacultyData] = useState<{ name: string; value: number }[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; registrations: number; attendees: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<Awaited<ReturnType<typeof fetchRecentActivity>>>([]);
  const [topEvents, setTopEvents] = useState<Awaited<ReturnType<typeof fetchTopEvents>>>([]);

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

  // Fetch individual event stats
  useEffect(() => {
    if (!selectedEventId || !isAdmin) return;
    
    const loadEventStats = async () => {
      setLoadingEventStats(true);
      try {
        const [event, participantsData, attendanceData] = await Promise.all([
          getEventById(selectedEventId),
          getEventParticipants(selectedEventId),
          getAttendanceList(selectedEventId).catch(() => ({ attendance_list: [] })),
        ]);

        const participants = participantsData.participants || [];
        const attendanceList = attendanceData.attendance_list || [];
        
        // Calculate stats
        const totalRegistrations = participants.length;
        const totalAttended = attendanceList.length;
        const attendanceRate = totalRegistrations > 0 
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
          const participant = participants.find((p: any) => 
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
            const date = new Date(p.registration_date).toISOString().split('T')[0];
            registrationTimeline[date] = (registrationTimeline[date] || 0) + 1;
          }
        });

        // Process attendance by day
        attendanceList.forEach((record: any) => {
          if (record.marked_at) {
            const date = new Date(record.marked_at).toISOString().split('T')[0];
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
          allDates.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Create cumulative timeline data
        let cumulativeRegistrations = 0;
        let cumulativeAttendance = 0;
        const timelineData = allDates.map((date) => {
          cumulativeRegistrations += registrationTimeline[date] || 0;
          cumulativeAttendance += attendanceTimeline[date] || 0;
          return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
            const attendance = attendanceList.find((a: any) => 
              a.email === p.user.email || a.matric_number === p.user.matric_number
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

  // Fetch analytics for admin with progressive loading
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
        setLoadingStates(prev => ({ ...prev, kpis: false }));
      } catch (err) {
        console.error("Failed to load KPIs:", err);
        setLoadingStates(prev => ({ ...prev, kpis: false }));
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
        setLoadingStates(prev => ({ ...prev, charts: false }));
      } catch (err) {
        console.error("Failed to load charts:", err);
        setLoadingStates(prev => ({ ...prev, charts: false }));
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
        setLoadingStates(prev => ({ ...prev, tables: false }));
      } catch (err) {
        console.error("Failed to load tables:", err);
        setLoadingStates(prev => ({ ...prev, tables: false }));
      }
    };

    // Progressive loading: KPIs -> Charts -> Tables
    loadKPIs();
    setTimeout(() => loadCharts(), 100);
    setTimeout(() => loadTables(), 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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
        XLSX.utils.book_append_sheet(workbook, facultySheet, "Faculty Distribution");

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
        XLSX.utils.book_append_sheet(workbook, activitySheet, "Recent Activity");

        const fileName = `analytics-overall-${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
      } else {
        // Individual Event Stats
        if (!eventStats) return;

        const eventName = eventStats.event.title.replace(/[^\w\s]/gi, "").replace(/\s+/g, "-");

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
            p.registration_date ? new Date(p.registration_date).toLocaleString() : "",
            p.attendance_date ? new Date(p.attendance_date).toLocaleString() : "",
            p.method || "",
          ]),
        ];
        const participantsSheet = XLSX.utils.aoa_to_sheet(participantsSheetData);
        XLSX.utils.book_append_sheet(workbook, participantsSheet, "Participants");

        // Faculty Distribution Sheet
        const facultySheetData = [
          ["Faculty", "Attendance Count"],
          ...Object.entries(eventStats.faculty_distribution).map(([faculty, count]) => [
            faculty,
            count,
          ]),
        ];
        const facultySheet = XLSX.utils.aoa_to_sheet(facultySheetData);
        XLSX.utils.book_append_sheet(workbook, facultySheet, "Faculty Distribution");

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
          const timelineSheet = XLSX.utils.aoa_to_sheet(timelineSheetData);
          XLSX.utils.book_append_sheet(workbook, timelineSheet, "Timeline");
        }

        const fileName = `analytics-event-${eventName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
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

  return (
    <div className="flex min-h-screen bg-[#F3F6FB] text-slate-900">
      {/* SIDEBAR */}
      <aside
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-20"
        } bg-[#071129] text-white shadow-xl`}
      >
        {/* sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className={`bg-white/90 backdrop-blur-sm rounded-xl border border-white/40 shadow-md flex items-center justify-center ${
                sidebarOpen ? "w-14 h-14" : "w-12 h-12"
              }`}
            >
              <img
                src="/iem-logo.jpg"
                alt="IEM UTM Logo"
                className={`object-contain ${
                  sidebarOpen ? "w-10 h-10" : "w-8 h-8"
                }`}
              />
            </div>

            {sidebarOpen && (
              <div>
                <div className="text-sm font-semibold">IEM Connect</div>
                <div className="text-xs text-slate-300">Admin Panel</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 text-slate-200 rounded hover:bg-white/10"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* menu */}
        <nav className="px-3 py-6 space-y-2">
          <SidebarButton
            open={sidebarOpen}
            icon={<PieChartIcon size={18} />}
            label="Dashboard"
            onClick={() => router.push("/dashboard")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<FileText size={18} />}
            label="Analytics"
            onClick={() => router.push("/admin/reports")}
            active
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<Calendar size={18} />}
            label="Events"
            onClick={() => router.push("/event")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<CheckSquare size={18} />}
            label="Attendance"
            onClick={() => router.push("/attendance")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => router.push("/settings")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<HelpCircle size={18} />}
            label="Help"
            onClick={() => router.push("/admin/help")}
          />

          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton
              open={sidebarOpen}
              icon={<LogOut size={18} />}
              label="Logout"
              onClick={handleLogout}
            />
          </div>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 min-h-screen">
        {/* top header */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
            <p className="text-sm text-slate-500">Comprehensive insights and analytics</p>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User Name + Role */}
            <div className="text-right">
              <div className="text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">
                {user.role}
              </div>
            </div>

            {/* Profile Picture - Clickable */}
            <button
              onClick={() => router.push("/profile")}
              className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 shadow-sm hover:border-blue-500 transition-colors cursor-pointer"
              title="View Profile"
            >
              <img
                src="/placeholder-user.jpg"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded hover:bg-slate-200"
            >
              <LogOut size={18} />
            </button>
            <Button 
              onClick={() => downloadExcel(activeTab === "overall" ? "overall" : "event")} 
              disabled={downloading || (activeTab === "event" && !eventStats)} 
              variant="secondary"
              className="gap-2"
            >
              <Download size={18} />
              {downloading 
                ? "Preparing..." 
                : activeTab === "overall" 
                ? "Download Overall Analytics (Excel)" 
                : "Download Event Analytics (Excel)"}
            </Button>
          </div>
        </header>

        {/* content */}
        <main className="px-8 py-10 space-y-8 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overall">Overall Statistics</TabsTrigger>
              <TabsTrigger value="event">Individual Event Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="space-y-8">
              {/* Top Row: KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingStates.kpis ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-10 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : usersInsights && eventOps && engagement ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Users</CardTitle>
                    <CardDescription>
                      +{usersInsights.growth_percent}% vs last month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{usersInsights.total_users}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Events Held</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{eventOps.total_events_held}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Avg. Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{engagement.participation_rate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Approvals</CardTitle>
                    <CardDescription>Click to review</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <button
                      className="text-left w-full"
                      onClick={() => {
                        router.push("/dashboard");
                        setTimeout(() => {
                          const el = document.getElementById("approvals-panel");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                    >
                      <div className="text-3xl font-bold">{usersInsights.pending_approvals}</div>
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
                  <Card key={i}>
                    <CardHeader>
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
                {/* Chart 1: Attendance by Faculty */}
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance by Faculty</CardTitle>
                    <CardDescription>Which faculty is most active?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={facultyData}>
                          <XAxis dataKey="name" hide />
                          <YAxis />
                          <ReTooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 2: Registration vs Attendance (6 months) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Registration vs. Attendance</CardTitle>
                    <CardDescription>Last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ReTooltip />
                          <Line type="monotone" dataKey="registrations" stroke="#10b981" strokeWidth={2} />
                          <Line type="monotone" dataKey="attendees" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 3: Event Status Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event Status</CardTitle>
                    <CardDescription>Open vs. Completed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Open", value: eventOps.status_funnel.Open },
                              { name: "Completed", value: eventOps.status_funnel.Completed },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                            innerRadius={50}
                            label
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#22c55e" />
                          </Pie>
                          <ReTooltip />
                        </PieChart>
                      </ResponsiveContainer>
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
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <Skeleton key={j} className="h-12 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : recentActivity.length > 0 || topEvents.length > 0 ? (
              <>
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Last 5 users registered or checked in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentActivity.length > 0 ? (
                          recentActivity.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell className="capitalize">{a.type.replace("_", " ")}</TableCell>
                              <TableCell>{a.user?.name}</TableCell>
                              <TableCell>{a.event?.title ?? "-"}</TableCell>
                              <TableCell>{a.method ?? "-"}</TableCell>
                              <TableCell>{new Date(a.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-slate-500">
                              No recent activity
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Top Events */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Events</CardTitle>
                    <CardDescription>Sorted by highest attendance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Attendance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topEvents.length > 0 ? (
                          topEvents.map((e) => (
                            <TableRow key={e.event.id}>
                              <TableCell>{e.event.title}</TableCell>
                              <TableCell>
                                {e.event.start_date} {e.event.end_date && e.event.end_date !== e.event.start_date ? `- ${e.event.end_date}` : ""}
                              </TableCell>
                              <TableCell>{e.attendance_count}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-slate-500">
                              No events found
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

            <TabsContent value="event" className="space-y-8">
              {/* Event Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Event</CardTitle>
                  <CardDescription>
                    Choose an event to view its detailed statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedEventId?.toString() || ""}
                    onValueChange={(value) => setSelectedEventId(parseInt(value))}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
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
                    <Card key={i}>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>{eventStats.event.title}</CardTitle>
                      <CardDescription>
                        {new Date(eventStats.event.start_date).toLocaleDateString()}
                        {eventStats.event.end_date !== eventStats.event.start_date &&
                          ` - ${new Date(eventStats.event.end_date).toLocaleDateString()}`}
                        {" • "}
                        Status: {eventStats.event.status}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Registrations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {eventStats.registrations.total}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Total Attended</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                          {eventStats.registrations.attended}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          {eventStats.registrations.attendance_rate}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Attendance Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendance Methods</CardTitle>
                        <CardDescription>Breakdown by check-in method</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "QR Code", value: eventStats.attendance_methods.QR },
                                  { name: "Code", value: eventStats.attendance_methods.Code },
                                  { name: "Manual", value: eventStats.attendance_methods.Manual },
                                ]}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={100}
                                innerRadius={50}
                                label
                              >
                                <Cell fill="#3b82f6" />
                                <Cell fill="#10b981" />
                                <Cell fill="#f59e0b" />
                              </Pie>
                              <ReTooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Faculty Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Attendance by Faculty</CardTitle>
                        <CardDescription>Faculty distribution for this event</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={Object.entries(eventStats.faculty_distribution).map(
                                ([name, value]) => ({ name, value })
                              )}
                            >
                              <XAxis dataKey="name" hide />
                              <YAxis />
                              <ReTooltip />
                              <Bar dataKey="value" fill="#8b5cf6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Registration vs Attendance Timeline */}
                  {eventStats.timeline && eventStats.timeline.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Registration vs. Attendance Timeline</CardTitle>
                        <CardDescription>
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
                              />
                              <YAxis />
                              <ReTooltip />
                              <Line 
                                type="monotone" 
                                dataKey="registrations" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="Registrations"
                                dot={{ r: 4 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="attendance" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                name="Attendance"
                                dot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Participants Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Participants</CardTitle>
                      <CardDescription>
                        Total: {eventStats.participants.length} participant(s)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Matric</TableHead>
                            <TableHead>Faculty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Registration Date</TableHead>
                            <TableHead>Attendance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eventStats.participants.length > 0 ? (
                            eventStats.participants.map((p: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{p.user.name}</TableCell>
                                <TableCell>{p.user.email}</TableCell>
                                <TableCell>{p.user.matric_number || "-"}</TableCell>
                                <TableCell>{p.user.faculty || "-"}</TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      p.status === "attended"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-green-100 text-green-700"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {p.registration_date
                                    ? new Date(p.registration_date).toLocaleString()
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {p.attendance_date ? (
                                    <div>
                                      <div className="text-sm">
                                        {new Date(p.attendance_date).toLocaleString()}
                                      </div>
                                      {p.method && (
                                        <div className="text-xs text-slate-500">
                                          via {p.method}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400">Not attended</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-slate-500">
                                No participants found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : selectedEventId ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-slate-500 py-8">
                      Loading event statistics...
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-slate-500 py-8">
                      Please select an event to view its statistics
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

/* COMPONENTS */

function SidebarButton({
  icon,
  label,
  open,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
        active
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      {open && <span className="truncate">{label}</span>}
    </button>
  );
}

