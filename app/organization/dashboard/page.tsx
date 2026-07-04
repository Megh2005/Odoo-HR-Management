"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackgroundPattern from "@/components/BackgroundPattern";
import Image from "next/image";
import { 
  Building2, 
  MapPin, 
  Users, 
  Mail, 
  Plus, 
  Clock, 
  Building,
  UserCheck,
  UserPlus
} from "lucide-react";
import { toast } from "react-toastify";

export default function OrganizationDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [empJoiningYear, setEmpJoiningYear] = useState("");
  const [empSerialNumber, setEmpSerialNumber] = useState("");
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setUserData(data);

        // If HR has no organization, redirect to create page
        if (data.role === "hr" && !data.organizationId) {
          router.push("/organization/create");
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile/organization data", error);
    } finally {
      setFetchingData(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated" && session?.user) {
      fetchUserData();
    }
  }, [status, session]);

  useEffect(() => {
    if (userData && userData.role === "hr" && userData.organizationId) {
      fetchEmployees();
    }
  }, [userData]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim() || !newEmployeeEmail.trim() || !empJoiningYear.trim() || !empSerialNumber.trim()) {
      toast.error("Please enter Name, Email, Joining Year, and Serial Number");
      return;
    }

    setAddingEmployee(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmployeeName,
          email: newEmployeeEmail,
          joiningYear: empJoiningYear,
          serialNumber: empSerialNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Employee added successfully!");
        setNewEmployeeName("");
        setNewEmployeeEmail("");
        setEmpJoiningYear("");
        setEmpSerialNumber("");
        fetchEmployees();
      } else {
        toast.error(data.message || "Failed to add employee");
      }
    } catch (error) {
      toast.error("Failed to add employee");
    } finally {
      setAddingEmployee(false);
    }
  };

  if (status === "loading" || fetchingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BackgroundPattern />
        <p className="text-slate-900 font-medium">Loading...</p>
      </div>
    );
  }

  if (!session?.user || !userData) return null;

  const organization = userData.organizationId;
  const isHR = userData.role === "hr";

  if (!organization) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
        <BackgroundPattern />
        <Card className="max-w-md w-full border-2 border-slate-900 shadow-md rounded-xl bg-white text-center p-6">
          <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No Organization Linked</h3>
          <p className="text-sm text-slate-500 mt-2">
            {isHR 
              ? "You haven't set up an organization yet. Let's create one now!"
              : "Please contact your HR Officer to register your account under your company workspace."}
          </p>
          {isHR && (
            <button
              onClick={() => router.push("/organization/create")}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 transition-all hover:shadow-md"
            >
              Set Up Organization
            </button>
          )}
        </Card>
      </div>
    );
  }

  // Parse custom metadata fields
  const customInfo = organization.additionalInfo 
    ? (typeof organization.additionalInfo === "object" && !Map.prototype.isPrototypeOf(organization.additionalInfo)
        ? Object.entries(organization.additionalInfo)
        : Object.entries(Object.fromEntries(new Map(Object.entries(organization.additionalInfo)))))
    : [];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-12 px-4 md:px-8 pb-32">
      <BackgroundPattern />
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header Title */}
        <div className="text-center md:text-left space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900">Organization Dashboard</h1>
          <p className="text-sm text-slate-500 font-semibold">Manage workspace directory and company records</p>
        </div>

        {/* Organization Card Details */}
        <Card className="border-2 border-slate-900 shadow-md rounded-xl bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="bg-sky-900 p-6 flex flex-col md:flex-row items-center gap-6 border-b-2 border-slate-900 text-white">
            <div className="relative h-20 w-20 rounded-xl bg-white border-2 border-slate-900 overflow-hidden shrink-0 flex items-center justify-center shadow">
              {organization.logo ? (
                <Image
                  src={organization.logo}
                  alt={organization.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <Building2 className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div className="text-center md:text-left space-y-1.5 flex-1">
              <h2 className="text-2xl font-bold">{organization.name}</h2>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs font-semibold text-sky-200">
                <span className="flex items-center justify-center md:justify-start gap-1">
                  <MapPin size={14} /> {organization.address || "No address configured"}
                </span>
                <span className="hidden md:inline">|</span>
                <span className="flex items-center justify-center md:justify-start gap-1">
                  <Users size={14} /> Workspace ID: {organization._id.toString().slice(-6).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1 border-b border-slate-200">Company Specifications</h3>
            
            {customInfo.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No additional specifications registered.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customInfo.map(([key, value]: any) => (
                  <div key={key} className="flex justify-between items-center p-3 border-2 border-slate-900 rounded-lg bg-slate-50 text-sm">
                    <span className="font-bold text-slate-700">{key}</span>
                    <span className="font-medium text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employee Directory and Management Section */}
        {isHR && (
          <div className="w-full border-t-2 border-dashed border-slate-300 pt-8 mt-4 grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Add Employee widget */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-sky-900" />
                <h3 className="text-lg font-bold text-slate-900">Add New Employee</h3>
              </div>
              <Card className="border-2 border-slate-900 shadow rounded-lg bg-white/95 backdrop-blur-sm p-5">
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="empName" className="text-slate-900 font-semibold text-xs">Full Name</Label>
                    <Input
                      id="empName"
                      placeholder="e.g. John Doe"
                      className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white text-xs"
                      value={newEmployeeName}
                      onChange={(e) => setNewEmployeeName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empEmail" className="text-slate-900 font-semibold text-xs">Email Address</Label>
                    <Input
                      id="empEmail"
                      type="email"
                      placeholder="e.g. john@example.com"
                      className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white text-xs"
                      value={newEmployeeEmail}
                      onChange={(e) => setNewEmployeeEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="empJoiningYear" className="text-slate-900 font-semibold text-xs">Joining Year</Label>
                      <Input
                        id="empJoiningYear"
                        type="number"
                        placeholder="2026"
                        className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white text-xs"
                        value={empJoiningYear}
                        onChange={(e) => setEmpJoiningYear(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="empSerialNumber" className="text-slate-900 font-semibold text-xs">Serial No.</Label>
                      <Input
                        id="empSerialNumber"
                        type="number"
                        placeholder="1"
                        className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white text-xs"
                        value={empSerialNumber}
                        onChange={(e) => setEmpSerialNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={addingEmployee}
                    className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow active:scale-95 transition-all text-xs disabled:opacity-75"
                  >
                    {addingEmployee ? "Adding..." : "Add Employee"}
                  </button>
                </form>
              </Card>
            </div>

            {/* Employee List Directory */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-900" />
                <h3 className="text-lg font-bold text-slate-900">Workspace Directory</h3>
              </div>
              <Card className="border-2 border-slate-900 shadow rounded-lg bg-white/95 backdrop-blur-sm p-4 overflow-hidden">
                <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
                  {employees.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-medium text-xs">
                      No employees registered yet. Set up profiles using the creation widget.
                    </div>
                  ) : (
                    employees.map((emp) => (
                      <div key={emp._id} className="flex items-center justify-between border-2 border-slate-900 rounded-lg p-3 bg-slate-50 hover:bg-sky-50/50 transition-colors gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-10 w-10 rounded-full border border-slate-900 overflow-hidden bg-slate-200 shrink-0">
                            <Image
                              src={emp.avatar || `https://robohash.org/${emp.email}`}
                              alt={emp.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 truncate">{emp.name}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold truncate flex items-center gap-1">
                              <Mail size={12} /> {emp.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-[10px] font-bold text-slate-900 bg-sky-100 px-2 py-0.5 rounded border border-slate-900">
                            {emp.employeeId}
                          </span>
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded ${
                            emp.status === "active" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {emp.status === "active" ? <UserCheck size={10} /> : <Clock size={10} />}
                            {emp.status === "active" ? "Active" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
