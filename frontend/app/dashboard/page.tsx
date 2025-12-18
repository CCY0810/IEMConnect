"use client";

import { useEffect, useState, useMemo } from "react";
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
import { getUnverifiedUsers, verifyUser } from "@/lib/admin-api";
import { getEvents, Event } from "@/lib/event-api"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import {
  Menu,
  LogOut,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight, 
  UserCheck, 
  UserPlus, 
  ChevronLeft, 
} from "lucide-react";

import NotificationBell from "@/components/NotificationBell"; 
import UserAvatar from "@/components/UserAvatar"; 
import React from "react";


/* --- START: TYPE DEFINITIONS --- */

interface UnverifiedUser {
  id: number; 
  name: string;
  email: string;
  membership_number: string;
  createdAt: string;
}

interface DashboardUser {
  id: string; 
  name: string;
  email: string;
  role: 'member' | 'admin';
  membership_number: string;
  matric_number?: string; 
  faculty?: string;       
}

/* --- END: TYPE DEFINITIONS --- */


export default function DashboardPage() {
  const { user: authUser, token, logout } = useAuth();
  const router = useRouter();
  const user = authUser as DashboardUser;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<number | null>(null); 
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // --- Core Backend Logic (Preserved) ---
  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) return;
      try {
        setEventsLoading(true);
        const data = await getEvents(); 
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [token]);

  const handleLogout = async () => {
    await logout();
  };

  const fetchUnverifiedUsers = async () => {
    try {
      setLoading(true);
      const response = await getUnverifiedUsers();
      setUnverifiedUsers(response.users);
      setMessage(null);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to fetch unverified users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (id: number) => {
    try {
      setApprovalLoading(id);
      const res = await verifyUser(id);

      setMessage({ type: "success", text: res.message });
      setUnverifiedUsers((prev) => prev.filter((u) => u.id !== id)); 
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to verify user",
      });
    } finally {
      setApprovalLoading(null);
    }
  };

  const toggleApprovalPanel = () => {
    const open = !showApprovalPanel;
    setShowApprovalPanel(open);
    if (open && user?.role === "admin") fetchUnverifiedUsers();
  };
  // --- End Core Backend Logic ---

  const isAdmin = user?.role === "admin";

  // Calculate stats
  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    (e) => e.status === "Upcoming" || e.status === "Open"
  ).length;
  const registeredEvents = events.filter((e) => e.is_registered === true).length;
  const completedEvents = events.filter((e) => e.status === "Completed").length;
  const pendingApprovals = unverifiedUsers.length;

  const handleCalendarDateClick = (date: Date, dateEvents: Event[]) => {
    if (dateEvents.length > 0) {
      router.push(`/view_event?id=${dateEvents[0].id}`);
    }
  };

  if (!user) return null;

  return (
    // AESTHETIC FIX: Main background set to deep slate color
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* SIDEBAR (Maintains dark blue/indigo gradient) */}
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
                <div className="text-base font-extrabold tracking-wide">IEM Connect</div>
                <div className="text-xs text-slate-400 font-medium">
                  {isAdmin ? "Admin Portal" : "Member Dashboard"}
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

        {/* menu */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <SidebarButton
            open={sidebarOpen}
            icon={<PieChartIcon size={20} />}
            label="Dashboard"
            onClick={() => router.push("/dashboard")}
            active
          />
          {isAdmin && (
            <SidebarButton
              open={sidebarOpen}
              icon={<FileText size={20} />}
              label="Analytics & Reports"
              onClick={() => router.push("/admin/reports")}
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
              onClick={handleLogout}
              variant="destructive"
            />
          </div>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 min-h-screen">
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard</h2>
            <p className="text-sm text-slate-300">Welcome back, {user.name}.</p>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell (Assuming it handles dark/light contrast internally) */}
            <NotificationBell />

            {/* Admin Approval Quick Access */}
            {isAdmin && pendingApprovals > 0 && (
                <Button 
                  onClick={toggleApprovalPanel} 
                  variant="default" 
                  size="sm" 
                  className="relative bg-red-600 hover:bg-red-700 shadow-md transition-all text-white"
                >
                  <UserCheck size={16} className="mr-2" />
                  {pendingApprovals} Approvals
                </Button>
            )}

            {/* User Info & Profile Link */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white">{user.name}</div>
                <div className="text-xs text-slate-400 capitalize">
                  {user.role}
                </div>
              </div>

              <button
                onClick={() => router.push("/profile")}
                className="rounded-full overflow-hidden border-2 border-transparent shadow hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                title="View Profile"
              >
                <UserAvatar size="md" />
              </button>

              <button className="p-2 rounded-lg hover:bg-white/10 text-white" onClick={handleLogout}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* content */}
        <main className="px-8 py-10 space-y-10 max-w-7xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Events"
              value={totalEvents}
              icon={<Calendar className="h-6 w-6" />}
              description="Total events available"
              loading={eventsLoading}
              color="blue"
            />
            <StatsCard
              title="Upcoming"
              value={upcomingEvents}
              icon={<Clock className="h-6 w-6" />}
              description="Events currently open"
              loading={eventsLoading}
              color="amber"
            />
            <StatsCard
              title="My Registrations"
              value={registeredEvents}
              icon={<CheckCircle2 className="h-6 w-6" />}
              description="Active event registrations"
              loading={eventsLoading}
              color="emerald"
            />
            {isAdmin ? (
              <StatsCard
                title="Pending Approvals"
                value={pendingApprovals}
                icon={<UserPlus size={20} />}
                description="New users awaiting verification"
                loading={loading}
                color="red"
              />
            ) : (
              <StatsCard
                title="Completed Events"
                value={completedEvents}
                icon={<TrendingUp size={20} />}
                description="Past events attended"
                loading={eventsLoading}
                color="violet"
              />
            )}
          </div>

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN - Calendar & Profile */}
            <div className="lg:col-span-2 space-y-8">
              {/* CALENDAR VIEW (Dark card body) */}
              <Card className="bg-slate-700 shadow-xl border border-slate-600 rounded-xl h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-indigo-400">Event Calendar</CardTitle>
                  <CardDescription className="text-slate-400">
                    Visual summary of scheduled events. Click on a date to view details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-8">
                  {eventsLoading ? (
                    <div className="flex items-center justify-center h-96 text-slate-500 bg-slate-800 border border-dashed rounded-xl">
                      Loading calendar data...
                    </div>
                  ) : (
                    <SimpleMonthView
                      events={events}
                      onDateClick={handleCalendarDateClick}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN - Quick Actions & Recent Events */}
            <div className="space-y-8">
              {/* QUICK ACTIONS (Dark card body) */}
              <Card className="bg-slate-700 shadow-xl border border-slate-600 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-indigo-400">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <QuickActionButton
                    icon={<Calendar className="h-5 w-5" />}
                    label="Browse Events"
                    onClick={() => router.push("/event")}
                  />
                  {isAdmin && (
                    <QuickActionButton
                      icon={<FileText className="h-5 w-5" />}
                      label="Create New Event"
                      onClick={() => router.push("/create_event")}
                    />
                  )}
                  <QuickActionButton
                    icon={<CheckSquare className="h-5 w-5" />}
                    label="View Attendance"
                    onClick={() => router.push("/attendance")}
                  />
                  <QuickActionButton
                    icon={<Settings className="h-5 w-5" />}
                    label="Manage Settings"
                    onClick={() => router.push("/settings")}
                  />
                </CardContent>
              </Card>

              {/* UPCOMING EVENTS (Dark card body) */}
              <Card className="bg-slate-700 shadow-xl border border-slate-600 rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-indigo-400">Upcoming Events</CardTitle>
                  <CardDescription className="text-slate-400">Your next 5 scheduled activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <p className="text-slate-500 text-sm py-4 text-center">Loading event schedule...</p>
                  ) : upcomingEvents === 0 ? (
                    <p className="text-slate-500 text-sm py-4 text-center">No upcoming events scheduled.</p>
                  ) : (
                    <div className="space-y-3">
                      {events
                        .filter((e) => e.status === "Upcoming" || e.status === "Open")
                        .slice(0, 5)
                        .map((event) => (
                          <UpcomingEventCard key={event.id} event={event} router={router} />
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ADMIN PANEL (Dark card body) */}
          {user.role === "admin" && (
            <Card className="bg-slate-700 shadow-xl border border-slate-600 rounded-xl">
              {/* FIX: Conditional Border Logic Added Here */}
              <CardHeader className={showApprovalPanel ? "border-b border-slate-600" : ""}>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-blue-400"><UserCheck size={20} /> Admin Panel</CardTitle>
                    <CardDescription className="text-slate-400">
                      Review and verify new user registrations.
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={toggleApprovalPanel} 
                    variant={showApprovalPanel ? "secondary" : "default"} 
                    className={pendingApprovals > 0 && !showApprovalPanel ? "bg-red-600 hover:bg-red-700 text-white" : "text-indigo-400 border-indigo-400 hover:bg-slate-800"}
                  >
                    {showApprovalPanel ? "Hide Approvals" : `Show Approvals (${pendingApprovals})`}
                  </Button>
                </div>
              </CardHeader>

              {showApprovalPanel && (
                <CardContent className="mt-4 p-6" id="approvals-panel">

                  {message && (
                    <Alert
                      className="mb-4 rounded-lg bg-slate-800 text-white"
                      variant={message.type === "error" ? "destructive" : "default"}
                    >
                      <AlertTitle className="font-bold">
                        {message.type === "error" ? "Error" : "Success"}
                      </AlertTitle>
                      <AlertDescription className="text-sm text-slate-300">**{message.text}**</AlertDescription>
                    </Alert>
                  )}

                  {loading ? (
                    <p className="text-slate-500">Loading users...</p>
                  ) : unverifiedUsers.length === 0 ? (
                    <div className="text-slate-500 text-center py-4 border border-dashed rounded-lg bg-slate-800">All users verified. No pending registrations.</div>
                  ) : (
                    /* FIX: Added Fixed Height Scroll Container for Admin Table */
                    <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-slate-800 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="font-bold text-slate-300">Name</TableHead>
                            <TableHead className="font-bold text-slate-300">Email</TableHead>
                            <TableHead className="font-bold text-slate-300">Membership No.</TableHead>
                            <TableHead className="font-bold text-slate-300">Registered</TableHead>
                            <TableHead className="font-bold text-slate-300 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-slate-700">
                          {unverifiedUsers.map((u) => (
                            <TableRow key={u.id} className="hover:bg-slate-600">
                              <TableCell className="font-medium text-white">{u.name}</TableCell>
                              <TableCell className="text-sm text-slate-300">{u.email}</TableCell>
                              <TableCell className="text-white">{u.membership_number}</TableCell>
                              <TableCell className="text-slate-300">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  disabled={approvalLoading === u.id}
                                  onClick={() => handleApproveUser(u.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 shadow-md text-white"
                                >
                                  {approvalLoading === u.id
                                    ? "Verifying..."
                                    : "Verify"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

/* --- ENHANCED COMPONENTS --- */

function Info({ label, value }: { label: string; value: any }) {
  // FIX: Info box background changed to slate-800
  return (
    <div className="p-5 border border-slate-600 rounded-lg bg-slate-800 shadow-sm min-w-0">
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider whitespace-normal">{label}</p>
      <p className="text-base font-medium text-white mt-1 whitespace-normal break-all">{value || "N/A"}</p>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  description,
  loading,
  color = "blue",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  loading?: boolean;
  color?: "blue" | "amber" | "emerald" | "red" | "violet";
}) {
  const iconColor = {
    blue: "text-blue-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
    violet: "text-violet-400",
  }[color];
  const borderColor = {
    blue: "border-indigo-500",
    amber: "border-yellow-500",
    emerald: "border-emerald-500",
    red: "border-red-500",
    violet: "border-violet-500",
  }[color];
  const bgColor = {
      blue: "bg-blue-900/40", // Darker icon backgrounds
      amber: "bg-amber-900/40",
      emerald: "bg-emerald-900/40",
      red: "bg-red-900/40",
      violet: "bg-violet-900/40",
  }[color];

  return (
    <Card className={`bg-slate-700 shadow-lg transition-all duration-300 hover:shadow-xl border-t-4 ${borderColor} rounded-xl`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-300">{title}</p>
            <p className="text-4xl font-extrabold mt-1 text-white">
              {loading ? "..." : value}
            </p>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-xl ${iconColor} ${bgColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  variant?: 'default' | 'destructive';
}) {
  const baseClasses = "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-200 font-medium";
  const activeClasses = active ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg" : variant === 'destructive' ? "text-rose-300 hover:bg-rose-900/30" : "text-slate-300 hover:bg-gray-800 hover:text-white";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
    >
      <div className={`w-6 h-6 flex items-center justify-center transition-transform ${active ? 'scale-100' : 'scale-90'}`}>{icon}</div>
      {open && <span className="truncate">{label}</span>}
      {open && active && <ChevronRight size={16} className="ml-auto text-white/70" />}
    </button>
  );
}

function QuickActionButton({ icon, label, onClick, variant }: { icon: React.ReactNode; label: string; onClick: () => void; variant?: 'primary' | 'secondary' }) {
    const isPrimary = variant === 'primary';
    
    // FIX: Ensures default state is dark/outline, and hover state applies primary colors.
    const classes = isPrimary 
        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md" 
        : "bg-slate-800 text-slate-300 border border-slate-600 hover:bg-indigo-900 hover:text-indigo-400 hover:border-indigo-500 transition-all shadow-sm"; 

    return (
        <Button
            variant="outline"
            className={`w-full justify-start font-semibold rounded-lg ${classes}`}
            onClick={onClick}
        >
            <span className="mr-2">{icon}</span>
            {label}
        </Button>
    );
}

function UpcomingEventCard({ event, router }: { event: Event; router: any }) {
    const date = new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = event.start_time ? event.start_time.substring(0, 5) : "TBD";
    const isRegistered = event.is_registered;

    return (
        <button
            onClick={() => router.push(`/view_event?id=${event.id}`)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 
              ${isRegistered ? 'bg-emerald-900/40 border-emerald-700 hover:bg-emerald-900/50' : 'bg-amber-900/40 border-amber-700 hover:bg-amber-900/50'}`
            }
        >
            <div className={`flex flex-col items-center justify-center flex-shrink-0 w-12 h-12 rounded-lg shadow-sm 
              ${isRegistered ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`
            }>
                <span className="text-xs font-bold">{date.split(' ')[0]}</span>
                <span className="text-base font-extrabold -mt-1">{date.split(' ')[1]}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-base text-white truncate">{event.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                    {time} | {isRegistered ? <Badge className="bg-emerald-500 text-white shadow-sm">Registered</Badge> : <Badge className="bg-amber-500 text-white shadow-sm">Not Registered</Badge>}
                </div>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-400 flex-shrink-0" />
        </button>
    );
}


/* --- SIMPLE MONTH VIEW CALENDAR COMPONENT --- */

// Helper to correctly parse dates from ISO string without time zone conversion issue
const parseDate = (dateString: string): Date => {
    const parts = dateString.split('-');
    return new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
};


const SimpleMonthView: React.FC<{
  events: Event[];
  onDateClick: (date: Date, dateEvents: Event[]) => void;
}> = ({ events, onDateClick }) => {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());

  // hover tooltip
  const [hoveredEvents, setHoveredEvents] = useState<Event[] | null>(null);
  const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 });

  // multi-event picker
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // 🔹 map events by date
  const eventsMap = useMemo(() => {
    const map = new Map<
      string,
      { events: Event[]; hasRegistered: boolean }
    >();

    events.forEach((e) => {
      const key = parseDate(e.start_date).toISOString().split("T")[0];
      const entry = map.get(key) || { events: [], hasRegistered: false };
      entry.events.push(e);
      if (e.is_registered) entry.hasRegistered = true;
      map.set(key, entry);
    });

    return map;
  }, [events]);

  // 🔹 build calendar days
  const daysInMonth = useMemo(() => {
    const date = parseDate(`${currentYear}-${currentMonth + 1}-01`);
    const days: any[] = [];

    const firstDay = date.getUTCDay();
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null });
    }

    while (date.getUTCMonth() === currentMonth) {
      const day = date.getUTCDate();
      const key = date.toISOString().split("T")[0];

      const today = new Date();
      const todayKey = parseDate(
        `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`
      )
        .toISOString()
        .split("T")[0];

      const eventData = eventsMap.get(key);
      let type: "registered" | "open" | "none" = "none";

      if (eventData) {
        type = eventData.hasRegistered ? "registered" : "open";
      }

      days.push({
        day,
        dateKey: key,
        isToday: key === todayKey,
        type,
      });

      date.setUTCDate(day + 1);
    }

    return days;
  }, [currentMonth, currentYear, eventsMap]);

  const changeMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + delta);
      return d;
    });
  };

  // 🔹 click logic
const handleDayClick = (dateKey?: string) => {
  if (!dateKey) return;

  const dayEvents = eventsMap.get(dateKey)?.events || [];

  // 🔹 NEW: always show selector if there is at least 1 event
  if (dayEvents.length >= 1) {
    setSelectedEvents(dayEvents);
    setShowPicker(true);
  }
};


  // 🔹 hover tooltip
  const handleHover = (
    e: React.MouseEvent<HTMLButtonElement>,
    dateKey?: string
  ) => {
    if (!dateKey) return;
    const dayEvents = eventsMap.get(dateKey)?.events;
    if (!dayEvents || dayEvents.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredEvents(dayEvents);
    setHoverPos({ top: rect.bottom + 10, left: rect.left + rect.width / 2 });
  };

  const CalendarLegend = () => (
  <div className="flex justify-center items-center gap-6 text-xs text-slate-200 mt-8">
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-indigo-600 border border-indigo-700"></span>
      <span>Today</span>
    </div>

    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
      <span>Registered</span>
    </div>

    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-amber-400"></span>
      <span>Open / Not Registered</span>
    </div>
  </div>


);


  return (
    <>
      {/* TOOLTIP */}
      {hoveredEvents && (
        <div
          style={{
            position: "fixed",
            top: hoverPos.top,
            left: hoverPos.left,
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
          className="bg-gray-800 text-white p-3 rounded-lg shadow-2xl min-w-[220px]"
        >
          <h4 className="font-bold text-sm border-b border-gray-600 mb-1">
            Events
          </h4>
          <ul className="text-xs space-y-1">
            {hoveredEvents.map((e) => (
              <li key={e.id}>
                <b>{e.title}</b> ({e.start_time || "TBD"})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CALENDAR */}
      <div className="p-4 bg-slate-800 rounded-lg calendar-container">
        <div className="flex justify-between items-center mb-6">
          <Button
          variant="ghost"
          size="icon"
          onClick={() => changeMonth(-1)}
          className="text-white hover:bg-slate-700"
        >
          <ChevronLeft className="text-white" />
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
            className="text-white hover:bg-slate-700"
          >
            <ChevronRight className="text-white" />
          </Button>

        </div>


        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-indigo-400 font-bold text-xs">
              {d}
            </div>
          ))}

          {daysInMonth.map((d, i) => (
            <button
              key={i}
              onClick={() => handleDayClick(d.dateKey)}
              onMouseEnter={(e) => handleHover(e, d.dateKey)}
              onMouseLeave={() => setHoveredEvents(null)}
              disabled={!d.day}
              className={`
                min-h-[5rem] p-2 rounded-lg border transition-all
                ${!d.day && "border-transparent"}
                ${d.isToday && "bg-indigo-600 text-white border-indigo-700 shadow-lg"}
                ${d.type === "registered" && !d.isToday && "bg-emerald-900/40 text-emerald-400 border-emerald-700"}
                ${d.type === "open" && !d.isToday && "bg-amber-900/40 text-amber-400 border-amber-700"}
                ${d.type === "none" && d.day && !d.isToday && "bg-slate-700 hover:bg-slate-600 border-slate-600"}
              `}
            >
              <span className="text-white">{d.day}</span>

              {d.day && d.type !== "none" && (
                <div className="mt-auto flex gap-1 pt-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      d.type === "registered"
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                  />
                </div>

)}

            </button>
          ))}
        </div>
      </div>
<CalendarLegend />
      {/* MULTI EVENT PICKER */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              Select an Event
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {selectedEvents.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setShowPicker(false);
                    router.push(`/view_event?id=${e.id}`);
                  }}
                  className="w-full text-left p-3 rounded-lg bg-slate-700 hover:bg-slate-600"
                >
                  <div className="font-semibold text-white">{e.title}</div>
                  <div className="text-xs text-slate-400">
                    {e.start_time || "TBD"}
                  </div>
                </button>
              ))}
            </div>

            <Button
              className="mt-5 w-full"
              variant="secondary"
              onClick={() => setShowPicker(false)}
            >
              Close
            </Button>
          </div>

        </div>
        
      )}
    </>
  );
};
