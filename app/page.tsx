"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="relative h-screen">
      {/* Hero Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <h1 className="mb-8 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-slate-900 leading-tight">
            Welcome to <span className="text-sky-900">HRNode</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-slate-700 font-semibold font-sans leading-relaxed">
            An all-in-one corporate hub offering real-time organization creation, check-in shift boundaries, pre-registered employee ID allocations, and mandatory AI resume extraction.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="rounded-lg px-6 py-3 font-extrabold bg-sky-900 text-white hover:bg-sky-850 border-2 border-slate-900 shadow-md hover:shadow-lg active:scale-95 transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <span>{session ? "Enter Dashboard" : "Access Workspace"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => router.push("/auth")}
              className="rounded-lg border-2 px-6 py-3 font-extrabold border-slate-900 bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-md hover:shadow-lg active:scale-95 transition-all text-sm cursor-pointer"
            >
              Sign Up Options
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
