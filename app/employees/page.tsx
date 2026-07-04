"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import BackgroundPattern from "@/components/BackgroundPattern";
import { Users, UserCheck, Clock, Search } from "lucide-react";
import { toast } from "react-toastify";

export default function EmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [employees, setEmployees] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      fetchEmployees();
    }
  }, [status]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(employees);
    } else {
      setFiltered(
        employees.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.employeeId || "").toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q)
        )
      );
    }
  }, [search, employees]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
        setFiltered(data);
      } else {
        toast.error("Failed to load employees");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundPattern />
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-sky-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading directory...</p>
        </div>
      </div>
    );
  }

  const activeCount = employees.filter((e) => e.status === "active").length;
  const pendingCount = employees.filter((e) => e.status === "pending").length;

  return (
    <div className="min-h-screen p-6 pt-8">
      <BackgroundPattern />
      <div className="relative z-10 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-sky-900" />
              Employee Directory
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {employees.length} total &mdash; {activeCount} active &mdash; {pendingCount} pending
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-slate-900 rounded-lg pl-8 pr-3 py-2 text-xs font-semibold bg-white/90 focus:outline-none focus:border-sky-900 transition"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold text-sm">
            {search ? "No employees match your search." : "No employees found in this organization."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp) => (
              <button
                key={emp._id}
                onClick={() => router.push(`/employees/${emp._id}`)}
                className="group text-left border-2 border-slate-900 rounded-xl bg-white/95 hover:bg-sky-50/60 hover:shadow-lg transition-all duration-200 overflow-hidden active:scale-[0.98] cursor-pointer"
              >
                {/* Avatar banner */}
                <div className="bg-linear-to-br from-sky-900 to-slate-800 h-20 flex items-center justify-center relative">
                  <div className="relative h-16 w-16 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-300">
                    <Image
                      src={emp.avatar || `https://robohash.org/${emp.email}`}
                      alt={emp.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 truncate group-hover:text-sky-900 transition-colors">
                      {emp.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold truncate">{emp.email}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 bg-sky-100 border border-slate-900 px-2 py-0.5 rounded">
                      {emp.employeeId || "—"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        emp.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {emp.status === "active" ? (
                        <UserCheck size={9} />
                      ) : (
                        <Clock size={9} />
                      )}
                      {emp.status === "active" ? "Active" : "Pending"}
                    </span>
                  </div>

                  {emp.bio && (
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-2 font-sans">
                      {emp.bio}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
