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

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!token) router.push("/login");
    if (!isAdmin) router.push("/dashboard");
  }, [token, isAdmin, router]);

  const handleLogout = async () => {
    await logout();
  };

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

  const downloadCSV = () => {
    if (!usersInsights || !eventOps || !engagement) return;
    setDownloading(true);
    try {
      const rows: string[] = [];
      const esc = (s: any) => `"${String(s ?? "").replace(/"/g, '""')}"`;
      rows.push(["Metric", "Value"].join(","));
      rows.push(["Total Users", usersInsights.total_users].join(","));
      rows.push([
        "User Growth % MoM",
        usersInsights.growth_percent,
      ].join(","));
      rows.push(["Pending Approvals", usersInsights.pending_approvals].join(","));
      rows.push(["Total Events Held", eventOps.total_events_held].join(","));
      rows.push([
        "Avg Attendance Rate %",
        engagement.participation_rate,
      ].join(","));

      rows.push("");
      rows.push(["Faculty", "Attendance Count"].join(","));
      facultyData.forEach((f) => rows.push([esc(f.name), f.value].join(",")));

      rows.push("");
      rows.push(["Month", "Registrations", "Attendees"].join(","));
      trendData.forEach((t) => rows.push([t.month, t.registrations, t.attendees].join(",")));

      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reports-summary-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
            label="Reports"
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
            onClick={() => router.push("/admin/attendance")}
          />
          <SidebarButton
            open={sidebarOpen}
            icon={<Settings size={18} />}
            label="Settings"
            onClick={() => router.push("/admin/settings")}
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
            <h2 className="text-2xl font-semibold tracking-tight">Analytics & Reports</h2>
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
            <Button onClick={downloadCSV} disabled={downloading} variant="secondary">
              {downloading ? "Preparing..." : "Download Report"}
            </Button>
          </div>
        </header>

        {/* content */}
        <main className="px-8 py-10 space-y-8 max-w-7xl mx-auto">
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

