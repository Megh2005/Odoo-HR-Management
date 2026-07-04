"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle2, XCircle, Clock, AlertCircle, FileText } from "lucide-react";
import BackgroundPattern from "@/components/BackgroundPattern";
import { toast } from "react-toastify";

interface LeaveRequest {
  id: string;
  _id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  startDate: string;
  endDate: string;
  duration: number;
  leaveType: "casual" | "medical" | "maternity" | "other";
  reason: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

const LEAVE_TYPE_LABELS = {
  casual: "Casual Leave",
  medical: "Medical Leave",
  maternity: "Maternity Leave",
  other: "Other Leave",
};

export default function HRLeavesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch leave requests
  const fetchLeaveRequests = async (status?: string) => {
    setLoading(true);
    try {
      const queryParam = status ? `?status=${status}` : "";
      const res = await fetch(`/api/leaves/requests${queryParam}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data);
      } else if (res.status === 403) {
        toast.error("You don't have permission to view leave requests");
        router.push("/dashboard");
      } else {
        toast.error("Failed to load leave requests");
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      toast.error("Network error while fetching requests");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "hr") {
        router.push("/dashboard");
        return;
      }

      fetchLeaveRequests(filterStatus === "all" ? undefined : filterStatus);
    }
  }, [status, session, router, filterStatus]);

  // Handle approval
  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/leaves/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          remarks: remarks[id] || "",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Leave request approved successfully!");
        // Update the request in local state
        setLeaveRequests(
          leaveRequests.map((req) =>
            req.id === id ? { ...req, status: "approved" } : req
          )
        );
        setRemarks({ ...remarks, [id]: "" });
      } else {
        toast.error(data.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle rejection
  const handleReject = async (id: string) => {
    if (!remarks[id]?.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/leaves/requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          remarks: remarks[id],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Leave request rejected!");
        // Update the request in local state
        setLeaveRequests(
          leaveRequests.map((req) =>
            req.id === id ? { ...req, status: "rejected" } : req
          )
        );
        setRemarks({ ...remarks, [id]: "" });
      } else {
        toast.error(data.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Network error");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 size={14} />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
            <XCircle size={14} />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <Clock size={14} />
            Pending
          </span>
        );
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "casual":
        return "bg-blue-50 border-blue-300 text-blue-900";
      case "medical":
        return "bg-red-50 border-red-300 text-red-900";
      case "maternity":
        return "bg-pink-50 border-pink-300 text-pink-900";
      case "other":
        return "bg-purple-50 border-purple-300 text-purple-900";
      default:
        return "bg-slate-50 border-slate-300 text-slate-900";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundPattern />
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-sky-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <BackgroundPattern />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/organization/dashboard")}
            className="flex items-center gap-2 text-sm font-bold text-sky-900 hover:text-sky-800 mb-4 transition"
          >
            <ChevronLeft size={16} />
            Back to Dashboard
          </button>

          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900">Leave Requests</h1>
            <p className="text-sm text-slate-600">Review and manage employee leave requests</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border-2 ${
                filterStatus === status
                  ? "bg-sky-900 text-white border-sky-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-sky-900"
              }`}
            >
              {status === "all"
                ? "All Requests"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {leaveRequests.length === 0 ? (
          <div className="bg-white border-2 border-slate-900 rounded-xl p-12 text-center shadow">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">No leave requests found</p>
            <p className="text-xs text-slate-500 mt-1">
              {filterStatus === "pending"
                ? "All pending requests have been processed"
                : `No ${filterStatus} requests at the moment`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaveRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white border-2 border-slate-900 rounded-xl shadow hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 flex items-start justify-between gap-4 border-b-2 border-slate-900">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-black text-slate-900">{request.employeeName}</h3>
                    <p className="text-xs font-semibold text-slate-600">{request.employeeEmail}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Leave Type</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getLeaveTypeColor(request.leaveType)}`}>
                        {LEAVE_TYPE_LABELS[request.leaveType as keyof typeof LEAVE_TYPE_LABELS]}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Start Date</p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(request.startDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">End Date</p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(request.endDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Duration</p>
                      <p className="text-sm font-bold text-sky-900 bg-sky-50 border border-sky-200 rounded px-2 py-1 inline-block">
                        {request.duration} day(s)
                      </p>
                    </div>
                  </div>

                  {/* Reason */}
                  {request.reason && (
                    <div className="bg-slate-50 border-l-4 border-slate-400 rounded p-3">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Reason</p>
                      <p className="text-sm font-semibold text-slate-700 line-clamp-2">{request.reason}</p>
                    </div>
                  )}

                  {/* Request Date */}
                  <p className="text-xs text-slate-500 font-semibold">
                    Submitted on{" "}
                    {new Date(request.createdAt).toLocaleDateString("en-IN", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Action Section */}
                {request.status === "pending" && (
                  <div className="bg-slate-50 px-6 py-4 border-t-2 border-slate-900 space-y-3">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-600 mb-2 block">
                        Remarks (Optional for approval, Required for rejection)
                      </label>
                      <textarea
                        value={remarks[request.id] || ""}
                        onChange={(e) => setRemarks({ ...remarks, [request.id]: e.target.value })}
                        placeholder="Add remarks about this leave request..."
                        rows={2}
                        className="w-full border-2 border-slate-900 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-sky-900 transition resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 font-bold bg-emerald-600 text-white hover:bg-emerald-700 border-2 border-slate-900 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        {processingId === request.id ? "Processing..." : "Approve"}
                      </button>

                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2 font-bold bg-red-600 text-white hover:bg-red-700 border-2 border-slate-900 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                      >
                        <XCircle size={14} />
                        {processingId === request.id ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Approved/Rejected Status Section */}
                {request.status !== "pending" && request.remarks && (
                  <div className="bg-slate-50 px-6 py-4 border-t-2 border-slate-900 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">
                      {request.status === "approved" ? "Approval" : "Rejection"} Remarks
                    </p>
                    <p className="text-sm font-semibold text-slate-700 bg-white border-l-4 border-slate-300 pl-3 py-2 rounded">
                      {request.remarks}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
