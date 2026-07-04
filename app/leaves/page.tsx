"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Send, X } from "lucide-react";
import BackgroundPattern from "@/components/BackgroundPattern";
import { toast } from "react-toastify";

interface LeaveRequest {
  startDate: string;
  endDate: string;
  leaveType: "casual" | "medical" | "maternity" | "other";
  reason: string;
}

const LEAVE_TYPES = [
  { id: "casual", label: "Casual Leave", description: "General leave for personal reasons" },
  { id: "medical", label: "Medical Leave", description: "For medical emergencies or health issues" },
  { id: "maternity", label: "Maternity Leave", description: "For expectant mothers (female employees only)" },
  { id: "other", label: "Other Leave", description: "For other reasons (please specify below)" },
];

export default function LeavesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approvedLeaveDates, setApprovedLeaveDates] = useState<Set<string>>(new Set());

  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Form states
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"] | null>(null);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(0);

  // Fetch user data and approved leave dates
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const fetchUserData = async () => {
        try {
          const res = await fetch("/api/profile", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setUserData(data);
            if (data.role !== "employee") {
              router.push("/dashboard");
            }
            // Fetch approved leave requests after setting user data
            await fetchApprovedLeaves();
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          toast.error("Failed to load your profile");
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [status, session, router]);

  // Fetch approved leave dates for the user
  const fetchApprovedLeaves = async () => {
    try {
      // Fetch all approved leave requests for this user
      const res = await fetch("/api/leaves/my-approved", { cache: "no-store" });
      if (res.ok) {
        const leaves = await res.json();
        
        // Build set of all approved leave dates
        const blockedDates = new Set<string>();
        leaves.forEach((leave: any) => {
          const startDate = new Date(leave.startDate);
          const endDate = new Date(leave.endDate);
          
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
            blockedDates.add(dateStr);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });
        
        setApprovedLeaveDates(blockedDates);
      }
    } catch (error) {
      console.error("Failed to fetch approved leaves:", error);
    }
  };

  // Refetch approved leaves when user data changes
  useEffect(() => {
    if (userData?.id) {
      fetchApprovedLeaves();
    }
  }, [userData?.id]);

  // Calculate duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDuration(diffDays);
    } else {
      setDuration(0);
    }
  }, [startDate, endDate]);

  // Get calendar days for current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isDateSelectable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isBlocked = approvedLeaveDates.has(dateStr);
    
    return date >= today && !isBlocked;
  };

  const isDateBlocked = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return approvedLeaveDates.has(dateStr);
  };

  const isDateInRange = (day: number) => {
    if (!startDate || !endDate) return false;

    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return date >= start && date <= end;
  };

  const handleDateSelect = (day: number) => {
    if (!isDateSelectable(day)) return;

    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (!startDate) {
      setStartDate(dateStr);
      setEndDate(null);
    } else if (!endDate) {
      const start = new Date(startDate);
      const selected = new Date(dateStr);

      if (selected < start) {
        setStartDate(dateStr);
        setEndDate(null);
      } else {
        setEndDate(dateStr);
      }
    } else {
      setStartDate(dateStr);
      setEndDate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !leaveType) {
      toast.error("Please select dates and leave type");
      return;
    }

    if (leaveType === "other" && !reason.trim()) {
      toast.error("Please provide a reason for your leave");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          leaveType,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Leave request submitted successfully! HR will review it soon.");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        toast.error(data.message || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error("Network error while submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setLeaveType(null);
    setReason("");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundPattern />
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-sky-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen py-8 px-4">
      <BackgroundPattern />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-sm font-bold text-sky-900 hover:text-sky-800 mb-4 transition"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>

          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900">Apply for Leave</h1>
            <p className="text-sm text-slate-600">Submit a leave request and get approval from HR</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructions Card */}
            <div className="bg-white border-2 border-slate-900 rounded-xl p-5 shadow space-y-3">
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                Select your leave start and end dates from the calendar below. Both dates must be after today.
                {userData?.gender === "female" && (
                  <span className="block mt-2 text-sky-900">Maternity leave is available for you.</span>
                )}
              </p>
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-300 border border-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">Blocked - Already approved leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-sky-900 border border-slate-900" />
                  <span className="text-xs font-semibold text-slate-600">Selected dates for new request</span>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white border-2 border-slate-900 rounded-xl p-6 shadow space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <ChevronLeft size={20} className="text-slate-900" />
                </button>

                <h3 className="text-lg font-black text-slate-900">{monthName}</h3>

                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <ChevronRight size={20} className="text-slate-900" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-black text-slate-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSelectable = isDateSelectable(day);
                  const isBlocked = isDateBlocked(day);
                  const isStart = startDate === dateStr;
                  const isEnd = endDate === dateStr;
                  const isInRange = isDateInRange(day);
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentMonth.getMonth() &&
                    new Date().getFullYear() === currentMonth.getFullYear();

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateSelect(day)}
                      disabled={!isSelectable || isBlocked}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg font-bold text-sm transition-all relative
                        ${isBlocked ? "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 cursor-not-allowed border-2 border-slate-400 opacity-60" : ""}
                        ${!isSelectable && !isBlocked ? "bg-slate-50 text-slate-300 cursor-not-allowed" : ""}
                        ${isStart || isEnd ? "bg-sky-900 text-white border-2 border-slate-900 scale-105 z-10" : ""}
                        ${isInRange && !isStart && !isEnd && !isBlocked ? "bg-sky-100 text-sky-900" : ""}
                        ${!isStart && !isEnd && !isInRange && isSelectable && !isBlocked ? "bg-white border-2 border-slate-200 hover:border-sky-900" : ""}
                        ${isToday && !isStart && !isEnd && !isBlocked ? "ring-2 ring-amber-400" : ""}
                      `}
                      title={isBlocked ? "Leave already approved for this date" : ""}
                    >
                      {day}
                      {isBlocked && <div className="absolute inset-0 flex items-center justify-center text-xs opacity-70">✕</div>}
                    </button>
                  );
                })}
              </div>

              {/* Date Selection Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="text-xs font-bold text-slate-600 uppercase">Selected Dates:</div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Start: {startDate ? new Date(startDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }) : "Not selected"}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    End: {endDate ? new Date(endDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" }) : "Not selected"}
                  </p>
                  {duration > 0 && (
                    <p className="text-sm font-bold text-sky-900 bg-sky-50 border border-sky-200 rounded px-2 py-1 inline-block">
                      Duration: {duration} day(s)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-900 rounded-xl p-6 shadow space-y-5">
              <h3 className="text-base font-black text-slate-900 border-b pb-2">Leave Request Form</h3>

              {/* Leave Type Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-600 tracking-wider">Leave Type</label>
                <div className="space-y-2">
                  {LEAVE_TYPES.map((type) => {
                    // Hide maternity leave if not female
                    if (type.id === "maternity" && userData?.gender !== "female") {
                      return null;
                    }

                    const isSelected = leaveType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setLeaveType(type.id as LeaveRequest["leaveType"]);
                          if (type.id !== "other") {
                            setReason("");
                          }
                        }}
                        className={`
                          w-full text-left p-3 rounded-lg border-2 transition-all
                          ${isSelected ? "bg-sky-900 text-white border-sky-900 shadow" : "bg-white border-slate-200 hover:border-sky-900 text-slate-900"}
                        `}
                      >
                        <div className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          {type.label}
                        </div>
                        <div className={`text-xs font-semibold mt-0.5 ${isSelected ? "text-sky-100" : "text-slate-600"}`}>
                          {type.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason Textarea (only for "other" leave type) */}
              {leaveType === "other" && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-600 tracking-wider">Reason for Leave</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain the reason for your leave..."
                    rows={4}
                    className="w-full border-2 border-slate-900 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-sky-900 transition resize-none"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold">
                    {reason.length}/500 characters
                  </p>
                </div>
              )}

              {/* Duration Display */}
              {duration > 0 && (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-lg p-3">
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Leave Duration</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{duration} days</p>
                </div>
              )}

              {/* Validation Messages */}
              {!startDate || !endDate ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Step 1</p>
                  <p className="text-xs font-semibold text-amber-800 mt-1">Select start and end dates from the calendar</p>
                </div>
              ) : !leaveType ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Step 2</p>
                  <p className="text-xs font-semibold text-amber-800 mt-1">Select a leave type</p>
                </div>
              ) : leaveType === "other" && !reason.trim() ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Step 3</p>
                  <p className="text-xs font-semibold text-amber-800 mt-1">Provide a reason for your leave</p>
                </div>
              ) : null}

              {/* Submit Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !startDate || !endDate || !leaveType || (leaveType === "other" && !reason.trim())}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                >
                  <Send size={14} />
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2 font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 border-2 border-slate-300 transition-all text-sm"
                >
                  <X size={14} />
                  Reset
                </button>
              </div>
            </form>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">About Leave Requests</p>
              <ul className="text-xs font-semibold text-blue-800 space-y-1.5 list-disc list-inside">
                <li>HR will review your request</li>
                <li>You'll receive email confirmation</li>
                <li>Approved dates marked as "Leave" in attendance</li>
                <li>Cannot change once approved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
