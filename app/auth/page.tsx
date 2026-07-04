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
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BackgroundPattern from "@/components/BackgroundPattern";
import OTPInput from "@/components/OTPInput";
import Image from "next/image";

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
            router.push("/dashboard");
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
    signupEmployeeId: "",
    role: "",
    signupAvatar: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = await res.json();
          setOrganizations(data);
        }
      } catch (error) {
        console.error("Failed to fetch organizations", error);
      }
    };
    fetchOrgs();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error("Profile image must be less than 1MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

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
    if (!/[A-Z]/.test(password)) {
      toast.error("Password must contain at least one uppercase letter.");
      return false;
    }
    if (!/[a-z]/.test(password)) {
      toast.error("Password must contain at least one lowercase letter.");
      return false;
    }
    if (!/[0-9]/.test(password)) {
      toast.error("Password must contain at least one number.");
      return false;
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      toast.error("Password must contain at least one special character.");
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
      if (!formData.role) {
        toast.error("Please select a role");
        return;
      }
      if (formData.role === "hr") {
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
      } else {
        // Employee
        if (signupStep === 1) {
          if (!selectedOrgId) {
            toast.error("Please select your organization");
            return;
          }
          if (!validateEmail(formData.signupEmail)) return;
        } else if (signupStep === 3) {
          if (!formData.gender) {
            toast.error("Please select your gender");
            return;
          }
          if (!validatePassword(formData.signupPassword)) return;
        }
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
            body: JSON.stringify({ 
              email: formData.signupEmail,
              name: formData.signupName,
              role: formData.role,
              organizationId: formData.role === "employee" ? selectedOrgId : undefined
            }),
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
        } else if (signupStep === 2) {
          // Step 2: Verify OTP
          if (otp.length !== 8) {
            toast.error("Please enter the complete 8-digit code");
            setLoading(false);
            return;
          }

          if (formData.role === "employee") {
            const promise = fetch("/api/auth/verify-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.signupEmail,
                otp,
                hash: otpHash
              }),
            }).then(async (res) => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "OTP verification failed");
              return data;
            });

            await toast.promise(promise, {
              pending: "Verifying code...",
              success: "Code verified! Please set your password and gender.",
              error: {
                render({ data }: any) {
                  return data?.message || "Invalid OTP code";
                }
              }
            });

            setIsOtpVerified(true);
            setSignupStep(3);
          } else {
            // HR registration
            const promise = (async () => {
              let uploadedAvatarUrl = formData.signupAvatar;

              if (avatarFile) {
                const fileFormData = new FormData();
                fileFormData.append("file", avatarFile);

                const uploadRes = await fetch("/api/upload-image", {
                  method: "POST",
                  body: fileFormData,
                });

                if (!uploadRes.ok) {
                  const uploadData = await uploadRes.json();
                  throw new Error(uploadData.message || "Failed to upload profile image");
                }

                const uploadData = await uploadRes.json();
                uploadedAvatarUrl = uploadData.secure_url;
              }

              const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: formData.signupName,
                  email: formData.signupEmail,
                  password: formData.signupPassword,
                  gender: formData.gender,
                  role: formData.role,
                  avatar: uploadedAvatarUrl,
                  otp,
                  hash: otpHash,
                }),
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.message || "Signup failed");
              return data;
            })();

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
        } else if (signupStep === 3 && formData.role === "employee") {
          // Step 3: Employee finalize setup (Gender, Password, Avatar)
          const promise = (async () => {
            let uploadedAvatarUrl = formData.signupAvatar;

            if (avatarFile) {
              const fileFormData = new FormData();
              fileFormData.append("file", avatarFile);

              const uploadRes = await fetch("/api/upload-image", {
                method: "POST",
                body: fileFormData,
              });

              if (!uploadRes.ok) {
                const uploadData = await uploadRes.json();
                throw new Error(uploadData.message || "Failed to upload profile image");
              }

              const uploadData = await uploadRes.json();
              uploadedAvatarUrl = uploadData.secure_url;
            }

            const res = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: formData.signupEmail,
                password: formData.signupPassword,
                gender: formData.gender,
                role: formData.role,
                avatar: uploadedAvatarUrl,
                otp,
                hash: otpHash,
              }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Activation failed");
            return data;
          })();

          await toast.promise(promise, {
            pending: "Activating account...",
            success: "Account activated successfully!",
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

        router.push("/dashboard");
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
              onClick={() => router.push("/dashboard")}
              className="group w-full rounded-lg px-6 py-3 font-bold bg-sky-900 text-white hover:bg-sky-800 border border-slate-900 shadow-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
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
      <Tabs defaultValue="signin" className="w-full max-w-2xl">
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
              {/* Role selection is ALWAYS visible first at the top */}
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="text-slate-900 font-semibold text-sm"
                >
                  Register As
                </Label>
                <select
                  id="role"
                  className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm appearance-none animate-none"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  disabled={signupStep > 1}
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  <option value="employee">Employee</option>
                  <option value="hr">HR Officer</option>
                </select>
              </div>

              {!formData.role ? (
                <div className="py-8 text-center text-slate-500 font-medium text-sm">
                  Please select your role to start registration.
                </div>
              ) : signupStep === 1 ? (
                <>
                  {/* HR Step 1 Form */}
                  {formData.role === "hr" && (
                    <>
                      {avatarPreview && (
                        <div className="flex justify-center mb-6">
                          <div className="relative h-28 w-28 rounded-full border-4 border-slate-900 overflow-hidden shadow-lg bg-slate-100">
                            <Image
                              src={avatarPreview}
                              alt="Avatar Preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            htmlFor="signupPassword"
                            className="text-slate-900 font-medium"
                          >
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="signupPassword"
                              type={showPassword ? "text" : "password"}
                              className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white w-full"
                              value={formData.signupPassword}
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
                        <div className="space-y-2">
                          <Label
                            htmlFor="gender"
                            className="text-slate-900 font-medium"
                          >
                            Gender
                          </Label>
                          <select
                            id="gender"
                            className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm appearance-none"
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
                          <Label className="text-slate-900 font-medium">Profile Image</Label>
                          <label
                            htmlFor="signupAvatarFile"
                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 hover:shadow-sm cursor-pointer transition-all gap-1.5"
                          >
                            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center border border-slate-900 text-sky-900 shrink-0">
                              <Upload className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                              {avatarFile ? avatarFile.name : "Choose profile image..."}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              PNG, JPG up to 1MB
                            </span>
                          </label>
                          <input
                            id="signupAvatarFile"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          {avatarFile && (
                            <p className="text-xs text-emerald-600 font-semibold text-center mt-1 flex items-center justify-center gap-1">✓ Profile image selected</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Employee Step 1 Form */}
                  {formData.role === "employee" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="orgDropdown"
                          className="text-slate-900 font-medium"
                        >
                          Select Organization
                        </Label>
                        <select
                          id="orgDropdown"
                          className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm appearance-none"
                          value={selectedOrgId}
                          onChange={(e) => setSelectedOrgId(e.target.value)}
                        >
                          <option value="" disabled>
                            Choose your company...
                          </option>
                          {organizations.map((org) => (
                            <option key={org._id} value={org._id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="signupEmail"
                          className="text-slate-900 font-medium"
                        >
                          Email Address
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
                    </div>
                  )}
                </>
              ) : signupStep === 2 ? (
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
              ) : (
                /* Step 3 (Only Employee - Settle Gender and Password) */
                <div className="space-y-4">
                  <div className="text-center pb-2 border-b border-slate-900">
                    <h3 className="text-lg font-bold text-slate-900">Settle Up Your Credentials</h3>
                    <p className="text-xs text-slate-500">Secure your newly validated employee account</p>
                  </div>
                  {avatarPreview && (
                    <div className="flex justify-center mb-6">
                      <div className="relative h-28 w-28 rounded-full border-4 border-slate-900 overflow-hidden shadow-lg bg-slate-100">
                        <Image
                          src={avatarPreview}
                          alt="Avatar Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="signupPassword"
                        className="text-slate-900 font-medium"
                      >
                        Set Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signupPassword"
                          type={showPassword ? "text" : "password"}
                          className="border-2 border-slate-900 focus-visible:ring-0 focus-visible:border-sky-900 rounded-lg bg-white w-full"
                          value={formData.signupPassword}
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
                    <div className="space-y-2">
                      <Label
                        htmlFor="gender"
                        className="text-slate-900 font-medium"
                      >
                        Gender
                      </Label>
                      <select
                        id="gender"
                        className="w-full border-2 border-slate-900 focus:border-sky-900 rounded-lg bg-white h-10 px-3 outline-none font-medium transition-all text-sm appearance-none"
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
                      <Label className="text-slate-900 font-medium">Profile Image (Optional)</Label>
                      <label
                        htmlFor="employeeAvatarFile"
                        className="flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 hover:shadow-sm cursor-pointer transition-all gap-1.5"
                      >
                        <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center border border-slate-900 text-sky-900 shrink-0">
                          <Upload className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-xs">
                          {avatarFile ? avatarFile.name : "Choose profile image..."}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          PNG, JPG up to 1MB
                        </span>
                      </label>
                      <input
                        id="employeeAvatarFile"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      {avatarFile && (
                        <p className="text-xs text-emerald-600 font-semibold text-center mt-1 flex items-center justify-center gap-1">✓ Profile image selected</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {formData.role && (
                <button
                  onClick={() => handleAuth("signup")}
                  disabled={loading}
                  className="w-full rounded-lg px-4 py-3 font-semibold bg-sky-900 text-white hover:bg-sky-800 border-2 border-slate-900 hover:shadow-md transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {signupStep === 1
                    ? "Get Verification Code"
                    : signupStep === 2
                    ? (formData.role === "employee" ? "Verify Code" : "Verify & Create Account")
                    : "Complete Registration"}
                </button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
