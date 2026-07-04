"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackgroundPattern from "@/components/BackgroundPattern";
import Image from "next/image";
import { Plus, Trash2, Upload, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

export default function CreateOrganization() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgFields, setOrgFields] = useState<{ key: string; value: string }[]>([]);
  const [orgLogoPreview, setOrgLogoPreview] = useState("");
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated" && session?.user?.role !== "hr") {
      router.push("/profile");
    } else if (status === "authenticated" && (session?.user as any)?.organizationId) {
      router.push("/organization/dashboard");
    }
  }, [status, session, router]);

  const handleOrgLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Logo must be less than 1MB");
      return;
    }

    setOrgLogoFile(file);
    setOrgLogoPreview(URL.createObjectURL(file));
  };

  const addOrgField = () => {
    setOrgFields([...orgFields, { key: "", value: "" }]);
  };

  const removeOrgField = (index: number) => {
    setOrgFields(orgFields.filter((_, idx) => idx !== index));
  };

  const updateOrgField = (index: number, field: "key" | "value", value: string) => {
    setOrgFields(orgFields.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization Name is required");
      return;
    }

    setLoading(true);
    try {
      let uploadedLogoUrl = "";

      if (orgLogoFile) {
        const fileFormData = new FormData();
        fileFormData.append("file", orgLogoFile);

        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload organization logo");
        }

        const uploadData = await uploadRes.json();
        uploadedLogoUrl = uploadData.secure_url;
      }

      // Convert additional custom fields key-value array to Map object
      const additionalInfo: Record<string, string> = {};
      for (const field of orgFields) {
        if (field.key.trim() && field.value.trim()) {
          additionalInfo[field.key.trim()] = field.value.trim();
        }
      }

      const res = await fetch("/api/organization/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          logo: uploadedLogoUrl,
          address: orgAddress.trim(),
          additionalInfo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Organization created successfully!");
        // Refresh next-auth session with updated organizationId
        await update();
        router.push("/organization/dashboard");
      } else {
        toast.error(data.message || "Failed to create organization");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-12 px-4 md:px-8 pb-32">
      <BackgroundPattern />
      <div className="w-full max-w-2xl space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-sky-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <Card className="border-2 border-slate-900 shadow-md rounded-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-2 border-b-2 border-slate-900">
            <CardTitle className="text-2xl font-bold text-slate-900">
              Create Your Organization
            </CardTitle>
            <p className="text-xs font-semibold text-slate-500 mt-1">Set up your workspace and establish identity details</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {orgLogoPreview && (
                <div className="flex justify-center mb-4">
                  <div className="relative h-28 w-28 rounded-full border-4 border-slate-900 overflow-hidden shadow-lg bg-slate-100">
                    <Image
                      src={orgLogoPreview}
                      alt="Logo Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-slate-900 font-semibold text-sm">
                    Organization Name
                  </Label>
                  <Input
                    id="orgName"
                    placeholder="e.g. Acme Corp"
                    className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgAddress" className="text-slate-900 font-semibold text-sm">
                    Address
                  </Label>
                  <Input
                    id="orgAddress"
                    placeholder="e.g. 123 Main St, New York"
                    className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-900 font-semibold text-sm">Company Logo</Label>
                <label
                  htmlFor="orgLogoFileUploader"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-lg p-5 bg-slate-50 hover:bg-slate-100 hover:shadow-sm cursor-pointer transition-all gap-1.5"
                >
                  <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center border border-slate-900 text-sky-900 shrink-0">
                    <Upload className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                    {orgLogoFile ? orgLogoFile.name : "Choose company logo..."}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    PNG, JPG up to 1MB
                  </span>
                </label>
                <input
                  id="orgLogoFileUploader"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleOrgLogoChange}
                />
              </div>

              {/* Custom Attributes Fields Section */}
              <div className="space-y-3 pt-4 border-t-2 border-dashed border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-900 font-bold text-sm">Custom Attributes / Specifications</Label>
                  <button
                    type="button"
                    onClick={addOrgField}
                    className="flex items-center gap-1 text-xs font-bold bg-sky-100 hover:bg-sky-200 text-sky-900 border border-slate-900 px-2 py-1 rounded-md transition-all active:scale-95"
                  >
                    <Plus size={14} /> Add Attribute
                  </button>
                </div>

                {orgFields.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 italic text-center py-2">No custom attributes added yet. Add items like GSTIN, Industry type, etc.</p>
                ) : (
                  <div className="space-y-3">
                    {orgFields.map((field, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Input
                          placeholder="Attribute Label (e.g. GSTIN)"
                          className="flex-1 border-2 border-slate-900 bg-white"
                          value={field.key}
                          onChange={(e) => updateOrgField(index, "key", e.target.value)}
                        />
                        <Input
                          placeholder="Value (e.g. 29AAAAA1111A1Z1)"
                          className="flex-1 border-2 border-slate-900 bg-white"
                          value={field.value}
                          onChange={(e) => updateOrgField(index, "value", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeOrgField(index)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg border border-slate-900 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Organization..." : "Create Organization"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
