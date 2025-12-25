"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createEvent } from "@/lib/event-api";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import {
  validateName,
  validateEmail,
  validateMatricNumber,
  validatePhone,
  validateTitle,
  validateDescription,
  validateCost,
  validateTargetedParticipants,
  validateDate,
  validateEndDate,
  validateTime,
  validateEndTime,
  validateFile,
} from "@/lib/validation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Textarea = (props: any) => (
  <textarea
    {...props}
    className={`w-full min-h-[120px] rounded-md border border-slate-600 bg-slate-800 text-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className}`}
  />
);

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import {
  Menu,
  LogOut,
  FileText,
  Calendar,
  CheckSquare,
  Settings,
  HelpCircle,
  AlertTriangle,
  PieChart as PieChartIcon,
  UserCheck,
  ArrowLeft,
  ChevronRight,
  X,
} from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  // Responsive Sidebar States - Matched to your successful implementation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  // Original Page States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    directorName: "",
    matric: "",
    phone: "",
    email: "",
    title: "",
    description: "",
    cost: "",
    targetedParticipants: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [paperworkFile, setPaperworkFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  const isAdmin = user?.role === "admin";

  if (!user) return null;

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-12 max-w-md text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/50 rounded-2xl mb-4 border border-red-700">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">Only administrators can create events.</p>
          <Button onClick={() => router.push("/dashboard")} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Original Validation Logic Intact
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameValidation = validateName(formData.directorName);
    if (!nameValidation.isValid) newErrors.directorName = nameValidation.error || "";
    const matricValidation = validateMatricNumber(formData.matric);
    if (!matricValidation.isValid) newErrors.matric = matricValidation.error || "";
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.isValid) newErrors.phone = phoneValidation.error || "";
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) newErrors.email = emailValidation.error || "";
    const titleValidation = validateTitle(formData.title);
    if (!titleValidation.isValid) newErrors.title = titleValidation.error || "";
    const descriptionValidation = validateDescription(formData.description);
    if (!descriptionValidation.isValid) newErrors.description = descriptionValidation.error || "";
    const costValidation = validateCost(formData.cost);
    if (!costValidation.isValid) newErrors.cost = costValidation.error || "";
    const targetedValidation = validateTargetedParticipants(formData.targetedParticipants);
    if (!targetedValidation.isValid) newErrors.targetedParticipants = targetedValidation.error || "";
    const startDateValidation = validateDate(formData.startDate, "Start date");
    if (!startDateValidation.isValid) newErrors.startDate = startDateValidation.error || "";
    const endDateValidation = validateEndDate(formData.startDate, formData.endDate);
    if (!endDateValidation.isValid) newErrors.endDate = endDateValidation.error || "";
    const startTimeValidation = validateTime(formData.startTime, "Start time");
    if (!startTimeValidation.isValid) newErrors.startTime = startTimeValidation.error || "";
    const endTimeValidation = validateEndTime(formData.startDate, formData.endDate, formData.startTime, formData.endTime);
    if (!endTimeValidation.isValid) newErrors.endTime = endTimeValidation.error || "";
    if (posterFile) {
      const posterValidation = validateFile(posterFile, ["image/*", ".webp", "webp"], 10);
      if (!posterValidation.isValid) newErrors.posterFile = posterValidation.error || "";
    }
    if (paperworkFile) {
      const paperworkValidation = validateFile(paperworkFile, [".pdf", ".doc", ".docx"], 10);
      if (!paperworkValidation.isValid) newErrors.paperworkFile = paperworkValidation.error || "";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (fieldName: string, value: string) => {
    let validation: any;
    switch (fieldName) {
      case "directorName": validation = validateName(value); break;
      case "matric": validation = validateMatricNumber(value); break;
      case "phone": validation = validatePhone(value); break;
      case "email": validation = validateEmail(value); break;
      case "title": validation = validateTitle(value); break;
      case "description": validation = validateDescription(value); break;
      case "cost": validation = validateCost(value); break;
      case "targetedParticipants": validation = validateTargetedParticipants(value); break;
      case "startDate": validation = validateDate(value, "Start date"); break;
      case "endDate": validation = validateEndDate(formData.startDate, value); break;
      case "startTime": validation = validateTime(value, "Start time"); break;
      case "endTime": validation = validateEndTime(formData.startDate, formData.endDate, formData.startTime, value); break;
      default: return;
    }
    if (!validation.isValid) setErrors((prev) => ({ ...prev, [fieldName]: validation.error || "" }));
    else setErrors((prev) => { const newErrors = { ...prev }; delete newErrors[fieldName]; return newErrors; });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ directorName: true, matric: true, phone: true, email: true, title: true, startDate: true, endDate: true });
    if (!validateForm()) { setError("Please fix all errors before submitting"); return; }
    setError(""); setLoading(true);
    try {
      await createEvent({
        director_name: formData.directorName.trim(),
        director_matric: formData.matric.trim(),
        director_phone: formData.phone.trim(),
        director_email: formData.email.trim().toLowerCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        targeted_participants: formData.targetedParticipants.trim(),
        start_date: formData.startDate,
        end_date: formData.endDate,
        start_time: formData.startTime || undefined,
        end_time: formData.endTime || undefined,
        poster_file: posterFile || undefined,
        paperwork_file: paperworkFile || undefined,
      });
      alert("Event created successfully!");
      router.push("/event");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.directorName.trim() !== "" && formData.matric.trim() !== "" && formData.phone.trim() !== "" && formData.email.trim() !== "" && formData.title.trim() !== "" && formData.startDate !== "" && formData.endDate !== "" && Object.keys(errors).length === 0;
  };

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
                <div className="text-xs text-slate-400 font-medium">Admin Portal</div>
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
          <SidebarButton open={sidebarOpen} icon={<UserCheck size={20} />} label="Admin Panel" onClick={() => router.push("/admin/admin_panel")} />
          <SidebarButton open={sidebarOpen} icon={<FileText size={20} />} label="Reports" onClick={() => router.push("/admin/reports")} />
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
              <h2 className="text-lg lg:text-2xl font-bold tracking-tight text-white truncate">Create Event</h2>
              <p className="hidden xs:block text-[10px] sm:text-xs text-slate-400 truncate">Fill in event details and save</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-5 ml-4">
            <NotificationBell />
            <div className="flex items-center gap-3 border-l border-white/10 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white leading-none truncate max-w-[120px]">{user.name}</div>
                <div className="text-[10px] text-slate-400 uppercase mt-1">{user.role}</div>
              </div>
              <UserAvatar size="sm" />
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

        {/* SCROLLABLE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-slate-900">
          <div className="max-w-5xl mx-auto w-full space-y-10">
            <Button onClick={() => router.push("/event")} variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft size={16} className="mr-2"/> Back to Events
            </Button>

            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* DIRECTOR INFO */}
              <Card className="bg-slate-800 shadow-xl border border-slate-700 rounded-xl overflow-hidden">
                <CardHeader className="border-b border-slate-700/50">
                  <CardTitle className="text-white">Director Information</CardTitle>
                  <CardDescription className="text-slate-400">Primary contact details</CardDescription>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                    <Input 
                      placeholder="Name" 
                      value={formData.directorName} 
                      onChange={(e) => {setFormData({ ...formData, directorName: e.target.value }); if (touched.directorName) validateField("directorName", e.target.value);}}
                      onBlur={() => {setTouched((prev) => ({ ...prev, directorName: true })); validateField("directorName", formData.directorName);}}
                      className={`bg-slate-900 border-slate-700 text-white ${touched.directorName && errors.directorName ? "border-red-500" : ""}`}
                    />
                    {touched.directorName && errors.directorName && <p className="text-[10px] text-red-400 font-medium">{errors.directorName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matric Number *</label>
                    <Input 
                      placeholder="9 characters" 
                      value={formData.matric} 
                      onChange={(e) => {const v = e.target.value.toUpperCase(); setFormData({ ...formData, matric: v }); if (touched.matric) validateField("matric", v);}}
                      onBlur={() => {setTouched((prev) => ({ ...prev, matric: true })); validateField("matric", formData.matric);}}
                      className={`bg-slate-900 border-slate-700 text-white ${touched.matric && errors.matric ? "border-red-500" : ""}`}
                      maxLength={9}
                    />
                    {touched.matric && errors.matric && <p className="text-[10px] text-red-400 font-medium">{errors.matric}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone *</label>
                    <Input 
                      placeholder="Phone" 
                      value={formData.phone} 
                      onChange={(e) => {setFormData({ ...formData, phone: e.target.value }); if (touched.phone) validateField("phone", e.target.value);}}
                      onBlur={() => {setTouched((prev) => ({ ...prev, phone: true })); validateField("phone", formData.phone);}}
                      className={`bg-slate-900 border-slate-700 text-white ${touched.phone && errors.phone ? "border-red-500" : ""}`}
                    />
                    {touched.phone && errors.phone && <p className="text-[10px] text-red-400 font-medium">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email *</label>
                    <Input 
                      type="email" 
                      placeholder="Email" 
                      value={formData.email} 
                      onChange={(e) => {setFormData({ ...formData, email: e.target.value }); if (touched.email) validateField("email", e.target.value);}}
                      onBlur={() => {setTouched((prev) => ({ ...prev, email: true })); validateField("email", formData.email);}}
                      className={`bg-slate-900 border-slate-700 text-white ${touched.email && errors.email ? "border-red-500" : ""}`}
                    />
                    {touched.email && errors.email && <p className="text-[10px] text-red-400 font-medium">{errors.email}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* EVENT INFO */}
              <Card className="bg-slate-800 shadow-xl border border-slate-700 rounded-xl overflow-hidden">
                <CardHeader className="border-b border-slate-700/50">
                  <CardTitle className="text-white">Event Information</CardTitle>
                  <CardDescription className="text-slate-400">Detailed event metrics</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event Title *</label>
                    <Input 
                      placeholder="Event Title" 
                      value={formData.title} 
                      onChange={(e) => {setFormData({ ...formData, title: e.target.value }); if (touched.title) validateField("title", e.target.value);}}
                      onBlur={() => {setTouched((prev) => ({ ...prev, title: true })); validateField("title", formData.title);}}
                      className={`bg-slate-900 border-slate-700 text-white ${touched.title && errors.title ? "border-red-500" : ""}`}
                    />
                    {touched.title && errors.title && <p className="text-[10px] text-red-400 font-medium">{errors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                    <Textarea 
                      placeholder="Tell us about the event..." 
                      value={formData.description} 
                      onChange={(e) => {setFormData({ ...formData, description: e.target.value }); if (touched.description) validateField("description", e.target.value);}}
                      onBlur={() => {setTouched((prev) => ({ ...prev, description: true })); validateField("description", formData.description);}}
                    />
                    {touched.description && errors.description && <p className="text-[10px] text-red-400 font-medium">{errors.description}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cost (RM)</label>
                      <Input type="number" step="0.01" value={formData.cost} onChange={(e) => {setFormData({ ...formData, cost: e.target.value }); if (touched.cost) validateField("cost", e.target.value);}} className="bg-slate-900 border-slate-700 text-white"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Targeted Participants</label>
                      <Input placeholder="e.g. 50" value={formData.targetedParticipants} onChange={(e) => {setFormData({ ...formData, targetedParticipants: e.target.value }); if (touched.targetedParticipants) validateField("targetedParticipants", e.target.value);}} className="bg-slate-900 border-slate-700 text-white"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Poster Image</label>
                      <Input type="file" accept="image/*" onChange={(e) => setPosterFile(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paperwork (PDF/DOC)</label>
                      <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setPaperworkFile(e.target.files?.[0] || null)} className="bg-slate-900 border-slate-700 text-slate-300"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date *</label>
                      <Input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="bg-slate-900 border-slate-700 text-white input-white-icon"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date *</label>
                      <Input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="bg-slate-900 border-slate-700 text-white input-white-icon"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
                      <Input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="bg-slate-900 border-slate-700 text-white input-white-icon"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Time</label>
                      <Input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="bg-slate-900 border-slate-700 text-white input-white-icon"/>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-xl font-bold transition-all shadow-lg" disabled={loading || !isFormValid()}>
                  {loading ? "Creating..." : "Launch Event"}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .input-white-icon::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function SidebarButton({ icon, label, open, active, onClick, variant }: any) {
  const isDestructive = variant === 'destructive';
  if (!open) return (
     <button onClick={onClick} className={`w-full flex items-center justify-center py-4 transition-all ${active ? "text-indigo-400" : "text-slate-400"}`}>
        <div className="w-6 h-6 shrink-0">{icon}</div>
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
      {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
    </button>
  );
}