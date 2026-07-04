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
  ShieldAlert
} from "lucide-react";
import { toast } from "react-toastify";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

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
        } else {
          // Employee - fetch attendance logs
          fetchAttendance();
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
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-1.5">
                Welcome back, {userData.name}! <Sparkles className="h-5 w-5 text-amber-500 animate-spin-slow" />
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
                <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
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
                    <span className="font-bold text-slate-700 w-20">ID Tag</span>
                    <span className="font-bold text-sky-900 bg-sky-50 border border-slate-900 px-1.5 py-0.5 rounded text-[10px]">
                      {userData.employeeId || "PENDING"}
                    </span>
                  </div>
                </div>
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
                <div className="text-xs font-bold text-slate-700">
                  {!todayRecord ? (
                    <p className="text-slate-500">You are not checked in for today.</p>
                  ) : todayRecord.checkOut ? (
                    <p className="text-slate-800">
                      Shift completed today! (Logged hours: <span className="text-sky-900">{todayRecord.workingHours}h</span>)
                    </p>
                  ) : (
                    <p className="text-emerald-600 flex items-center justify-center gap-1">
                      ● Currently Checked In (Shift in progress)
                    </p>
                  )}
                </div>

                {/* Control Action Button */}
                <div className="pt-2">
                  {!todayRecord ? (
                    <button
                      onClick={() => handleAttendanceAction("checkin")}
                      disabled={loadingAction}
                      className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-slate-900 shadow hover:shadow-md transition-all active:scale-95 text-xs disabled:opacity-50"
                    >
                      <Play className="h-4 w-4 fill-white" /> Check In Today
                    </button>
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
                        <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase">{day}</div>
                      ))}

                      {/* Map days */}
                      {attendanceRecords.map((record, index) => {
                        const dateObj = new Date(record.date);
                        const dayNum = dateObj.getDate();
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                        let colorClass = "bg-slate-50 border-slate-200 text-slate-400";
                        if (record.status === "present") {
                          colorClass = record.checkOut 
                            ? "bg-emerald-100 border-emerald-500 text-emerald-800" 
                            : "bg-amber-100 border-amber-500 text-amber-800";
                        } else if (record.status === "leave") {
                          colorClass = "bg-sky-50 border-sky-300 text-sky-600";
                        }

                        return (
                          <div 
                            key={index} 
                            className={`flex flex-col items-center justify-center h-10 border-2 rounded-lg font-bold text-xs shadow-sm hover:scale-105 transition-all cursor-default ${colorClass}`}
                            title={
                              record.status === "present"
                                ? `Check In: ${record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}\nCheck Out: ${record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}\nHours: ${record.workingHours}h`
                                : "Holiday/Weekend Off"
                            }
                          >
                            <span>{dayNum}</span>
                            {record.status === "present" && (
                              <span className="text-[7px] font-black tracking-tighter block mt-0.5">
                                {record.workingHours}h
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Legend keys */}
                    <div className="flex items-center justify-center gap-4 text-[9px] font-bold text-slate-500 pt-4 mt-2 border-t">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-500 block shrink-0" />
                        <span>Present</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-500 block shrink-0" />
                        <span>Active Session</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-sky-50 border border-sky-300 block shrink-0" />
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
