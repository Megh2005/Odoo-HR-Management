"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  ArrowLeft,
  UserCheck,
  Clock,
  Mail,
  BadgeCheck,
  Calendar,
  IndianRupee,
  User,
  Briefcase,
  ChevronRight,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";

// ─── Salary helpers ──────────────────────────────────────────────────────────
function computeGross(s: SalaryForm): number {
  const b = Number(s.basic) || 0;
  const credits =
    (Number(s.hra) || 0) +
    (Number(s.da) || 0) +
    (Number(s.bonus) || 0) +
    (Number(s.otherAllowances) || 0);
  const debits =
    (Number(s.pf) || 0) +
    (Number(s.tax) || 0) +
    (Number(s.otherDeductions) || 0);
  return b + (b * credits) / 100 - (b * debits) / 100;
}

interface SalaryForm {
  basic: string;
  hra: string;
  da: string;
  bonus: string;
  otherAllowances: string;
  pf: string;
  tax: string;
  otherDeductions: string;
}

const EMPTY_SALARY: SalaryForm = {
  basic: "",
  hra: "",
  da: "",
  bonus: "",
  otherAllowances: "",
  pf: "",
  tax: "",
  otherDeductions: "",
};

// ─── Attendance calendar helpers ──────────────────────────────────────────────
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Salary field component (must be outside main component to avoid remount) ──
function SalaryField({
  label,
  field,
  type,
  required,
  placeholder,
  salaryForm,
  setSalaryForm,
}: {
  label: string;
  field: keyof SalaryForm;
  type: "credit" | "debit" | "base";
  required?: boolean;
  placeholder?: string;
  salaryForm: SalaryForm;
  setSalaryForm: React.Dispatch<React.SetStateAction<SalaryForm>>;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
        {label}
        {required && <span className="text-red-500">*</span>}
        {type === "credit" && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-700">+ credit</span>
        )}
        {type === "debit" && (
          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700">− debit</span>
        )}
      </label>
      <div className="relative">
        {type === "base" ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
        )}
        <input
          type="number"
          min="0"
          step="0.01"
          value={salaryForm[field]}
          onChange={(e) => setSalaryForm((prev) => ({ ...prev, [field]: e.target.value }))}
          placeholder={placeholder || (type === "base" ? "0.00" : "0")}
          className={`w-full border-2 border-slate-900 rounded-lg py-2 text-xs font-semibold bg-white focus:outline-none focus:border-sky-900 transition ${
            type === "base" ? "pl-7 pr-3" : "pl-3 pr-7"
          }`}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
type Tab = "overview" | "attendance" | "salary" | "security";

export default function EmployeeDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Attendance states
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceMonth, setAttendanceMonth] = useState(getMonthKey(new Date()));
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Salary states
  const [salaryForm, setSalaryForm] = useState<SalaryForm>(EMPTY_SALARY);
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryLoaded, setSalaryLoaded] = useState(false);

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth");
      return;
    }
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "hr") {
        router.replace("/dashboard");
        return;
      }
      fetchEmployee();
    }
  }, [status]);

  // ── Fetch employee profile ───────────────────────────────────────────────
  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${id}`);
      if (res.ok) {
        setEmployee(await res.json());
      } else {
        toast.error("Employee not found");
        router.push("/employees");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch attendance ─────────────────────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`/api/attendance/by-user/${id}?month=${attendanceMonth}`);
      if (res.ok) {
        setAttendanceRecords(await res.json());
      }
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoadingAttendance(false);
    }
  }, [id, attendanceMonth]);

  useEffect(() => {
    if (activeTab === "attendance" && id) fetchAttendance();
  }, [activeTab, fetchAttendance]);

  // ── Fetch salary ─────────────────────────────────────────────────────────
  const fetchSalary = useCallback(async () => {
    if (salaryLoaded) return;
    try {
      const res = await fetch(`/api/employees/${id}/salary`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSalaryForm({
            basic: String(data.basic || ""),
            hra: String(data.hra || ""),
            da: String(data.da || ""),
            bonus: String(data.bonus || ""),
            otherAllowances: String(data.otherAllowances || ""),
            pf: String(data.pf || ""),
            tax: String(data.tax || ""),
            otherDeductions: String(data.otherDeductions || ""),
          });
        }
        setSalaryLoaded(true);
      }
    } catch {
      toast.error("Failed to load salary structure");
    }
  }, [id, salaryLoaded]);

  useEffect(() => {
    if (activeTab === "salary" && id) fetchSalary();
  }, [activeTab, fetchSalary]);

  // ── Save salary ──────────────────────────────────────────────────────────
  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryForm.basic || Number(salaryForm.basic) <= 0) {
      toast.error("Basic salary is required");
      return;
    }
    setSavingSalary(true);
    try {
      const res = await fetch(`/api/employees/${id}/salary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basic: Number(salaryForm.basic),
          hra: Number(salaryForm.hra) || 0,
          da: Number(salaryForm.da) || 0,
          bonus: Number(salaryForm.bonus) || 0,
          otherAllowances: Number(salaryForm.otherAllowances) || 0,
          pf: Number(salaryForm.pf) || 0,
          tax: Number(salaryForm.tax) || 0,
          otherDeductions: Number(salaryForm.otherDeductions) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingSalary(false);
    }
  };

  // ── Attendance calendar render ───────────────────────────────────────────
  const renderAttendanceCalendar = () => {
    const [year, month] = attendanceMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    const recordMap: Record<string, any> = {};
    attendanceRecords.forEach((r) => (recordMap[r.date] = r));

    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
    const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
    const leaveCount = attendanceRecords.filter((r) => r.status === "leave").length;

    return (
      <div className="space-y-5">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const d = new Date(year, month - 2, 1);
              setAttendanceMonth(getMonthKey(d));
            }}
            className="text-sm font-bold text-slate-600 hover:text-sky-900 transition px-3 py-1.5 rounded-lg border border-slate-300 hover:border-sky-900 hover:bg-sky-50"
          >
            ← Prev
          </button>
          <span className="text-base font-black text-slate-900">
            {new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => {
              const d = new Date(year, month, 1);
              setAttendanceMonth(getMonthKey(d));
            }}
            className="text-sm font-bold text-slate-600 hover:text-sky-900 transition px-3 py-1.5 rounded-lg border border-slate-300 hover:border-sky-900 hover:bg-sky-50"
          >
            Next →
          </button>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 flex-wrap">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Present: {presentCount}
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-300">
            ✗ Absent: {absentCount}
          </span>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            ◌ Leave: {leaveCount}
          </span>
        </div>

        {/* Day-by-day list */}
        <div className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 px-4 pb-1 border-b border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Date</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Check In</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Check Out</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Duration</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 text-center">Hours</span>
          </div>

          {cells.map((day, idx) => {
            if (!day) return null;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const rec = recordMap[dateStr];
            const isToday =
              today.getFullYear() === year &&
              today.getMonth() + 1 === month &&
              today.getDate() === day;
            const isFuture = new Date(dateStr) > today;
            const dayName = new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });

            const checkInDate = rec?.checkIn ? new Date(rec.checkIn) : null;
            const checkOutDate = rec?.checkOut ? new Date(rec.checkOut) : null;

            const fmtTime = (d: Date) =>
              d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

            let sessionStr = "—";
            if (checkInDate && checkOutDate) {
              const diffMs = checkOutDate.getTime() - checkInDate.getTime();
              const totalMins = Math.floor(diffMs / 60000);
              const h = Math.floor(totalMins / 60);
              const m = totalMins % 60;
              sessionStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
            } else if (checkInDate && !checkOutDate) {
              const diffMs = Date.now() - checkInDate.getTime();
              const totalMins = Math.floor(diffMs / 60000);
              const h = Math.floor(totalMins / 60);
              const m = totalMins % 60;
              sessionStr = (h > 0 ? `${h}h ${m}m` : `${m}m`) + " ●";
            }

            let rowBg = isFuture ? "bg-slate-50 opacity-50" : "bg-white";
            let statusColor = "bg-slate-100 text-slate-400";
            if (rec?.status === "present") { rowBg = "bg-emerald-50"; statusColor = "bg-emerald-100 text-emerald-800"; }
            else if (rec?.status === "absent") { rowBg = "bg-red-50"; statusColor = "bg-red-100 text-red-700"; }
            else if (rec?.status === "leave") { rowBg = "bg-amber-50"; statusColor = "bg-amber-100 text-amber-700"; }

            return (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 items-center px-4 py-3 rounded-xl border ${
                  isToday ? "border-sky-900 ring-1 ring-sky-900" : "border-slate-200"
                } ${rowBg}`}
              >
                {/* Date + status */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-center shrink-0 w-9">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">{dayName}</span>
                    <span className="text-lg font-black text-slate-800 leading-none">{day}</span>
                  </div>
                  {rec?.status && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColor}`}>
                      {rec.status}
                    </span>
                  )}
                  {isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
                      Today
                    </span>
                  )}
                </div>

                {/* Check In */}
                <span className="text-sm font-bold text-emerald-700 text-center tabular-nums whitespace-nowrap">
                  {checkInDate ? fmtTime(checkInDate) : <span className="text-slate-300">—</span>}
                </span>

                {/* Check Out */}
                <span className={`text-sm font-bold text-center tabular-nums whitespace-nowrap ${checkOutDate ? "text-red-600" : checkInDate ? "text-amber-500" : "text-slate-300"}`}>
                  {checkOutDate ? fmtTime(checkOutDate) : checkInDate ? "Active" : "—"}
                </span>

                {/* Duration */}
                <span className="text-sm font-bold text-sky-800 text-center tabular-nums whitespace-nowrap">
                  {rec?.checkIn ? sessionStr : <span className="text-slate-300">—</span>}
                </span>

                {/* Working hours */}
                <span className="text-sm font-bold text-slate-700 text-center tabular-nums whitespace-nowrap">
                  {rec?.workingHours > 0 ? `${rec.workingHours.toFixed(1)}h` : <span className="text-slate-300">—</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // ── Loading / guard states ───────────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundPattern />
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-sky-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const gross = computeGross(salaryForm);

  return (
    <div className="min-h-screen p-4 sm:p-6 pt-8">
      <BackgroundPattern />
      <div className="relative z-10 max-w-4xl mx-auto space-y-6">

        {/* Back button */}
        <button
          onClick={() => router.push("/employees")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-900 transition"
        >
          <ArrowLeft size={14} />
          Back to Directory
        </button>

        {/* Profile header card */}
        <div className="border-2 border-slate-900 rounded-xl bg-white/95 overflow-hidden shadow-lg">
          <div className="bg-linear-to-br from-sky-900 to-slate-800 h-24 relative" />
          <div className="px-6 pb-5 -mt-12">
            <div className="relative h-20 w-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-200 mb-3">
              <Image
                src={employee.avatar || `https://robohash.org/${employee.email}`}
                alt={employee.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-slate-900">{employee.name}</h1>
                <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                  <Mail size={11} /> {employee.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold bg-sky-100 border border-slate-900 px-2 py-1 rounded flex items-center gap-1">
                  <BadgeCheck size={11} />
                  {employee.employeeId || "—"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${
                    employee.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {employee.status === "active" ? <UserCheck size={11} /> : <Clock size={11} />}
                  {employee.status === "active" ? "Active" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-2 border-slate-900 rounded-xl bg-white/95 overflow-hidden shadow-lg">
          {/* Tab bar */}
          <div className="flex border-b-2 border-slate-900 bg-slate-50">
            {(["overview", "attendance", "salary", "security"] as Tab[]).map((tab) => {
              const icons: Record<Tab, React.ReactNode> = {
                overview: <User size={13} />,
                attendance: <Calendar size={13} />,
                salary: <IndianRupee size={13} />,
                security: <Briefcase size={13} />,
              };
              const labels: Record<Tab, string> = {
                overview: "Overview",
                attendance: "Attendance",
                salary: "Salary Structure",
                security: "Security",
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold border-r-2 last:border-r-0 border-slate-900 transition-all ${
                    activeTab === tab
                      ? "bg-sky-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {icons[tab]}
                  <span className="hidden sm:inline">{labels[tab]}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Bio */}
                {employee.bio ? (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Professional Summary
                    </h3>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed font-sans bg-slate-50 border border-slate-200 rounded-lg p-3">
                      {employee.bio}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400">No biography completed yet.</p>
                )}

                {/* Quick facts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Gender", value: employee.gender || "—" },
                    { label: "Status", value: employee.status },
                    { label: "Role", value: employee.role },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-slate-800 capitalize">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                {employee.skills && employee.skills.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Competencies
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {employee.skills.map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold bg-sky-50 border border-sky-200 text-sky-900 px-2 py-0.5 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Important points */}
                {employee.importantPoints && employee.importantPoints.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                      Career Highlights
                    </h3>
                    <ul className="space-y-1.5">
                      {employee.importantPoints.map((point: string, i: number) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-700 font-medium font-sans">
                          <ChevronRight size={13} className="text-sky-900 mt-0.5 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── ATTENDANCE ── */}
            {activeTab === "attendance" && (
              <div>
                {loadingAttendance ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-8 w-8 border-4 border-sky-900 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  renderAttendanceCalendar()
                )}
              </div>
            )}

            {/* ── SALARY STRUCTURE ── */}
            {activeTab === "salary" && (
              <form onSubmit={handleSaveSalary} className="space-y-6">
                {/* Live gross preview */}
                <div className="bg-linear-to-r from-sky-900 to-slate-800 rounded-xl p-4 text-white text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                    Computed Gross Salary
                  </p>
                  <p className="text-3xl font-black">
                    ₹{gross.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-[9px] opacity-60 mt-1">
                    Updates live as you fill in the fields below
                  </p>
                </div>

                {/* Base */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    Base Salary
                  </h3>
                  <SalaryField label="Basic Salary" field="basic" type="base" required placeholder="e.g. 50000" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                </div>

                {/* Credits */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    Allowances &amp; Credits (% of Basic)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SalaryField label="HRA (House Rent Allowance)" field="hra" type="credit" placeholder="e.g. 20" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                    <SalaryField label="DA (Dearness Allowance)" field="da" type="credit" placeholder="e.g. 10" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                    <SalaryField label="Bonus" field="bonus" type="credit" placeholder="e.g. 5" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                    <SalaryField label="Other Allowances" field="otherAllowances" type="credit" placeholder="e.g. 5" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                  </div>
                </div>

                {/* Debits */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    Deductions &amp; Debits (% of Basic)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SalaryField label="PF (Provident Fund)" field="pf" type="debit" placeholder="e.g. 12" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                    <SalaryField label="Income Tax" field="tax" type="debit" placeholder="e.g. 10" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                    <SalaryField label="Other Deductions" field="otherDeductions" type="debit" placeholder="e.g. 2" salaryForm={salaryForm} setSalaryForm={setSalaryForm} />
                  </div>
                </div>

                {/* Breakdown summary */}
                {Number(salaryForm.basic) > 0 && (
                  <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-2 text-xs font-semibold">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Breakdown</p>
                    {[
                      { label: "Basic", value: Number(salaryForm.basic), color: "text-slate-800" },
                      ...(Number(salaryForm.hra) > 0 ? [{ label: `HRA (${salaryForm.hra}%)`, value: (Number(salaryForm.hra) / 100) * Number(salaryForm.basic), color: "text-emerald-700" }] : []),
                      ...(Number(salaryForm.da) > 0 ? [{ label: `DA (${salaryForm.da}%)`, value: (Number(salaryForm.da) / 100) * Number(salaryForm.basic), color: "text-emerald-700" }] : []),
                      ...(Number(salaryForm.bonus) > 0 ? [{ label: `Bonus (${salaryForm.bonus}%)`, value: (Number(salaryForm.bonus) / 100) * Number(salaryForm.basic), color: "text-emerald-700" }] : []),
                      ...(Number(salaryForm.otherAllowances) > 0 ? [{ label: `Other Allowances (${salaryForm.otherAllowances}%)`, value: (Number(salaryForm.otherAllowances) / 100) * Number(salaryForm.basic), color: "text-emerald-700" }] : []),
                      ...(Number(salaryForm.pf) > 0 ? [{ label: `PF (${salaryForm.pf}%)`, value: -(Number(salaryForm.pf) / 100) * Number(salaryForm.basic), color: "text-red-600" }] : []),
                      ...(Number(salaryForm.tax) > 0 ? [{ label: `Tax (${salaryForm.tax}%)`, value: -(Number(salaryForm.tax) / 100) * Number(salaryForm.basic), color: "text-red-600" }] : []),
                      ...(Number(salaryForm.otherDeductions) > 0 ? [{ label: `Other Deductions (${salaryForm.otherDeductions}%)`, value: -(Number(salaryForm.otherDeductions) / 100) * Number(salaryForm.basic), color: "text-red-600" }] : []),
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-slate-600">{row.label}</span>
                        <span className={`font-bold ${row.color}`}>
                          {row.value >= 0 ? "+" : ""}₹{Math.abs(row.value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-slate-900">
                      <span>Gross Total</span>
                      <span>₹{gross.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingSalary || !salaryForm.basic}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-3 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Save size={14} />
                  {savingSalary ? "Saving..." : "Save Salary Structure"}
                </button>
              </form>
            )}

            {/* ── SECURITY (read-only for HR) ── */}
            {activeTab === "security" && (
              <div className="space-y-6">

                {/* Notice banner */}
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-xs font-semibold text-amber-800">
                  <span className="mt-0.5">🔒</span>
                  <span>This information was provided by the employee. HR can view it but cannot make changes.</span>
                </div>

                {/* ── Personal Details ── */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 pb-1 border-b border-slate-100">
                    Personal Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Date of Birth", value: employee.dateOfBirth || "—" },
                      { label: "Gender", value: employee.gender || "—" },
                      { label: "Nationality", value: employee.nationality || "—" },
                      { label: "Personal Email", value: employee.personalEmail || "—" },
                      { label: "Marital Status", value: employee.maritalStatus || "—" },
                      { label: "Date of Joining", value: employee.dateOfJoining || "—" },
                    ].map((item) => (
                      <div key={item.label} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-slate-800 capitalize break-all">{item.value}</span>
                      </div>
                    ))}

                    {/* Residing Address — full width with map */}
                    <div className="col-span-2 sm:col-span-3 border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        Residing Address
                      </span>
                      <span className="text-xs font-bold text-slate-800 block">
                        {employee.residingAddress || "—"}
                      </span>
                      {employee.residingAddress && (
                        <div className="mt-2 border-2 border-slate-300 rounded-lg overflow-hidden h-[180px] w-full bg-slate-100">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY}&q=${encodeURIComponent(employee.residingAddress)}`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Bank Details ── */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3 pb-1 border-b border-slate-100">
                    Bank Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Account Number", value: employee.bankAccountNumber || "—" },
                      { label: "Bank Name", value: employee.bankName || "—" },
                      { label: "IFSC Code", value: employee.ifscCode || "—" },
                      { label: "PAN No", value: employee.panNo || "—" },
                      { label: "UAN No", value: employee.uanNo || "—" },
                      { label: "Emp Code", value: employee.empCode || "—" },
                    ].map((item) => (
                      <div key={item.label} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-slate-800 uppercase break-all">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
