"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import Image from "next/image";
import { 
  Building2, 
  Users, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  CheckCircle2, 
  Play, 
  Square,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Upload
} from "lucide-react";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Resume Setup and Parsing States
  const [showResumeSetup, setShowResumeSetup] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [parsingResume, setParsingResume] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<{
    bio: string;
    skills: string[];
    importantPoints: string[];
  } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [attachedFileData, setAttachedFileData] = useState("");
  const [attachedFileMime, setAttachedFileMime] = useState("");

  // Check-In window states for HR settings
  const [checkInStart, setCheckInStart] = useState("09:00");
  const [checkInEnd, setCheckInEnd] = useState("11:00");
  const [savingTimeline, setSavingTimeline] = useState(false);

  // Timer state for active check-in session duration
  const [sessionTime, setSessionTime] = useState("");

  const fetchData = async () => {
    try {
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const pData = await profileRes.json();
        setUserData(pData);

        if (pData.role === "hr") {
          const empRes = await fetch("/api/employees");
          if (empRes.ok) {
            const eData = await empRes.json();
            setEmployees(eData);
          }
          if (pData.organizationId) {
            setCheckInStart(pData.organizationId.checkInStart || "09:00");
            setCheckInEnd(pData.organizationId.checkInEnd || "11:00");
          }
        } else {
          // Employee - fetch attendance logs
          fetchAttendance();
          
          // Open AI Setup prompt if they do not have a Bio set up
          if (!pData.bio) {
            setShowResumeSetup(true);
          }
        }
      }
    } catch (error) {
      console.error("Dashboard data fetching failed", error);
    } finally {
      setFetchingData(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.records || []);
        setTodayRecord(data.today || null);
      }
    } catch (error) {
      console.error("Failed to load attendance logs", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated" && session?.user) {
      fetchData();
    }
  }, [status, session]);

  // Live Check-in Session Timer
  useEffect(() => {
    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkOut) {
      setSessionTime("");
      return;
    }

    const interval = setInterval(() => {
      const checkInTime = new Date(todayRecord.checkIn).getTime();
      const diffMs = Date.now() - checkInTime;
      
      const secs = Math.floor((diffMs / 1000) % 60);
      const mins = Math.floor((diffMs / (1000 * 60)) % 60);
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));

      const formatted = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      setSessionTime(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  const handleAttendanceAction = async (action: "checkin" | "checkout") => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Attendance updated!");
        fetchAttendance();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (error) {
      toast.error("Failed to post attendance");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTimeline(true);
    try {
      const res = await fetch("/api/organization/update-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInStart, checkInEnd })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Timeline updated successfully!");
        fetchData(); // Reload organization details
      } else {
        toast.error(data.message || "Failed to update timeline");
      }
    } catch (error) {
      toast.error("Failed to update timeline");
    } finally {
      setSavingTimeline(false);
    }
  };

  const handleAnalyzeResume = async (textToParse: string) => {
    if (!textToParse.trim() && !attachedFileData) {
      toast.error("Please paste your resume text or upload a file first");
      return;
    }
    setParsingResume(true);
    setParsedResumeData(null);
    try {
      const payload: any = {};
      if (attachedFileData && attachedFileMime) {
        payload.fileData = attachedFileData;
        payload.mimeType = attachedFileMime;
      } else {
        payload.text = textToParse;
      }

      const res = await fetch("/api/profile/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setParsedResumeData({
          bio: data.bio || "",
          skills: data.skills || [],
          importantPoints: data.importantPoints || []
        });
        toast.success("Resume parsed successfully!");
      } else {
        toast.error(data.message || "Failed to parse resume");
      }
    } catch (error) {
      toast.error("Failed to analyze resume");
    } finally {
      setParsingResume(false);
    }
  };

  const handleAddToProfile = async () => {
    if (!parsedResumeData) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: parsedResumeData.bio,
          skills: parsedResumeData.skills,
          importantPoints: parsedResumeData.importantPoints
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profile highlights added successfully!");
        setShowResumeSetup(false);
        setParsedResumeData(null);
        setResumeText("");
        setAttachedFileData("");
        setAttachedFileMime("");
        fetchData(); // Reload profile details
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSavingProfile(false);
    }
  };

  if (status === "loading" || fetchingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BackgroundPattern />
        <p className="text-slate-900 font-medium animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  if (!session?.user || !userData) return null;

  const isHR = userData.role === "hr";
  const organization = userData.organizationId;

  // Monthly statistics calculations
  const totalPresentDays = attendanceRecords.filter(r => r.status === "present").length;
  const totalHours = attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
  const avgHours = totalPresentDays > 0 ? (totalHours / totalPresentDays).toFixed(1) : "0";

  // Check if check-in is currently open (client-side validator)
  const orgStart = organization?.checkInStart || "09:00";
  const orgEnd = organization?.checkInEnd || "11:00";

  const getPortalStatus = () => {
    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTotal = currentH * 60 + currentM;

    const [startH, startM] = orgStart.split(":").map(Number);
    const [endH, endM] = orgEnd.split(":").map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    return currentTotal >= startTotal && currentTotal <= endTotal;
  };

  const isPortalOpen = getPortalStatus();

  // Render Resume Analyzer Portal Overlay
  if (showResumeSetup && !isHR) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 py-12">
        <BackgroundPattern />
        <Card className="w-full max-w-2xl border-2 border-slate-900 shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-sky-900 border-b-2 border-slate-900 text-white p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <span>AI Resume Setup Portal</span>
            </CardTitle>
            <p className="text-xs text-sky-100 font-medium mt-1 leading-relaxed">
              Upload your resume in PDF format to automatically extract your bio, core competencies, and career achievements.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-950">Upload Resume File (PDF only)</Label>
                <div className="border-2 border-dashed border-slate-900 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-all text-center">
                  <label htmlFor="resumeFileUploader" className="cursor-pointer space-y-1.5 block">
                    <div className="h-8 w-8 rounded-full bg-sky-100 border border-slate-900 text-sky-900 flex items-center justify-center mx-auto">
                      <Upload className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 block">Choose resume PDF...</span>
                  </label>
                  <input
                    id="resumeFileUploader"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
                        toast.error("Please upload a PDF file only");
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setAttachedFileData(event.target?.result as string || "");
                        setAttachedFileMime("application/pdf");
                        setResumeText(`[Attached File: ${file.name}]`);
                        toast.success("PDF resume attached successfully!");
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>

              {resumeText && (
                <div className="bg-sky-50 border-2 border-sky-300 rounded-lg p-3 text-xs text-sky-900 font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-sky-900 shrink-0" />
                  <span className="truncate">Selected file: {resumeText.replace("[Attached File: ", "").replace("]", "")}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleAnalyzeResume(resumeText)}
                  disabled={parsingResume || !attachedFileData}
                  className="w-full rounded-lg px-4 py-2.5 font-bold bg-sky-900 text-white hover:bg-sky-850 border-2 border-slate-900 hover:shadow transition-all text-xs disabled:opacity-75 disabled:cursor-not-allowed active:scale-95"
                >
                  {parsingResume ? "Analyzing Resume..." : "Extract Profile Info with Gemini AI"}
                </button>
              </div>
            </div>

            {/* Parsing Result Display */}
            {parsedResumeData && (
              <div className="border-t-2 border-slate-900 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>AI Extracted Profile Preview</span>
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="extractedBio" className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Extracted Bio</Label>
                    <textarea
                      id="extractedBio"
                      rows={3}
                      className="w-full border-2 border-slate-900 rounded-lg bg-white p-2 text-xs font-semibold text-slate-900 focus:border-sky-900 leading-relaxed"
                      value={parsedResumeData.bio}
                      onChange={(e) => setParsedResumeData(prev => prev ? ({ ...prev, bio: e.target.value }) : null)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="extractedSkills" className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Extracted Skills (Comma Separated)</Label>
                    <input
                      id="extractedSkills"
                      type="text"
                      className="w-full border-2 border-slate-900 rounded-lg bg-white p-2 text-xs font-semibold text-slate-900 focus:border-sky-900"
                      value={parsedResumeData.skills.join(", ")}
                      onChange={(e) => {
                        const skillsArr = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                        setParsedResumeData(prev => prev ? ({ ...prev, skills: skillsArr }) : null);
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="extractedPoints" className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Extracted Highlights (One Per Line)</Label>
                    <textarea
                      id="extractedPoints"
                      rows={4}
                      className="w-full border-2 border-slate-900 rounded-lg bg-white p-2 text-xs font-semibold text-slate-900 focus:border-sky-900 leading-relaxed"
                      value={parsedResumeData.importantPoints.join("\n")}
                      onChange={(e) => {
                        const pointsArr = e.target.value.split("\n").map(p => p.trim()).filter(Boolean);
                        setParsedResumeData(prev => prev ? ({ ...prev, importantPoints: pointsArr }) : null);
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddToProfile}
                  disabled={savingProfile}
                  className="w-full rounded-lg px-4 py-3 font-bold bg-emerald-600 text-white hover:bg-emerald-700 border-2 border-slate-900 hover:shadow transition-all text-xs active:scale-95"
                >
                  {savingProfile ? "Saving changes..." : "Add to Profile & Save to Database"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-12 px-4 md:px-8 pb-32">
      <BackgroundPattern />
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Welcome Header */}
        <div className="bg-white/90 border-2 border-slate-900 p-6 rounded-xl flex flex-col sm:flex-row items-center gap-4 shadow-md justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-full border-2 border-slate-900 overflow-hidden shadow bg-slate-100">
              <Image
                src={userData.avatar || `https://robohash.org/${userData.email}`}
                alt="Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                Welcome back, {userData.name}!
              </h2>
              <p className="text-xs text-slate-500 font-bold capitalize">Role: {userData.role === "hr" ? "HR Officer" : "Employee Workspace"}</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Date</span>
            <p className="text-sm font-extrabold text-sky-900">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* HR Dashboard Panel */}
        {isHR && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Quick Stats */}
            <Card className="border-2 border-slate-900 bg-white/95 shadow rounded-xl p-5 space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Workspace Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-lg text-center">
                  <Users className="h-8 w-8 text-sky-900 mx-auto mb-2" />
                  <h4 className="text-2xl font-black text-slate-900">{employees.length}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Employees</p>
                </div>
                <div className="p-4 bg-slate-50 border-2 border-slate-900 rounded-lg text-center">
                  <Building2 className="h-8 w-8 text-sky-900 mx-auto mb-2" />
                  <h4 className="text-sm font-extrabold text-slate-900 truncate">
                    {organization ? organization.name : "Unassigned"}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1.5">Organization</p>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 border-slate-900 bg-white/95 shadow rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">HR Controls Panel</h3>
                <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed font-sans">
                  Manage organization settings, register new team members, track pre-activation links, and monitor employee databases.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(organization ? "/organization/dashboard" : "/organization/create")}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow transition-all text-xs"
                >
                  <span>{organization ? "Go to Organization Dashboard" : "Set Up Workspace Profile"}</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 border-2 border-slate-900 hover:shadow transition-all text-xs"
                >
                  <span>Edit Personal Details</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </Card>

            {/* Attendance Portal Check-In Timeline Settings */}
            {organization && (
              <Card className="border-2 border-slate-900 bg-white/95 shadow rounded-xl p-5 md:col-span-2">
                <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-sky-900" />
                  <span>Check-In Shift Timeline Control</span>
                </h3>
                <form onSubmit={handleSaveTimeline} className="space-y-4">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed font-sans">
                    Define the daily time window during which the employee check-in portal remains open. Outside this range, the check-in action is automatically closed.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkInStart" className="text-slate-950 font-bold text-xs">
                        Start Check-In Window (HH:MM)
                      </Label>
                      <Input
                        id="checkInStart"
                        type="time"
                        className="border-2 border-slate-900 bg-white h-11"
                        value={checkInStart}
                        onChange={(e) => setCheckInStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkInEnd" className="text-slate-950 font-bold text-xs">
                        End Check-In Window (HH:MM)
                      </Label>
                      <Input
                        id="checkInEnd"
                        type="time"
                        className="border-2 border-slate-900 bg-white h-11"
                        value={checkInEnd}
                        onChange={(e) => setCheckInEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={savingTimeline}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow transition-all text-xs disabled:opacity-70 active:scale-95"
                  >
                    {savingTimeline ? "Saving Settings..." : "Save Shift Time Window"}
                  </button>
                </form>
              </Card>
            )}

          </div>
        )}

        {/* Employee Dashboard Panel */}
        {!isHR && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left section: Information & Today's Attendance clock */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile card */}
              <Card className="border-2 border-slate-900 bg-white/95 shadow rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider pb-1 border-b">Member Profile</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 w-20">Full Name</span>
                    <span className="font-bold text-slate-900 truncate flex-1">{userData.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 w-20">Email</span>
                    <span className="font-bold text-slate-900 truncate flex-1">{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 w-20">Company</span>
                    <span className="font-bold text-slate-900 truncate flex-1">
                      {organization ? organization.name : "No organization linked"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={14} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 w-20">Employee ID</span>
                    <span className="font-bold text-sky-900 bg-sky-50 border border-slate-900 px-1.5 py-0.5 rounded text-[10px]">
                      {userData.employeeId || "PENDING"}
                    </span>
                  </div>
                </div>

                {/* AI setup trigger button */}
                <button
                  onClick={() => setShowResumeSetup(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2 font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-900 transition-all text-xs"
                >
                  Update AI Profile
                </button>
              </Card>

              {/* Attendance controller Widget */}
              <Card className="border-2 border-slate-900 bg-white/95 shadow rounded-xl p-5 space-y-4 text-center">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider pb-1 border-b">Shift Tracker</h3>
                
                {/* Active checkin session timer */}
                {sessionTime && (
                  <div className="space-y-1 py-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Session Time</span>
                    <h2 className="text-3xl font-black text-emerald-600 font-mono tracking-wider">{sessionTime}</h2>
                  </div>
                )}

                {/* Status message */}
                <div className="text-xs font-bold text-slate-700 space-y-3">
                  {!todayRecord ? (
                    <>
                      <p className="text-slate-500">You are not checked in for today.</p>
                      {!isPortalOpen && (
                        <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-3 text-left text-amber-800 text-xs font-semibold flex items-start gap-2">
                          <ShieldAlert className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Check-In Window Closed</p>
                            <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed font-sans">
                              The check-in portal is only open between <span className="underline font-bold">{orgStart}</span> and <span className="underline font-bold">{orgEnd}</span>.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : todayRecord.checkOut ? (
                    <p className="text-slate-800">
                      Shift completed today! (Logged hours: <span className="text-sky-900">{todayRecord.workingHours}h</span>)
                    </p>
                  ) : (
                    <p className="text-emerald-600 flex items-center justify-center gap-1 font-sans">
                      ● Currently Checked In (Shift in progress)
                    </p>
                  )}
                </div>

                {/* Control Action Button */}
                <div className="pt-2">
                  {!todayRecord ? (
                    isPortalOpen ? (
                      <button
                        onClick={() => handleAttendanceAction("checkin")}
                        disabled={loadingAction}
                        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-slate-900 shadow hover:shadow-md transition-all active:scale-95 text-xs disabled:opacity-50"
                      >
                        <Play className="h-4 w-4 fill-white" /> Check In Today
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-extrabold bg-slate-100 text-slate-400 border-2 border-slate-300 transition-all text-xs cursor-not-allowed"
                      >
                        Check-In Closed
                      </button>
                    )
                  ) : todayRecord.checkOut ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-extrabold bg-slate-100 text-slate-400 border-2 border-slate-300 transition-all text-xs cursor-not-allowed"
                    >
                      Shift Completed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAttendanceAction("checkout")}
                      disabled={loadingAction}
                      className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-extrabold bg-red-500 hover:bg-red-600 text-white border-2 border-slate-900 shadow hover:shadow-md transition-all active:scale-95 text-xs disabled:opacity-50"
                    >
                      <Square className="h-4 w-4 fill-white" /> Check Out Shift
                    </button>
                  )}
                </div>
              </Card>

            </div>

            {/* Right section: Calendar & Stats Summary */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Stats overview card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/95 border-2 border-slate-900 p-4 rounded-xl text-center shadow">
                  <Calendar className="h-6 w-6 text-sky-900 mx-auto mb-1.5" />
                  <h4 className="text-xl font-black text-slate-900">{totalPresentDays}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Days Logged (This Month)</p>
                </div>
                <div className="bg-white/95 border-2 border-slate-900 p-4 rounded-xl text-center shadow">
                  <Clock className="h-6 w-6 text-sky-900 mx-auto mb-1.5" />
                  <h4 className="text-xl font-black text-slate-900">{avgHours}h</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Avg Daily Hours</p>
                </div>
              </div>

              {/* Employee Biography & AI Skills Summary */}
              {(userData.bio || (userData.skills && userData.skills.length > 0) || (userData.importantPoints && userData.importantPoints.length > 0)) && (
                <Card className="border-2 border-slate-900 bg-white/95 shadow rounded-xl p-5 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                    <span>AI Professional Biography</span>
                  </h3>
                  <div className="space-y-4">
                    {userData.bio && (
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Professional Bio</h4>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3">
                          {userData.bio}
                        </p>
                      </div>
                    )}
                    {userData.skills && userData.skills.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Core Competencies</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {userData.skills.map((skill: string, sIdx: number) => (
                            <span key={sIdx} className="bg-sky-50 border border-sky-300 text-sky-850 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {userData.importantPoints && userData.importantPoints.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Achievements & Milestones</h4>
                        <ul className="list-disc pl-5 text-xs text-slate-700 font-semibold space-y-1 leading-relaxed">
                          {userData.importantPoints.map((point: string, pIdx: number) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Attendance Monthly Calendar Log */}
              <Card className="border-2 border-slate-900 bg-white/95 shadow rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b pb-2">Monthly Attendance Calendar</h3>
                
                {/* 30-Day Grid Layout */}
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium text-xs">
                    No logs recorded for this month yet. Use the timer widget to check in!
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-7 gap-2">
                      {/* Weekday titles */}
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                        <div key={day} className="text-center text-xs font-extrabold text-slate-500 py-1 uppercase">{day}</div>
                      ))}

                      {/* Map days */}
                      {attendanceRecords.map((record, index) => {
                        const dateObj = new Date(record.date);
                        const dayNum = dateObj.getDate();

                        let colorClass = "bg-slate-50 border-slate-200 text-slate-400";
                        if (record.status === "present") {
                          colorClass = record.checkOut 
                            ? "bg-emerald-100 border-emerald-500 text-emerald-800 animate-fade-in" 
                            : "bg-amber-100 border-amber-500 text-amber-800";
                        } else if (record.status === "leave") {
                          colorClass = "bg-sky-50 border-sky-300 text-sky-600";
                        }

                        return (
                          <div 
                            key={index} 
                            className={`flex flex-col items-center justify-center h-14 border-2 rounded-lg font-extrabold text-sm sm:text-base shadow-sm hover:scale-105 transition-all cursor-default ${colorClass}`}
                            title={
                              record.status === "present"
                                ? `Check In: ${record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}\nCheck Out: ${record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}\nHours: ${record.workingHours}h`
                                : "Holiday/Weekend Off"
                            }
                          >
                            <span>{dayNum}</span>
                            {record.status === "present" && (
                              <span className="text-[10px] font-black tracking-tight block mt-0.5 opacity-90">
                                {record.workingHours}h
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend keys */}
                    <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-500 pt-4 mt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500 block shrink-0" />
                        <span>Present</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-amber-100 border border-amber-500 block shrink-0" />
                        <span>Active Session</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-sky-50 border border-sky-300 block shrink-0" />
                        <span>Weekend / Leave</span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
