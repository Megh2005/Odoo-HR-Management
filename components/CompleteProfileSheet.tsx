"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { indianStatesAndCities } from "@/lib/states";
import { validatePincode } from "@/lib/pincode-validator";
import { useSession } from "next-auth/react";
import { AlertCircle } from "lucide-react";

interface CompleteProfileSheetProps {
  userData: any;
  onUpdate: () => void;
}

export default function CompleteProfileSheet({
  userData,
  onUpdate,
}: CompleteProfileSheetProps) {
  const { data: session, update: updateSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    state: userData?.state || "",
    city: userData?.city || "",
    pincode: userData?.pincode || "",
  });

  const availableStates = Object.keys(indianStatesAndCities).sort();
  const availableCities = formData.state
    ? (indianStatesAndCities[formData.state] || []).sort()
    : [];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [id]: value };

      // Reset dependent fields
      if (id === "state") {
        newData.city = "";
        newData.pincode = "";
      } else if (id === "city") {
        newData.pincode = "";
      }

      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!formData.state || !formData.city || !formData.pincode) {
      toast.error("Please fill all fields");
      return;
    }

    const validation = validatePincode(
      formData.state,
      formData.city,
      formData.pincode,
    );

    if (!validation.isValid) {
      toast.error(validation.message || "Invalid Pincode");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      await updateSession(); // Update session
      onUpdate();
      toast.success("Profile updated successfully!");
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Sync form data with userData when it changes
  useEffect(() => {
    if (userData) {
      setFormData({
        state: userData.state || "",
        city: userData.city || "",
        pincode: userData.pincode || "",
      });
    }
  }, [userData]);

  const isProfileIncomplete = userData && !userData.isAddressUpdated;

  if (!isProfileIncomplete) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold bg-rose-600 text-white hover:bg-rose-700 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all whitespace-nowrap">
          <AlertCircle className="h-4 w-4" />
          Complete Profile
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-2xl font-bold text-slate-900">
            Complete Your Profile
          </SheetTitle>
          <SheetDescription className="text-slate-500">
            Please provide your address details to complete your registration.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6 pt-2">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="state" className="text-slate-900 font-semibold">
                State
              </Label>
              <select
                id="state"
                className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white focus:border-slate-900 outline-none transition-all"
                value={formData.state}
                onChange={handleInputChange}
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
              <Label htmlFor="city" className="text-slate-900 font-semibold">
                City
              </Label>
              <select
                id="city"
                className="w-full border-2 border-slate-200 rounded-lg p-2.5 bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:border-slate-900 outline-none transition-all"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!formData.state}
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
              <Label htmlFor="pincode" className="text-slate-900 font-semibold">
                Pincode
              </Label>
              <Input
                id="pincode"
                placeholder="123456"
                maxLength={6}
                value={formData.pincode}
                onChange={handleInputChange}
                className="border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-slate-900 rounded-lg bg-white h-11 disabled:bg-slate-100 disabled:text-slate-400"
                disabled={!formData.city}
              />
              <p className="text-xs text-slate-500 font-medium">
                Enter a valid 6-digit pincode for your city.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              className="flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-semibold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md active:shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Details"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
