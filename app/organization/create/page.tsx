"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackgroundPattern from "@/components/BackgroundPattern";
import Image from "next/image";
import { Upload, ArrowLeft, Search, MapPin, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { Country, State, City } from "country-state-city";

export default function CreateOrganization() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgLogoPreview, setOrgLogoPreview] = useState("");
  const [orgLogoFile, setOrgLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Country State City selection states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");

  // Google Places Autocomplete states
  const [addressInput, setAddressInput] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated" && session?.user?.role !== "hr") {
      router.push("/profile");
    } else if (status === "authenticated" && (session?.user as any)?.organizationId) {
      router.push("/organization/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    // Populate all countries on mount
    setCountries(Country.getAllCountries());
  }, []);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setSelectedStateCode("");
    setSelectedCityName("");
    setStates(State.getStatesOfCountry(countryCode));
    setCities([]);
  };

  const handleStateChange = (stateCode: string) => {
    setSelectedStateCode(stateCode);
    setSelectedCityName("");
    setCities(City.getCitiesOfState(selectedCountryCode, stateCode));
  };

  const handleAddressInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setAddressInput(input);

    if (!input.trim()) {
      setPredictions([]);
      return;
    }

    try {
      const res = await fetch(`/api/maps/autocomplete?input=${encodeURIComponent(input)}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions || []);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error("Failed to fetch address suggestions", error);
    }
  };

  const handlePredictionSelect = async (p: any) => {
    setAddressInput(p.description);
    setOrgAddress(p.description);
    setPredictions([]);
    setShowAutocomplete(false);

    try {
      const res = await fetch(`/api/maps/details?placeId=${p.place_id}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.result?.formatted_address) {
          setOrgAddress(data.result.formatted_address);
          setAddressInput(data.result.formatted_address);
        }
      }
    } catch (error) {
      console.error("Failed to fetch place details", error);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      toast.error("Organization Name is required");
      return;
    }

    const countryObj = countries.find(c => c.isoCode === selectedCountryCode);
    const stateObj = states.find(s => s.isoCode === selectedStateCode);

    const countryName = countryObj ? countryObj.name : "";
    const stateName = stateObj ? stateObj.name : "";
    const cityName = selectedCityName;

    if (!countryName || !stateName || !cityName) {
      toast.error("Please specify office Country, State, and City location details");
      return;
    }

    if (!orgAddress.trim()) {
      toast.error("Please pick a valid Google Maps address suggestion");
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

      const res = await fetch("/api/organization/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          logo: uploadedLogoUrl,
          address: orgAddress.trim(),
          additionalInfo: {
            "Country": countryName,
            "State": stateName,
            "City": cityName
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Organization created successfully!");
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
            <p className="text-xs font-semibold text-slate-500 mt-1 font-sans">Set up your workspace and identity details</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Header profile uploader panel */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border-2 border-slate-900 rounded-lg">
                <div className="relative h-24 w-24 rounded-xl border-2 border-slate-900 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow">
                  {orgLogoPreview ? (
                    <Image
                      src={orgLogoPreview}
                      alt="Logo Preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <Label className="text-slate-900 font-bold text-sm">Company Logo</Label>
                  <p className="text-[11px] text-slate-500 font-medium mb-1">Upload your official brand logo (under 1MB)</p>
                  <label
                    htmlFor="orgLogoFileUploader"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <Upload size={14} />
                    {orgLogoFile ? "Change Logo" : "Choose Logo Image"}
                  </label>
                  <input
                    id="orgLogoFileUploader"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleOrgLogoChange}
                  />
                  {orgLogoFile && (
                    <span className="block text-[11px] text-emerald-600 font-bold mt-1">✓ Selected: {orgLogoFile.name}</span>
                  )}
                </div>
              </div>

              {/* Organization name field */}
              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-slate-900 font-bold text-sm">
                  Organization Name
                </Label>
                <Input
                  id="orgName"
                  placeholder="e.g. Acme Corp"
                  className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white h-11"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>

              {/* Country State City selection fields */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Office Location Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="countrySelect" className="text-slate-900 font-bold text-xs">Country</Label>
                    <select
                      id="countrySelect"
                      className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-11 px-3 outline-none font-bold text-xs appearance-none"
                      value={selectedCountryCode}
                      onChange={(e) => handleCountryChange(e.target.value)}
                    >
                      <option value="">Choose Country</option>
                      {countries.map((c) => (
                        <option key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateSelect" className="text-slate-900 font-bold text-xs">State</Label>
                    <select
                      id="stateSelect"
                      className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-11 px-3 outline-none font-bold text-xs appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                      value={selectedStateCode}
                      onChange={(e) => handleStateChange(e.target.value)}
                      disabled={!selectedCountryCode}
                    >
                      <option value="">Choose State</option>
                      {states.map((s) => (
                        <option key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citySelect" className="text-slate-900 font-bold text-xs">City</Label>
                    <select
                      id="citySelect"
                      className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-11 px-3 outline-none font-bold text-xs appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                      value={selectedCityName}
                      onChange={(e) => setSelectedCityName(e.target.value)}
                      disabled={!selectedStateCode}
                    >
                      <option value="">Choose City</option>
                      {cities.map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Office Address Auto-complete and Map Preview */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="space-y-2 relative">
                  <Label htmlFor="addressAutocomplete" className="text-slate-900 font-bold text-sm">
                    Office Address (Google Places Auto-complete)
                  </Label>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                    <Input
                      id="addressAutocomplete"
                      placeholder="Start typing your office address..."
                      className="border-2 border-slate-900 bg-white pl-9 h-11"
                      value={addressInput}
                      onChange={handleAddressInputChange}
                      onFocus={() => setShowAutocomplete(true)}
                    />
                  </div>

                  {showAutocomplete && predictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border-2 border-slate-900 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {predictions.map((p) => (
                        <button
                          key={p.place_id}
                          type="button"
                          className="w-full text-left p-3 hover:bg-sky-50 transition-colors text-xs font-semibold text-slate-800 flex items-start gap-2"
                          onClick={() => handlePredictionSelect(p)}
                        >
                          <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                          <span>{p.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {orgAddress && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-bold text-slate-500">Google Maps Preview</Label>
                    <div className="border-2 border-slate-900 rounded-lg overflow-hidden h-[250px] w-full shadow bg-slate-100">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY}&q=${encodeURIComponent(orgAddress)}`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all h-12 disabled:opacity-70 disabled:cursor-not-allowed"
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
