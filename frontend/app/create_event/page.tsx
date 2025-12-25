"use client";

import { useState, FormEvent } from "react";
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
    // APPLY DARK TEXTAREA STYLES
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
  Bell,
  Settings,
  HelpCircle,
  PieChart,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
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

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  if (!user) return null;

  // Check if user is admin
  const isAdmin = user.role === "admin";

  // Redirect non-admin users (APPLY DARK THEME STYLING)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-12 max-w-md text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/50 rounded-2xl mb-4 border border-red-700">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className ="text-2xl font-bold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-slate-400 mb-6">
            Only administrators can create events. You'll be redirected to the
            dashboard.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="w-full bg-indigo-600 hover:bg-indigo-700">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Validate all fields
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
      case "directorName":
        validation = validateName(value);
        break;
      case "matric":
        validation = validateMatricNumber(value);
        break;
      case "phone":
        validation = validatePhone(value);
        break;
      case "email":
        validation = validateEmail(value);
        break;
      case "title":
        validation = validateTitle(value);
        break;
      case "description":
        validation = validateDescription(value);
        break;
      case "cost":
        validation = validateCost(value);
        break;
      case "targetedParticipants":
        validation = validateTargetedParticipants(value);
        break;
      case "startDate":
        validation = validateDate(value, "Start date");
        break;
      case "endDate":
        validation = validateEndDate(formData.startDate, value);
        break;
      case "startTime":
        validation = validateTime(value, "Start time");
        break;
      case "endTime":
        validation = validateEndTime(formData.startDate, formData.endDate, formData.startTime, value);
        break;
      default:
        return;
    }

    if (!validation.isValid) {
      setErrors((prev) => ({ ...prev, [fieldName]: validation.error || "" }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all required fields as touched
    setTouched({
      directorName: true,
      matric: true,
      phone: true,
      email: true,
      title: true,
      startDate: true,
      endDate: true,
    });

    // Validate form
    if (!validateForm()) {
      setError("Please fix all errors before submitting");
      return;
    }

    setError("");
    setLoading(true);

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
      console.error("Create event error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.directorName.trim() !== "" &&
      formData.matric.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.title.trim() !== "" &&
      formData.startDate !== "" &&
      formData.endDate !== "" &&
      Object.keys(errors).length === 0
    );
  };

  return (
    // APPLY DARK BACKGROUND: bg-slate-900
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
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

  {/* menu (MATCHED EXACT SPACING FROM DASHBOARD) */}
  <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
    <SidebarButton
      open={sidebarOpen}
      icon={<PieChart size={20} />}
      label="Dashboard"
      onClick={() => router.push("/dashboard")}
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
      active
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
        onClick={logout}
        variant="destructive"
      />
    </div>
  </nav>
</aside>


      <div className="flex-1">
        {/* APPLY GLASSY HEADER: Semi-transparent dark background, white text */}
        <header className="flex items-center justify-between px-8 py-4 sticky top-0 bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/event")} className="p-2 rounded hover:bg-white/10 text-white" title="Back to events">
              <ArrowLeft size={20} className="text-white" />
            </button>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Create Event</h2>
              <p className="text-sm text-slate-300">Fill in event details and save</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center">
              <NotificationBell />
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>

            <button onClick={() => router.push("/profile")} className="rounded-full overflow-hidden border-2 border-transparent shadow hover:ring-2 hover:ring-indigo-500 transition-colors cursor-pointer" title="View Profile">
              <UserAvatar size="md" />
            </button>

            <button onClick={logout} className="p-2 rounded-lg hover:bg-white/10 text-white" title="Logout">
              <LogOut size={18} className="text-white" />
            </button>
          </div>
        </header>

        <main className="px-8 py-10 max-w-5xl mx-auto space-y-10">
          {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* DIRECTOR INFO */}
            <Card className="bg-slate-700 shadow border border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Director Information</CardTitle>
                <CardDescription className="text-slate-400">Event director details</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-sm font-medium text-slate-300">Full Name *</span>
                  <Input
                    placeholder="Enter director name"
                    value={formData.directorName}
                    onChange={(e) => {
                      setFormData({ ...formData, directorName: e.target.value });
                      if (touched.directorName) validateField("directorName", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, directorName: true }));
                      validateField("directorName", formData.directorName);
                    }}
                    required
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.directorName && errors.directorName ? "border-red-500" : ""}`}
                  />
                  {touched.directorName && errors.directorName && <p className="text-sm text-red-400 mt-1">{errors.directorName}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Matric Number *</span>
                  <Input
                    placeholder="Enter matric number (9 characters)"
                    value={formData.matric}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData({ ...formData, matric: value });
                      if (touched.matric) validateField("matric", value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, matric: true }));
                      validateField("matric", formData.matric);
                    }}
                    required
                    disabled={loading}
                    maxLength={9}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.matric && errors.matric ? "border-red-500" : ""}`}
                  />
                  {touched.matric && errors.matric && <p className="text-sm text-red-400 mt-1">{errors.matric}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Phone Number *</span>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (touched.phone) validateField("phone", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, phone: true }));
                      validateField("phone", formData.phone);
                    }}
                    required
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.phone && errors.phone ? "border-red-500" : ""}`}
                  />
                  {touched.phone && errors.phone && <p className="text-sm text-red-400 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Email Address *</span>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (touched.email) validateField("email", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, email: true }));
                      validateField("email", formData.email);
                    }}
                    required
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.email && errors.email ? "border-red-500" : ""}`}
                  />
                  {touched.email && errors.email && <p className="text-sm text-red-400 mt-1">{errors.email}</p>}
                </div>
              </CardContent>
            </Card>

            {/* EVENT INFO */}
            <Card className="bg-slate-700 shadow border border-slate-600 mt-10">
              <CardHeader>
                <CardTitle className="text-white">Event Information</CardTitle>
                <CardDescription className="text-slate-400">Event details & files</CardDescription>
              </CardHeader>

              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-slate-300">Event Title *</span>
                  <Input
                    placeholder="Enter event title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (touched.title) validateField("title", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, title: true }));
                      validateField("title", formData.title);
                    }}
                    required
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.title && errors.title ? "border-red-500" : ""}`}
                  />
                  {touched.title && errors.title && <p className="text-sm text-red-400 mt-1">{errors.title}</p>}
                </div>

                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-slate-300">Description</span>
                  <Textarea
                    placeholder="Enter event description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (touched.description) validateField("description", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, description: true }));
                      validateField("description", formData.description);
                    }}
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.description && errors.description ? "border-red-500" : ""}`}
                  />
                  {touched.description && errors.description && <p className="text-sm text-red-400 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Cost (RM)</span>
                  <Input
                    type="number"
                    placeholder="Enter cost"
                    value={formData.cost}
                    onChange={(e) => {
                      setFormData({ ...formData, cost: e.target.value });
                      if (touched.cost) validateField("cost", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, cost: true }));
                      validateField("cost", formData.cost);
                    }}
                    min="0"
                    step="0.01"
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.cost && errors.cost ? "border-red-500" : ""}`}
                  />
                  {touched.cost && errors.cost && <p className="text-sm text-red-400 mt-1">{errors.cost}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Targeted Participants</span>
                  <Input
                    placeholder="e.g. 100 students"
                    value={formData.targetedParticipants}
                    onChange={(e) => {
                      setFormData({ ...formData, targetedParticipants: e.target.value });
                      if (touched.targetedParticipants) validateField("targetedParticipants", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, targetedParticipants: true }));
                      validateField("targetedParticipants", formData.targetedParticipants);
                    }}
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 ${touched.targetedParticipants && errors.targetedParticipants ? "border-red-500" : ""}`}
                  />
                  {touched.targetedParticipants && errors.targetedParticipants && <p className="text-sm text-red-400 mt-1">{errors.targetedParticipants}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Upload Paperwork</span>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPaperworkFile(file);
                      if (file) {
                        const validation = validateFile(file, [".pdf", ".doc", ".docx"], 10);
                        if (!validation.isValid) {
                          setErrors((prev) => ({ ...prev, paperworkFile: validation.error || "" }));
                        } else {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.paperworkFile;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    disabled={loading}
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                  />
                  {errors.paperworkFile && <p className="text-sm text-red-400 mt-1">{errors.paperworkFile}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Upload Poster</span>
                  <Input
                    type="file"
                    accept="image/*,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPosterFile(file);
                      if (file) {
                        const validation = validateFile(file, ["image/*", ".webp", "webp"], 10);
                        if (!validation.isValid) {
                          setErrors((prev) => ({ ...prev, posterFile: validation.error || "" }));
                        } else {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.posterFile;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    disabled={loading}
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-500"
                  />
                  {errors.posterFile && <p className="text-sm text-red-400 mt-1">{errors.posterFile}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Date From *</span>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validate year is 4 digits
                      if (value) {
                        const year = new Date(value).getFullYear();
                        if (year.toString().length !== 4) {
                          return; // Don't update if year is not 4 digits
                        }
                      }
                      setFormData({ ...formData, startDate: value });
                      if (touched.startDate) validateField("startDate", value);
                      // Re-validate end date if it's been touched
                      if (touched.endDate && formData.endDate) {
                        validateField("endDate", formData.endDate);
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, startDate: true }));
                      validateField("startDate", formData.startDate);
                    }}
                    required
                    disabled={loading}
                    min="1000-01-01"
                    max="9999-12-31"
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 input-white-icon ${touched.startDate && errors.startDate ? "border-red-500" : ""}`}
                  />
                  {touched.startDate && errors.startDate && <p className="text-sm text-red-400 mt-1">{errors.startDate}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">Date Until *</span>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Validate year is 4 digits
                      if (value) {
                        const year = new Date(value).getFullYear();
                        if (year.toString().length !== 4) {
                          return; // Don't update if year is not 4 digits
                        }
                      }
                      setFormData({ ...formData, endDate: value });
                      if (touched.endDate) validateField("endDate", value);
                      // Re-validate end time if it's been touched
                      if (touched.endTime && formData.endTime) {
                        validateField("endTime", formData.endTime);
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, endDate: true }));
                      validateField("endDate", formData.endDate);
                    }}
                    required
                    disabled={loading}
                    min={formData.startDate || "1000-01-01"}
                    max="9999-12-31"
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 input-white-icon ${touched.endDate && errors.endDate ? "border-red-500" : ""}`}
                  />
                  {touched.endDate && errors.endDate && <p className="text-sm text-red-400 mt-1">{errors.endDate}</p>}
                </div>

                {/* TIME FIELDS */}
                <div>
                  <span className="text-sm font-medium text-slate-300">Start Time</span>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      setFormData({ ...formData, startTime: e.target.value });
                      if (touched.startTime) validateField("startTime", e.target.value);
                      // Re-validate end time if it's been touched
                      if (touched.endTime && formData.endTime) {
                        validateField("endTime", formData.endTime);
                      }
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, startTime: true }));
                      validateField("startTime", formData.startTime);
                    }}
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 input-white-icon ${touched.startTime && errors.startTime ? "border-red-500" : ""}`}
                  />
                  {touched.startTime && errors.startTime && <p className="text-sm text-red-400 mt-1">{errors.startTime}</p>}
                </div>

                <div>
                  <span className="text-sm font-medium text-slate-300">End Time</span>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => {
                      setFormData({ ...formData, endTime: e.target.value });
                      if (touched.endTime) validateField("endTime", e.target.value);
                    }}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, endTime: true }));
                      validateField("endTime", formData.endTime);
                    }}
                    disabled={loading}
                    className={`bg-slate-800 border-slate-600 text-white placeholder-slate-500 input-white-icon ${touched.endTime && errors.endTime ? "border-red-500" : ""}`}
                  />
                  {touched.endTime && errors.endTime && <p className="text-sm text-red-400 mt-1">{errors.endTime}</p>}
                </div>
              </CardContent>
            </Card>

            {/* SAVE BUTTON */}
            <div className="flex justify-end mt-10">
              <Button type="submit" className="bg-indigo-600 text-white px-6 py-2 hover:bg-indigo-700" disabled={loading || !isFormValid()}>
                {loading ? "Saving..." : "Save Event"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}


type SidebarButtonVariant = "default" | "destructive";

interface SidebarButtonProps {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  active?: boolean;               // optional now
  onClick?: () => void;
  variant?: SidebarButtonVariant; // optional now
}

function SidebarButton({
  icon,
  label,
  open,
  active = false,
  onClick,
  variant = "default",
}: SidebarButtonProps) {
  const baseClasses =
    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors duration-200 font-medium";

  const activeClasses = active
    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg"
    : variant === "destructive"
    ? "text-rose-300 hover:bg-rose-900/30"
    : "text-slate-300 hover:bg-gray-800 hover:text-white";

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      <div className={`w-6 h-6 flex items-center justify-center transition-transform ${active ? 'scale-100' : 'scale-90'}`}>{icon}</div>
      {open && <span className="truncate">{label}</span>}
      {open && active && <ChevronRight size={16} className="ml-auto text-white/70" />}
    </button>
  );
}
