"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BackgroundPattern from "@/components/BackgroundPattern";
import OTPInput from "@/components/OTPInput";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/profile");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, router]);
  const [formData, setFormData] = useState({
    signinEmail: "",
    signinPassword: "",
    signupName: "",
    signupEmail: "",
    signupPassword: "",
    gender: "",
  });

  const [signupStep, setSignupStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [otpHash, setOtpHash] = useState("");

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value && !value.endsWith("@gmail.com")) {
      toast.error("Please enter a valid Gmail address");
    }
  };

  const validateEmail = (email: string) => {
    if (!email || !email.endsWith("@gmail.com")) {
      toast.error("Please enter a valid Gmail address");
      return false;
    }
    return true;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }
    if (password.length > 14) {
      toast.error("Password must be at most 14 characters long.");
      return false;
    }
    return true;
  };

  const handleAuth = async (action: "signin" | "signup") => {
    if (loading) return;

    if (action === "signin") {
      if (!validateEmail(formData.signinEmail)) return;
      if (!validatePassword(formData.signinPassword)) return;
    } else {
      if (!formData.signupName) {
        toast.error("Name is required");
        return;
      }
      if (!validateEmail(formData.signupEmail)) return;
      if (!validatePassword(formData.signupPassword)) return;
      if (!formData.gender) {
        toast.error("Please select your gender");
        return;
      }
    }

    setLoading(true);

    try {
      if (action === "signup") {
        if (signupStep === 1) {
          // Step 1: Send OTP
          const promise = fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.signupEmail }),
          }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to send OTP");
            setOtpHash(data.hash); // Store the hash
            return data;
          });

          await toast.promise(promise, {
            pending: "Sending verification code...",
            success: "Verification code sent!",
            error: {
              render({ data }: any) {
                return data?.message || "Something went wrong";
              },
            },
          });

          setSignupStep(2);
        } else {
          // Step 2: Verify and Signup
          if (otp.length !== 8) {
            toast.error("Please enter the complete 8-digit code");
            setLoading(false);
            return;
          }

          const promise = fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.signupName,
              email: formData.signupEmail,
              password: formData.signupPassword,
              gender: formData.gender,
              otp,
              hash: otpHash, // Send the hash for verification
            }),
          }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Signup failed");
            return data;
          });

          await toast.promise(promise, {
            pending: "Creating account...",
            success: "Account created successfully!",
            error: {
              render({ data }: any) {
                return data?.message || "Something went wrong";
              },
            },
          });

          window.location.reload();
        }
      } else {
        // Sign In
        const promise = signIn("credentials", {
          redirect: false,
          email: formData.signinEmail,
          password: formData.signinPassword,
        }).then((res) => {
          if (res?.error) throw new Error(res.error);
          return res;
        });

        await toast.promise(promise, {
          pending: "Signing in...",
          success: "Signed in successfully!",
          error: "Invalid credentials",
        });

        router.push("/profile");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <BackgroundPattern />
        <Card className="w-full max-w-[400px] border border-slate-200 shadow-2xl rounded-2xl bg-white overflow-hidden relative">
          {/* Professional Success Header */}
          <div className="h-16 bg-emerald-600 flex items-center justify-center px-6 border-b border-emerald-500">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold tracking-tight text-lg">
                Access Authorized
              </span>
            </div>
          </div>

          <CardContent className="pt-12 pb-10 px-8 flex flex-col items-center text-center">
            <div className="mb-6 rounded-full bg-emerald-50 p-5 border border-emerald-100 shadow-inner">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <p className="text-slate-500 font-medium mb-8 text-lg px-4">
              You are currently authenticated as{" "}
              <span className="text-sky-900 font-bold">
                {session?.user?.name || "User"}
              </span>
              .
            </p>

            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl p-5 mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Automatic Redirection
              </p>
              <div className="flex items-baseline justify-center gap-1.5 mb-4">
                <span className="text-4xl font-bold text-sky-900">
                  {countdown}
                </span>
              </div>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-900 transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 20) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => router.push("/profile")}
              className="group w-full rounded-lg px-6 py-3 font-bold bg-sky-900 text-white hover:bg-sky-800 border border-slate-900 shadow-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              Go to Profile
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <BackgroundPattern />
      <Tabs defaultValue="signin" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-transparent gap-4">
          <TabsTrigger
            value="signin"
            className="rounded-lg border-2 border-slate-900 bg-white data-[state=active]:bg-sky-900 data-[state=active]:text-white hover:bg-slate-50 transition-all shadow-sm"
          >
            Sign In
          </TabsTrigger>
          <TabsTrigger
            value="signup"
            className="rounded-lg border-2 border-slate-900 bg-white data-[state=active]:bg-sky-900 data-[state=active]:text-white hover:bg-slate-50 transition-all shadow-sm"
          >
            Sign Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <Card className="border-2 border-slate-900 shadow-md rounded-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-600">
                Enter your credentials to access your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="signinEmail"
                  className="text-slate-900 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="signinEmail"
                  type="email"
                  placeholder="name@example.com"
                  className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
                  value={formData.signinEmail}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="signinPassword"
                  className="text-slate-900 font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signinPassword"
                    type={showPassword ? "text" : "password"}
                    className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
                    value={formData.signinPassword}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/auth/forgot-password")}
                  className="text-sm font-medium text-sky-900 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                onClick={() => handleAuth("signin")}
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 font-medium bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Sign In
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signup">
          <Card className="border-2 border-slate-900 shadow-md rounded-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Create Account
              </CardTitle>
              <CardDescription className="text-slate-600">
                Join us to start building amazing projects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {signupStep === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signupName"
                      className="text-slate-900 font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="signupName"
                      placeholder="John Doe"
                      className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
                      value={formData.signupName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signupEmail"
                      className="text-slate-900 font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="name@example.com"
                      className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
                      value={formData.signupEmail}
                      onChange={handleInputChange}
                      onBlur={handleEmailBlur}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="gender"
                      className="text-slate-900 font-medium"
                    >
                      Gender
                    </Label>
                    <select
                      id="gender"
                      className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-9 px-3 outline-none font-medium transition-all text-sm appearance-none"
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          gender: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select Gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non binary">Non Binary</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signupPassword"
                      className="text-slate-900 font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white"
                        value={formData.signupPassword}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="rounded-full bg-sky-100 w-12 h-12 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6 text-sky-900" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-900 font-semibold text-lg">
                        Verify Email
                      </Label>
                      <p className="text-sm text-slate-500">
                        Enter the 8-digit code sent to{" "}
                        <span className="font-bold text-slate-900">
                          {formData.signupEmail}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="py-2">
                    <OTPInput length={8} onComplete={(code) => setOtp(code)} />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => setSignupStep(1)}
                      className="text-sm text-slate-500 hover:text-sky-900 font-medium underline"
                    >
                      Change Email
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleAuth("signup")}
                disabled={loading}
                className="w-full rounded-lg px-4 py-3 font-medium bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {signupStep === 1
                  ? "Get Verification Code"
                  : "Verify & Create Account"}
              </button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
