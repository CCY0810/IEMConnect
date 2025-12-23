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
import { getUnverifiedUsers } from "@/lib/admin-api";
import { getEvents, Event } from "@/lib/event-api";
import {
  Menu,
  LogOut,
  FileText,
  AlertTriangle,
  Calendar,
  CheckSquare,
  Settings,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  UserPlus,
  ChevronLeft,
  X,
} from "lucide-react";

import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import React from "react";

/* --- TYPE DEFINITIONS --- */
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
  role: "member" | "admin";
  membership_number: string;
  matric_number?: string;
  faculty?: string;
}

export default function DashboardPage() {
  const { user: authUser, token, logout } = useAuth();
  const router = useRouter();
  const user = authUser as DashboardUser;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unverifiedUsers, setUnverifiedUsers] = useState<UnverifiedUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (!token) router.push("/login");

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!token || user?.role !== "admin") return;
      try {
        setPendingLoading(true);
        const response = await getUnverifiedUsers();
        setUnverifiedUsers(response.users || []);
      } catch (error) {
        console.error("Failed to fetch pending user count:", error);
      } finally {
        setPendingLoading(false);
      }
    };
    fetchPendingCount();
  }, [token, user?.role]);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  const isAdmin = user?.role === "admin";
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => e.status === "Upcoming" || e.status === "Open").length;
  const registeredEvents = events.filter((e) => e.is_registered === true).length;
  const completedEvents = events.filter((e) => e.status === "Completed").length;

  const handleCalendarDateClick = (date: Date, dateEvents: Event[]) => {
    if (dateEvents.length > 0) router.push(`/view_event?id=${dateEvents[0].id}`);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      
      {/* 1. LOGOUT MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Logout Confirmation</h3>
              <p className="mb-6 text-slate-400">Are you sure you want to end your session?</p>
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1 border-slate-600 bg-transparent text-white hover:bg-slate-700" onClick={() => setIsLogoutModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MOBILE SIDEBAR OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/80 z-[45] lg:hidden backdrop-blur-md transition-all duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* 3. SIDEBAR */}
      <aside
        className={`fixed lg:relative z-50 h-full transition-all duration-300 ease-in-out bg-gradient-to-b from-[#071129] to-gray-900 text-white shadow-2xl border-r border-slate-700 flex flex-col shrink-0 overflow-hidden
        ${sidebarOpen 
            ? "translate-x-0 w-full sm:w-80 lg:w-64 opacity-100 visible" 
            : "-translate-x-full lg:translate-x-0 w-0 lg:w-0 opacity-0 invisible pointer-events-none"}`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0 h-[73px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-white rounded-xl p-2 shadow-md flex items-center justify-center w-10 h-10 shrink-0">
              <img src="/iem-logo.jpg" alt="Logo" className="object-contain w-full h-full" />
            </div>
            {sidebarOpen && (
              <div className="whitespace-nowrap transition-opacity duration-300">
                <div className="text-base font-extrabold tracking-wide">IEM Connect</div>
                <div className="text-xs text-slate-400 font-medium">{isAdmin ? "Admin Portal" : "Member Dashboard"}</div>
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={28}/>
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarButton open={sidebarOpen} icon={<PieChartIcon size={20} />} label="Dashboard" onClick={() => { router.push("/dashboard"); if(window.innerWidth < 1024) setSidebarOpen(false); }} active />
          {isAdmin && <SidebarButton open={sidebarOpen} icon={<UserCheck size={20} />} label="Admin Panel" onClick={() => { router.push("/admin/admin_panel"); if(window.innerWidth < 1024) setSidebarOpen(false); }} />}
          {isAdmin && <SidebarButton open={sidebarOpen} icon={<FileText size={20} />} label="Reports" onClick={() => { router.push("/admin/reports"); if(window.innerWidth < 1024) setSidebarOpen(false); }} />}
          <SidebarButton open={sidebarOpen} icon={<Calendar size={20} />} label="Events" onClick={() => { router.push("/event"); if(window.innerWidth < 1024) setSidebarOpen(false); }} />
          <SidebarButton open={sidebarOpen} icon={<CheckSquare size={20} />} label="Attendance" onClick={() => { router.push("/attendance"); if(window.innerWidth < 1024) setSidebarOpen(false); }} />
          <SidebarButton open={sidebarOpen} icon={<Settings size={20} />} label="Settings" onClick={() => { router.push("/settings"); if(window.innerWidth < 1024) setSidebarOpen(false); }} />
          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton open={sidebarOpen} icon={<LogOut size={20} />} label="Logout" onClick={() => setIsLogoutModalOpen(true)} variant="destructive" />
          </div>
        </nav>
      </aside>

      {/* 4. MAIN LAYOUT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* GLASSY STICKY HEADER */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-3 sticky top-0 z-40 bg-slate-900/60 backdrop-blur-md border-b border-white/10 shadow-xl shrink-0 h-[73px]">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
              aria-label="Toggle Sidebar"
            >
              <Menu size={24}/>
            </button>

            <div className="min-w-0">
              <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-white truncate">Dashboard</h2>
              <p className="hidden xs:block text-[10px] sm:text-xs text-slate-400 truncate">Welcome back, {user.name}.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-5 ml-4">
            <NotificationBell />
            {isAdmin && unverifiedUsers.length > 0 && (
                <Button onClick={() => router.push("/admin/admin_panel")} size="sm" className="hidden md:flex bg-red-600/80 hover:bg-red-700 text-white h-8">
                  <UserCheck size={14} className="mr-2" /> {unverifiedUsers.length}
                </Button>
            )}
            
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">{user.role}</div>
              </div>
              <button onClick={() => router.push("/profile")} className="rounded-full border-2 border-transparent hover:ring-2 hover:ring-indigo-500 transition-all shrink-0">
                <UserAvatar size="sm" />
              </button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsLogoutModalOpen(true)}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors h-9 w-9 shrink-0"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </header>

        {/* SCROLLABLE DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full space-y-6 lg:space-y-10">
            
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <StatsCard title="Total Events" value={totalEvents} icon={<Calendar />} description="Total available" loading={eventsLoading} color="blue" />
              <StatsCard title="Upcoming" value={upcomingEvents} icon={<Clock />} description="Open events" loading={eventsLoading} color="amber" />
              <StatsCard title="My Registrations" value={registeredEvents} icon={<CheckCircle2 />} description="Active events" loading={eventsLoading} color="emerald" />
              {isAdmin ? (
                <StatsCard title="Pending" value={unverifiedUsers.length} icon={<UserPlus />} description="New users" loading={pendingLoading} color="red" />
              ) : (
                <StatsCard title="Completed" value={completedEvents} icon={<TrendingUp />} description="Past events" loading={eventsLoading} color="violet" />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start pb-10">
              <div className="lg:col-span-2 space-y-8 min-w-0">
                <Card className="bg-slate-700/50 backdrop-blur-sm shadow-xl border border-slate-600 rounded-xl overflow-hidden">
                  <CardHeader className="p-4 lg:p-6">
                    <CardTitle className="text-lg lg:text-xl font-bold text-indigo-400">Event Calendar</CardTitle>
                    <CardDescription className="text-slate-400">Visual summary of scheduled events.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 lg:p-6">
                    {eventsLoading ? (
                      <div className="flex items-center justify-center h-64 lg:h-96 text-slate-500 bg-slate-800 border border-dashed rounded-xl">Loading calendar...</div>
                    ) : (
                      <div className="overflow-x-auto pb-4">
                        <div className="min-w-[600px] lg:min-w-0">
                          <SimpleMonthView events={events} onDateClick={handleCalendarDateClick} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 lg:space-y-8">
                <Card className="bg-slate-700/50 backdrop-blur-sm shadow-xl border border-slate-600 rounded-xl">
                  <CardHeader className="p-4 lg:p-6 pb-2"><CardTitle className="text-lg font-bold text-indigo-400">Quick Actions</CardTitle></CardHeader>
                  <CardContent className="p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    <QuickActionButton icon={<Calendar className="h-4 w-4" />} label="Browse Events" onClick={() => router.push("/event")} />
                    {isAdmin && <QuickActionButton icon={<FileText className="h-4 w-4" />} label="Create Event" onClick={() => router.push("/create_event")} />}
                    <QuickActionButton icon={<CheckSquare className="h-4 w-4" />} label="Attendance" onClick={() => router.push("/attendance")} />
                    <QuickActionButton icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => router.push("/settings")} />
                  </CardContent>
                </Card>

                <Card className="bg-slate-700/50 backdrop-blur-sm shadow-xl border border-slate-600 rounded-xl">
                  <CardHeader className="p-4 lg:p-6 pb-2">
                    <CardTitle className="text-lg font-bold text-indigo-400">Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6">
                    {eventsLoading ? (
                      <p className="text-slate-500 text-sm text-center py-4">Loading...</p>
                    ) : upcomingEvents === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">No upcoming events.</p>
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
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function SidebarButton({ icon, label, open, active, onClick, variant }: any) {
  const isDestructive = variant === 'destructive';
  if (!open) return (
     <button onClick={onClick} className={`w-full flex items-center justify-center py-4 lg:py-3 transition-all ${active ? "text-indigo-400" : "text-slate-400"}`}>
        <div className="w-6 h-6">{icon}</div>
     </button>
  );

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-4 lg:py-3 rounded-lg text-base lg:text-sm transition-all duration-200 font-medium whitespace-nowrap
      ${active ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg" : 
        isDestructive ? "text-rose-300 hover:bg-rose-900/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
    >
      <div className="w-6 h-6 flex items-center justify-center shrink-0">{icon}</div>
      <span className="truncate">{label}</span>
    </button>
  );
}

function StatsCard({ title, value, icon, description, loading, color }: any) {
  const config: Record<string, { borderColor: string, iconBg: string, iconText: string }> = {
    blue: { borderColor: "border-indigo-500", iconBg: "bg-blue-900/40", iconText: "text-blue-400" },
    amber: { borderColor: "border-yellow-500", iconBg: "bg-amber-900/40", iconText: "text-amber-400" },
    emerald: { borderColor: "border-emerald-500", iconBg: "bg-emerald-900/40", iconText: "text-emerald-400" },
    red: { borderColor: "border-red-500", iconBg: "bg-red-900/40", iconText: "text-red-400" },
    violet: { borderColor: "border-violet-500", iconBg: "bg-violet-900/40", iconText: "text-violet-400" },
  };

  const style = config[color] || config.blue;

  return (
    <Card className={`bg-slate-700/80 rounded-xl shadow-lg relative overflow-hidden border-2 transition-all duration-300 ${style.borderColor}`}>
      <CardContent className="p-4 lg:p-6 flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-300 truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-extrabold mt-1 text-white truncate">{loading ? "..." : value}</p>
          <p className="text-[10px] text-slate-400 mt-1 truncate">{description}</p>
        </div>
        <div className={`p-2 lg:p-3 rounded-xl shrink-0 ml-2 ${style.iconBg} ${style.iconText}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionButton({ icon, label, onClick }: any) {
    return (
        <Button
            variant="outline"
            className="w-full justify-start font-semibold rounded-lg bg-slate-800/50 text-slate-300 border-slate-600 hover:bg-indigo-900/50 hover:text-indigo-400 hover:border-indigo-500 transition-all text-xs lg:text-sm"
            onClick={onClick}
        >
            <span className="mr-2 shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
        </Button>
    );
}

function UpcomingEventCard({ event, router }: { event: Event; router: any }) {
    const date = new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isRegistered = event.is_registered;

    return (
      <button
        onClick={() => router.push(`/view_event?id=${event.id}`)}
        className={`group w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center gap-3
          ${isRegistered ? "bg-emerald-900/20 border-emerald-700/50 hover:border-emerald-500" : "bg-amber-900/20 border-amber-700/50 hover:border-amber-500"}`}
      >
        <div className={`flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-lg text-white text-[10px] font-bold
            ${isRegistered ? "bg-emerald-600" : "bg-amber-600"}`}>
          <span>{date.split(" ")[0]}</span>
          <span className="text-sm -mt-1">{date.split(" ")[1]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs lg:text-sm text-white truncate">{event.title}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{event.start_time || "TBD"}</div>
        </div>
        <ChevronRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
      </button>
    );
}

/* --- UPDATED DATE UTILS --- */

const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const SimpleMonthView: React.FC<{ events: Event[]; onDateClick: (date: Date, dateEvents: Event[]) => void; }> = ({ events, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const router = useRouter();

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const eventsMap = useMemo(() => {
    const map = new Map<string, { events: Event[]; hasRegistered: boolean }>();
    events.forEach((e) => {
      const d = parseDate(e.start_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const entry = map.get(key) || { events: [], hasRegistered: false };
      entry.events.push(e);
      if (e.is_registered) entry.hasRegistered = true;
      map.set(key, entry);
    });
    return map;
  }, [events]);

  const daysInMonth = useMemo(() => {
    const firstOfMonth = new Date(currentYear, currentMonth, 1);
    const days: any[] = [];
    const startDay = firstOfMonth.getDay(); 
    
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null });
    }

    const workingDate = new Date(firstOfMonth);
    while (workingDate.getMonth() === currentMonth) {
      const dayNum = workingDate.getDate();
      const key = `${workingDate.getFullYear()}-${String(workingDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const eventData = eventsMap.get(key);
      days.push({ 
        day: dayNum, 
        dateKey: key, 
        isToday: key === todayKey, 
        type: eventData ? (eventData.hasRegistered ? "registered" : "open") : "none" 
      });
      workingDate.setDate(workingDate.getDate() + 1);
    }
    return days;
  }, [currentMonth, currentYear, eventsMap]);


  return (
    <div className="p-2 lg:p-4 bg-slate-800/40 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentMonth - 1)))} className="text-white hover:bg-slate-700"><ChevronLeft/></Button>
        <h3 className="text-sm lg:text-lg font-bold text-white">{currentDate.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentMonth + 1)))} className="text-white hover:bg-slate-700"><ChevronRight/></Button>
      </div>

      <div className="grid grid-cols-7 gap-1 lg:gap-2 text-center text-[10px] lg:text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-indigo-400 font-bold py-2">{d}</div>
        ))}
        {daysInMonth.map((d, i) => (
          <button
            key={i}
            onClick={() => {
                if (!d.dateKey) return;
                const evs = eventsMap.get(d.dateKey)?.events || [];
                if (evs.length > 0) { setSelectedEvents(evs); setShowPicker(true); }
            }}
            disabled={!d.day}
            className={`min-h-[60px] lg:min-h-[80px] p-1 rounded-md border transition-all flex flex-col items-center
              ${!d.day ? "border-transparent opacity-0 cursor-default" : "border-slate-700 hover:bg-slate-700"}
              ${d.isToday ? "bg-indigo-600/20 border-indigo-500" : ""}
              ${d.type === "registered" ? "bg-emerald-900/20 text-emerald-400" : ""}
              ${d.type === "open" ? "bg-amber-900/20 text-amber-400" : ""}`}
          >
            <span className={`text-[10px] lg:text-sm ${d.isToday ? "font-bold text-white" : "text-slate-300"}`}>{d.day}</span>
            {d.type !== "none" && (
              <div className={`w-1.5 h-1.5 rounded-full mt-auto mb-1 ${d.type === "registered" ? "bg-emerald-400" : "bg-amber-400"}`} />
            )}
          </button>
        ))}
      </div>

      {/* --- LEGEND --- */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[10px] lg:text-xs text-slate-400 border-t border-white/5 pt-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
          <span>Registered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
          <span>Open/Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-indigo-600/30 border border-indigo-500" />
          <span>Today</span>
        </div>
      </div>

      {/* --- MODAL POPUP (FIXED ON SCREEN) --- */}
      {showPicker && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          {/* Backdrop Blur Layer */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowPicker(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Event Schedule</h3>
                  <p className="text-xs text-slate-400">Select an event to view details</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPicker(false)} 
                className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-full transition-all"
              >
                <X size={20}/>
              </button>
            </div>
            
            {/* Scrollable Event List within the Popup */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {selectedEvents.map((e) => (
                <button 
                  key={e.id} 
                  onClick={() => router.push(`/view_event?id=${e.id}`)} 
                  className="w-full text-left p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500 transition-all group flex items-center justify-between shadow-lg"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-3 rounded-xl shrink-0 ${e.is_registered ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {e.is_registered ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                        {e.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Clock size={12} /> {e.start_time || "TBD"}</span>
                        {e.is_registered && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] uppercase font-bold rounded">Registered</span>}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};