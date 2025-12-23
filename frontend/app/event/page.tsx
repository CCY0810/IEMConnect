"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getEvents, Event } from "@/lib/event-api";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import { getFileUrl } from "@/lib/event-api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import {
  Menu,
  LogOut,
  Calendar,
  CheckSquare,
  Settings,
  HelpCircle,
  PieChart as PieChartIcon, 
  AlertTriangle,
  Plus,
  Search,
  Eye,
  UserCheck,
  X,
  ChevronRight,
  FileText,
  ChevronLeft,
} from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  // Responsive Sidebar States - Matched to your successful AdminPanel implementation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  // Original Page States
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Handle Responsive Sidebar behavior
  useEffect(() => {
    if (!token) router.push("/login");

    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true);
      else setSidebarOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [token, router]);

  // fetch events (original backend logic intact)
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getEvents({ search });
        setEvents(data);
        setError("");
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch events");
        console.error("Fetch events error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchEvents();
  }, [search, user]);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  const isAdmin = user?.role === "admin";

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
                <div className="text-xs text-slate-400 font-medium">
                  {isAdmin ? "Admin Portal" : "Member Dashboard"}
                </div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
              <X size={28}/>
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarButton open={sidebarOpen} icon={<PieChartIcon size={20} />} label="Dashboard" onClick={() => router.push("/dashboard")} />
          {isAdmin && <SidebarButton open={sidebarOpen} icon={<UserCheck size={20} />} label="Admin Panel" onClick={() => router.push("/admin/admin_panel")} />}
          {isAdmin && <SidebarButton open={sidebarOpen} icon={<FileText size={20} />} label="Reports" onClick={() => router.push("/admin/reports")} />}
          <SidebarButton open={sidebarOpen} icon={<Calendar size={20} />} label="Events" onClick={() => router.push("/event")} active />
          <SidebarButton open={sidebarOpen} icon={<CheckSquare size={20} />} label="Attendance" onClick={() => router.push("/attendance")} />
          <SidebarButton open={sidebarOpen} icon={<Settings size={20} />} label="Settings" onClick={() => router.push("/settings")} />
          <div className="mt-6 border-t border-white/10 pt-4">
            <SidebarButton open={sidebarOpen} icon={<LogOut size={20} />} label="Logout" onClick={() => setIsLogoutModalOpen(true)} variant="destructive" />
          </div>
        </nav>
      </aside>

      {/* 4. MAIN LAYOUT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* HEADER */}
        <header className="flex items-center justify-between px-4 lg:px-8 py-3 sticky top-0 z-40 bg-slate-900/60 backdrop-blur-md border-b border-white/10 shadow-xl shrink-0 h-[73px]">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 text-slate-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <Menu size={24}/>
            </button>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-white truncate">Events</h2>
              <p className="hidden xs:block text-[10px] sm:text-xs text-slate-400 truncate">Manage IEM Connect events</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-5 ml-4">
            <NotificationBell />
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">{user.role}</div>
              </div>
              <button onClick={() => router.push("/profile")} className="shrink-0"><UserAvatar size="sm" /></button>
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

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* HERO SECTION */}
          <section
            className="relative text-white px-4 sm:px-10 py-16"
            style={{
              backgroundImage: "url('/eventbg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/70" />
            <div className="relative max-w-7xl mx-auto flex flex-col items-start gap-6">
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">Professional IEM Events</h1>
              <p className="text-base sm:text-lg text-white/90 max-w-2xl">Browse upcoming events, register, or manage sessions.</p>
              <div className="flex flex-wrap gap-3">
                {isAdmin && (
                  <Button onClick={() => router.push("/create_event")} className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                    <Plus size={16} className="mr-2"/> Create Event
                  </Button>
                )}
                <Button variant="outline" onClick={() => document.getElementById('event-grid')?.scrollIntoView({ behavior: 'smooth' })} className="backdrop-blur-sm bg-white/10 text-white border-white/30 hover:bg-white/20">
                  <Search size={16} className="mr-2"/> Browse Events
                </Button>
              </div>
            </div>
          </section>

          {/* EVENTS CONTENT */}
          <div className="px-4 sm:px-8 py-10 max-w-7xl mx-auto space-y-10">
            {/* Search + Filter */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex-1 w-full max-w-xl">
                <div className="relative">
                  <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                  <Input
                    placeholder="Search event by title or director..."
                    className="pl-12 py-6 rounded-xl shadow-lg bg-slate-800 text-white border-slate-700 placeholder-slate-400 focus:border-indigo-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {search && (
                <Button variant="ghost" className="text-slate-300 hover:bg-slate-800" onClick={() => setSearch("")}>Clear Search</Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-400">
                <AlertTriangle size={18}/>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Grid */}
            <section id="event-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-slate-800 rounded-2xl h-80 border border-slate-700" />
                ))
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700">
                  <p className="text-slate-400">No events found matching your search.</p>
                </div>
              ) : (
                events.map((event) => (
                  <article
                    key={event.id}
                    className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="w-full h-48 bg-slate-900 relative group">
                      <PosterImage
                        poster={event.poster_url}
                        onClick={() => event.poster_url && setModalImage(event.poster_url)}
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className={`${
                          event.status === "Upcoming" ? "bg-blue-600" : 
                          event.status === "Open" ? "bg-emerald-600" : "bg-slate-600"
                        } text-white`}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2 text-white line-clamp-1">{event.title}</h3>
                      <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                         <span className="font-semibold text-slate-300">Director:</span> {event.director_name || "—"}
                      </p>
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mb-5">
                         <div className="flex flex-col text-xs text-slate-400">
                            <span className="uppercase tracking-wider opacity-50">Date</span>
                            <span className="text-slate-200 font-medium">
                              {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
                            </span>
                         </div>
                      </div>
                      <div className="flex gap-3">
                        <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push(`/view_event?id=${event.id}`)}>
                          <Eye size={16} className="mr-2" /> View
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="outline" className="flex-1 border-slate-600 hover:bg-slate-700 text-slate-600" onClick={() => router.push(`/view_event?id=${event.id}`)}>
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </article>
                ))
              )}
            </section>
          </div>
        </main>
      </div>

      {/* image modal */}
      {modalImage && (
        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}

// Sidebar Button Helper
function SidebarButton({ icon, label, open, active = false, onClick, variant = "default" }: any) {
  const isDestructive = variant === "destructive";
  if (!open) return (
     <button onClick={onClick} className={`w-full flex items-center justify-center py-4 transition-all ${active ? "text-indigo-400" : "text-slate-400"}`}>
        <div className="w-6 h-6">{icon}</div>
     </button>
  );

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-200 font-medium whitespace-nowrap
      ${active ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg" : 
        isDestructive ? "text-rose-300 hover:bg-rose-900/30" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
    >
      <div className="w-6 h-6 flex items-center justify-center shrink-0">{icon}</div>
      <span className="truncate">{label}</span>
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}

// Original Poster Component
function PosterImage({ poster, onClick }: { poster?: string | null; onClick?: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!poster) {
      setImageUrl(null);
      setImageError(false);
      setLoading(false);
      return;
    }

    let url = "";
    if (poster.startsWith("http")) {
      url = poster;
    } else if (poster.startsWith("/api/v1")) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");
      url = `${baseUrl}${poster}`;
    } else {
      url = getFileUrl(poster);
    }

    const token = localStorage.getItem("token");
    if (token) {
      setLoading(true);
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load`);
          return response.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          setImageUrl(objectUrl);
          setImageError(false);
        })
        .catch(() => {
          setImageError(true);
        })
        .finally(() => setLoading(false));
    } else {
      setImageUrl(url);
      setLoading(false);
    }

    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [poster]);

  if (!poster) return <div className="w-full h-48 bg-slate-800 flex items-center justify-center text-xs text-slate-600">No poster available</div>;
  if (loading) return <div className="w-full h-48 bg-slate-800 flex items-center justify-center text-xs text-slate-600 animate-pulse">Loading...</div>;
  if (imageError || !imageUrl) return <div className="w-full h-48 bg-slate-800 flex items-center justify-center text-xs text-slate-600 font-medium">Error loading image</div>;

  return <img src={imageUrl} alt="Poster" className="w-full h-full object-cover cursor-pointer" onClick={onClick} />;
}

// Original Modal Component
function ImageModal({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let url = imageUrl.startsWith("http") ? imageUrl : imageUrl.startsWith("/api/v1") 
      ? `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace("/api/v1", "")}${imageUrl}`
      : getFileUrl(imageUrl);

    const token = localStorage.getItem("token");
    if (token) {
      fetch(url, { headers: { Authorization: `Bearer ${token}` }})
        .then(res => res.blob())
        .then(blob => setModalImageUrl(URL.createObjectURL(blob)))
        .finally(() => setLoading(false));
    } else {
      setModalImageUrl(url);
      setLoading(false);
    }
  }, [imageUrl]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <button className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><X size={24}/></button>
      <div className="relative max-w-4xl max-h-screen" onClick={e => e.stopPropagation()}>
        {loading ? <p className="text-white">Loading...</p> : <img src={modalImageUrl!} className="rounded shadow-2xl max-h-[90vh]"/>}
      </div>
    </div>
  );
}