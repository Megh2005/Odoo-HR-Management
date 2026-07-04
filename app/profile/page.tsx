"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BackgroundPattern from "@/components/BackgroundPattern";
import Image from "next/image";
import SignOutButton from "@/components/SignOutButton";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import {
  Pencil,
  Save,
  X,
  Map as MapIcon,
  Building2,
  MapPin,
  User,
  VenusAndMars,
  MapPinned,
  Mail,
  Plus,
  Users,
  CheckCircle,
  Clock,
  Building,
} from "lucide-react";

import { indianStatesAndCities } from "@/lib/states";
import { validatePincode } from "@/lib/pincode-validator";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    state: "",
    city: "",
    pincode: "",
  });

  const availableStates = Object.keys(indianStatesAndCities).sort();
  const availableCities = formData.state
    ? (indianStatesAndCities[formData.state] || []).sort()
    : [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || "",
          gender: data.gender || "",
          state: data.state || "",
          city: data.city || "",
          pincode: data.pincode || "",
        });
        setUserData(data);
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const [userData, setUserData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("");
  const [addingEmployee, setAddingEmployee] = useState(false);

  // States for organization creation form
  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [orgFields, setOrgFields] = useState<{ key: string; value: string }[]>([]);
  const [creatingOrg, setCreatingOrg] = useState(false);

  const addOrgField = () => {
    setOrgFields([...orgFields, { key: "", value: "" }]);
  };

  const removeOrgField = (index: number) => {
    setOrgFields(orgFields.filter((_, idx) => idx !== index));
  };

  const updateOrgField = (index: number, field: "key" | "value", value: string) => {
    setOrgFields(orgFields.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const handleOrgLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileFormData = new FormData();
    fileFormData.append("file", file);

    const promise = fetch("/api/upload-image", {
      method: "POST",
      body: fileFormData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload logo");
      setOrgLogo(data.secure_url);
      return data;
    });

    await toast.promise(promise, {
      pending: "Uploading organization logo...",
      success: "Logo uploaded successfully!",
      error: "Failed to upload logo",
    });
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization Name is required");
      return;
    }

    setCreatingOrg(true);
    try {
      const additionalInfo: Record<string, string> = {};
      orgFields.forEach((field) => {
        if (field.key.trim() && field.value.trim()) {
          additionalInfo[field.key.trim()] = field.value.trim();
        }
      });

      const res = await fetch("/api/organization/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          logo: orgLogo,
          address: orgAddress,
          additionalInfo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Organization created successfully!");
        fetchUserData(); // Reload profile details
        fetchEmployees(); // Reload employees list
      } else {
        toast.error(data.message || "Failed to create organization");
      }
    } catch (error) {
      toast.error("Failed to create organization");
    } finally {
      setCreatingOrg(false);
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
    if (session?.user && (session.user as any).role === "hr") {
      fetchEmployees();
    }
  }, [session]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeName.trim() || !newEmployeeEmail.trim()) {
      toast.error("Please enter name and email");
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
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Employee added successfully!");
        setNewEmployeeName("");
        setNewEmployeeEmail("");
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

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <BackgroundPattern />
        <p className="text-slate-900 font-medium">Loading...</p>
      </div>
    );
  }

  if (!session?.user) return null;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (formData.state && formData.city && formData.pincode) {
      const validation = validatePincode(
        formData.state,
        formData.city,
        formData.pincode,
      );
      if (!validation.isValid) {
        toast.error(validation.message || "Invalid Pincode");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          gender: formData.gender,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Update failed");
      }

      await update();

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: session.user.name || "",
      gender: (session.user as any).gender || "",
      state: userData?.state || "",
      city: userData?.city || "",
      pincode: userData?.pincode || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <BackgroundPattern />
      <Card className="w-full max-w-4xl border-2 border-slate-900 shadow-lg rounded-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center relative border-b border-slate-900 pb-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 pt-2">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-900 shadow-md shrink-0">
            {session.user.image || (session.user as any).avatar ? (
              <Image
                src={
                  session.user.image ||
                  (session.user as any).avatar ||
                  "https://robohash.org/placeholder"
                }
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-3xl">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="w-full space-y-5 px-2">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-slate-900 font-semibold text-sm"
                  >
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-slate-900 font-semibold text-sm"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={session.user.email || ""}
                    disabled
                    className="border-2 border-slate-300 rounded-lg bg-slate-50 text-slate-500 font-medium"
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="gender"
                    className="text-slate-900 font-semibold text-sm"
                  >
                    Gender
                  </Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non binary">Non Binary</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="state"
                      className="text-slate-900 font-semibold text-sm"
                    >
                      State
                    </Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          state: newState,
                          city: "", // Reset city when state changes
                          pincode: "", // Reset pincode when state changes
                        }));
                      }}
                      className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900"
                    >
                      <option value="">Select State</option>
                      {availableStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="city"
                      className="text-slate-900 font-semibold text-sm"
                    >
                      City
                    </Label>
                    <select
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                          pincode: "",
                        }))
                      }
                      disabled={!formData.state}
                      className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">Select City</option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="pincode"
                      className="text-slate-900 font-semibold text-sm"
                    >
                      Pincode
                    </Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pincode: e.target.value,
                        }))
                      }
                      maxLength={6}
                      disabled={!formData.city}
                      className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white font-medium text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-4 flex items-center gap-4 hover:bg-white transition-colors">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <User className="h-5 w-5 text-slate-700" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Name
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {session.user.name}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-4 flex items-center gap-4 hover:bg-white transition-colors">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border-2 border-slate-900">
                      <Mail className="h-5 w-5 text-slate-700" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-base font-bold text-slate-900 break-all">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Grid Section */}
                {userData && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Gender */}
                    <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-colors">
                      <VenusAndMars className="h-5 w-5 text-slate-500" />
                      <p className="text-xs font-bold text-slate-900 capitalize">
                        {userData.gender || "N/A"}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        Gender
                      </p>
                    </div>

                    {/* Address Fields */}
                    {(userData.isAddressUpdated ||
                      (userData.state &&
                        userData.city &&
                        userData.pincode)) && (
                      <>
                        <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-colors">
                          <MapIcon className="h-5 w-5 text-slate-500" />
                          <p className="text-xs font-bold text-slate-900">
                            {userData.state}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            State
                          </p>
                        </div>
                        <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-colors">
                          <MapPinned className="h-5 w-5 text-slate-500" />
                          <p className="text-xs font-bold text-slate-900">
                            {userData.city}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            City
                          </p>
                        </div>
                        <div className="bg-slate-50 border-2 border-slate-900 rounded-lg p-3 flex flex-col items-center justify-center text-center gap-1 hover:bg-white transition-colors">
                          <MapPin className="h-5 w-5 text-slate-500" />
                          <p className="text-xs font-bold text-slate-900">
                            {userData.pincode}
                          </p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            Pincode
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Organization Details */}
                {userData?.organizationId && (
                  <div className="w-full bg-slate-50 border-2 border-slate-900 rounded-lg p-5 mt-4 hover:bg-white transition-colors">
                    <div className="flex items-center gap-4 border-b border-slate-900 pb-3 mb-3">
                      {userData.organizationId.logo ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-slate-900 shadow-sm shrink-0">
                          <Image
                            src={userData.organizationId.logo}
                            alt="Org Logo"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-sky-100 flex items-center justify-center border-2 border-slate-900 text-sky-900 font-bold shrink-0">
                          <Building2 className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{userData.organizationId.name}</h3>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Organization Details</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {userData.organizationId.address && (
                        <p className="text-slate-700 font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span>{userData.organizationId.address}</span>
                        </p>
                      )}
                      {userData.organizationId.additionalInfo && Object.entries(userData.organizationId.additionalInfo).map(([k, v]: any) => (
                        <p key={k} className="text-slate-700 font-medium flex items-center gap-2">
                          <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider px-2 py-0.5 bg-slate-200 border border-slate-900 rounded">{k}:</span>
                          <span>{v}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employees Management List for HR */}
                {session.user.role === "hr" && (
                  <div className="w-full border-t-2 border-dashed border-slate-900 pt-6 mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Add Employee Form */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <Plus className="h-5 w-5 text-sky-900" />
                          <h3 className="text-lg font-bold text-slate-900">Add New Employee</h3>
                        </div>
                        <form onSubmit={handleAddEmployee} className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="empName" className="text-slate-900 font-semibold text-sm">Full Name</Label>
                            <Input
                              id="empName"
                              placeholder="Employee Full Name"
                              className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white text-sm"
                              value={newEmployeeName}
                              onChange={(e) => setNewEmployeeName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="empEmail" className="text-slate-900 font-semibold text-sm">Email Address</Label>
                            <Input
                              id="empEmail"
                              type="email"
                              placeholder="employee@example.com"
                              className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white text-sm"
                              value={newEmployeeEmail}
                              onChange={(e) => setNewEmployeeEmail(e.target.value)}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={addingEmployee}
                            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all text-sm disabled:opacity-75"
                          >
                            {addingEmployee ? "Adding..." : "Add Employee"}
                          </button>
                        </form>
                      </div>

                      {/* Employees List */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-sky-900" />
                          <h3 className="text-lg font-bold text-slate-900">Organization Employees</h3>
                        </div>
                        <div className="border-2 border-slate-900 rounded-lg overflow-hidden bg-slate-50 max-h-[300px] overflow-y-auto">
                          {employees.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 font-medium text-sm">
                              No employees added yet.
                            </div>
                          ) : (
                            <div className="divide-y-2 divide-slate-900">
                              {employees.map((emp) => (
                                <div key={emp._id} className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors text-sm">
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 truncate">{emp.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{emp.employeeId}</p>
                                  </div>
                                  <div className="shrink-0 flex items-center gap-1.5">
                                    {emp.status === "active" ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircle className="h-3 w-3" />
                                        Active
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                        <Clock className="h-3 w-3" />
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="w-full px-2 pt-2 space-y-3">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all whitespace-nowrap"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            )}
            {!isEditing && <SignOutButton />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
