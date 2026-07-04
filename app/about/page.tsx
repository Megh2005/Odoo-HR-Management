"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaBrain,
  FaChartLine,
  FaClock,
  FaRocket,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const highlights = [
  {
    icon: FaClock,
    title: "Real-time coordination",
    description:
      "Keep teams aligned with instant attendance insights, smart check-in boundaries, and live workspace updates.",
  },
  {
    icon: FaUsers,
    title: "People-first directory",
    description:
      "Organize employees, manage org structures, and support onboarding with a streamlined HR hub.",
  },
  {
    icon: FaShieldAlt,
    title: "Secure by design",
    description:
      "Protect sensitive profile details and salary information with role-aware access and secure workflows.",
  },
  {
    icon: FaChartLine,
    title: "Actionable analytics",
    description:
      "Turn attendance patterns and workforce data into smart decisions for growth and planning.",
  },
];

const values = [
  {
    icon: FaBrain,
    title: "AI-ready onboarding",
    description:
      "Transform resumes into structured profiles with skill highlights and faster employee setup.",
  },
  {
    icon: FaRocket,
    title: "Built for momentum",
    description:
      "Move from setup to daily operations quickly with a calm, modern experience that feels effortless.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[28px] border-2 border-slate-900 bg-white/80 p-8 shadow-xl backdrop-blur-sm sm:p-10 lg:p-14"
        >
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-900" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-sky-900">
                  About HRNode
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  A smarter workspace for modern HR teams.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  HRNode brings attendance, employee management, onboarding, organization planning,
                  and secure profile handling into one polished experience designed to feel calm,
                  reliable, and fast.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-lg border-2 border-slate-900 bg-sky-900 px-6 py-4 text-white shadow-lg hover:bg-sky-800">
                  <Link href="/auth">
                    <span className="flex items-center gap-2">
                      Get started
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-lg border-2 border-slate-900 bg-white px-6 py-4 text-slate-900 shadow-md hover:bg-slate-50">
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-6 text-white shadow-lg"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
                Why teams use it
              </p>
              <div className="mt-6 space-y-4">
                {[
                  "Simplified workforce visibility",
                  "Secure employee and salary handling",
                  "Faster onboarding and smart profile creation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                    <span className="text-sm font-medium text-slate-100">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        <section className="grid gap-6 lg:grid-cols-2">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <Card className="h-full rounded-[24px] border-2 border-slate-900 bg-white/80 shadow-lg backdrop-blur-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-900">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl text-slate-900">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-7 text-slate-600">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4 }}
          className="rounded-[28px] border-2 border-slate-900 bg-white/80 p-8 shadow-xl backdrop-blur-sm sm:p-10"
        >
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-900">
                What makes it feel different
              </p>
              <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
                Built to keep people work calm and organized.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={value.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">{value.title}</h3>
                    <p className="text-sm leading-7 text-slate-600">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
