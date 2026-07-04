"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import BackgroundPattern from "@/components/BackgroundPattern";
import {
  ArrowLeft,
  Mail,
  User as UserIcon,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  // Handlers
  const handleVerify = async () => {
    if (!name || !email) {
      toast.error("Please enter both name and email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Password reset email sent! Please check your inbox. If you don't see it, check your spam folder.");
      router.push("/auth");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <BackgroundPattern />

      <Card className="w-full max-w-[400px] border-2 border-slate-900 shadow-md rounded-xl bg-white/95 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center pt-10">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-slate-600">
            Enter your details to verify your identity. We'll email you a secure link to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-900 font-medium flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Name
            </Label>
            <Input
              placeholder="Enter your full name"
              className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-900 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </Label>
            <Input
              type="email"
              placeholder="Enter your email"
              className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full rounded-lg px-4 py-3 font-medium bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <div className="text-center pt-2">
            <button
              onClick={() => router.push("/auth")}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
