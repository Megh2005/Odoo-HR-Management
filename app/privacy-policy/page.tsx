"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, FileText, Lock, Eye, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "1. Information we collect",
    icon: FileText,
    body:
      "We collect information you provide during sign-up, profile completion, attendance check-ins, organization setup, and resume-based onboarding. This may include your name, email, employee ID, role, avatar, address details, salary-related data, and other profile information needed to provide the HR services in the application.",
  },
  {
    title: "2. How we use your information",
    icon: Eye,
    body:
      "Your information is used to create and manage your account, verify identity, support attendance tracking, organize employees, create salary records, enable profile updates, and provide secure access to your workspace. We may also use your data to improve performance, maintain account security, and customize the experience for your organization.",
  },
  {
    title: "3. Data security",
    icon: Lock,
    body:
      "We apply reasonable technical and organizational safeguards to protect your personal and professional information from unauthorized access, misuse, alteration, or disclosure. Sensitive details such as bank and personal data are treated with extra care and are only shared when required for valid HR operations.",
  },
  {
    title: "4. Sharing of information",
    icon: ShieldCheck,
    body:
      "We do not sell your personal data. Information may be shared only with authorized organization members, service providers who help operate the platform, or legal authorities when required by law or to protect the rights and safety of users.",
  },
  {
    title: "5. Your choices",
    icon: UserCircle,
    body:
      "You may review and update your profile details, manage your account information, and request access to or correction of certain data. If you wish to remove or restrict some information, we may need to limit certain features in order to maintain secure and functional HR operations.",
  },
  {
    title: "6. Updates to this policy",
    icon: FileText,
    body:
      "This privacy policy may be updated from time to time to reflect changes in the platform, legal requirements, or our service practices. Any material changes will be communicated through the application or other appropriate channels so you remain informed.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[30px] border-2 border-slate-900 bg-white/80 p-8 shadow-xl backdrop-blur-sm sm:p-10 lg:p-14"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2">
                <div className="h-2.5 w-2.5 rounded-full bg-sky-900" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-sky-900">
                  Privacy Policy
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Your privacy matters to us.
                </h1>
                <p className="text-lg leading-8 text-slate-600">
                  This policy explains how HRNode collects, protects, uses, and shares your information while you use the platform. We are committed to handling your personal and professional data with care, transparency, and respect.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="rounded-lg border-2 border-slate-900 bg-white px-5 py-3 text-slate-900 shadow-md hover:bg-slate-50">
              <Link href="/about" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to About
              </Link>
            </Button>
          </div>
        </motion.section>

        <div className="grid gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="rounded-[26px] border-2 border-slate-900 bg-white/80 p-7 shadow-lg backdrop-blur-sm sm:p-8"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                    <p className="text-base leading-8 text-slate-600">{section.body}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.35 }}
          className="rounded-[26px] border-2 border-slate-900 bg-slate-900 p-8 text-white shadow-xl"
        >
          <h2 className="text-2xl font-black">Contact us</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-slate-300">
            If you have questions about this privacy policy or how your information is handled, please reach out through the support channels available in the application.
          </p>
        </motion.section>
      </div>
    </div>
  );
}
