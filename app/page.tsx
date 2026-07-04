"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowRight, 
  Users, 
  Clock, 
  Zap, 
  Shield,
  CheckCircle2,
  BarChart3,
  GitBranch
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const features = [
    {
      icon: Clock,
      title: "Real-Time Check-Ins",
      description: "Smart shift boundaries and attendance tracking with instant notifications"
    },
    {
      icon: Users,
      title: "Employee Directory",
      description: "Centralized workforce hub with organization management and quick access"
    },
    {
      icon: Zap,
      title: "AI Resume Extraction",
      description: "Automatic profile generation from resumes with skills and highlights"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Bank details and personal info stored securely with role-based access"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track attendance patterns, salary structures, and workforce metrics"
    },
    {
      icon: GitBranch,
      title: "Employee Onboarding",
      description: "Pre-registration and automatic ID allocation for new hires"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-20">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Logo/Brand */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-200 mb-4">
              <div className="w-2 h-2 rounded-full bg-sky-900"></div>
              <span className="text-xs font-bold text-sky-900 tracking-widest uppercase">Smart Workspace Hub</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-tight">
                Manage Your Workforce with <br />
                <span className="bg-gradient-to-r from-sky-900 to-sky-700 bg-clip-text text-transparent">
                  HRNode
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                An all-in-one HR platform with real-time check-ins, employee directories, AI-powered onboarding, and secure data management.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-white bg-sky-900 hover:bg-sky-800 border-2 border-slate-900 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
              >
                <span>{session ? "Go to Dashboard" : "Get Started"}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => router.push("/auth")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-slate-900 bg-white border-2 border-slate-900 hover:bg-slate-50 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
              >
                <span>Learn More</span>
              </button>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-1 text-sm text-slate-500 pt-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Trusted by growing organizations</span>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900">
                Powerful Features
              </h2>
              <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
                Everything you need to manage your workforce efficiently and securely
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="group p-6 rounded-xl border-2 border-slate-900 bg-white/80 hover:bg-sky-50/80 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center group-hover:bg-sky-900 group-hover:border-sky-900 transition-all duration-200">
                        <Icon className="w-6 h-6 text-sky-900 group-hover:text-white transition-all duration-200" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-slate-900 mb-2 text-lg">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border-2 border-slate-900 bg-white/80 backdrop-blur-sm p-12 text-center shadow-lg">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
                Ready to Transform Your HR?
              </h2>
              <p className="text-lg text-slate-600 font-medium mb-8 max-w-2xl mx-auto">
                Join hundreds of organizations using HRNode to streamline their workforce management.
              </p>
              <button 
                onClick={() => router.push("/auth")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-white bg-sky-900 hover:bg-sky-800 border-2 border-slate-900 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
