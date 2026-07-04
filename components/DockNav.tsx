"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MdHome, MdDashboard, MdPerson, MdBusiness, MdGroup, MdLogin, MdLogout, MdInfo, MdLock } from "react-icons/md";

export default function DockNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isHR = session?.user?.role === "hr";
  const hasOrg = !!(session?.user as any)?.organizationId;

  const navItems = [
    {
      name: "Home",
      icon: MdHome,
      href: "/",
      show: true,
    },
    {
      name: "Dashboard",
      icon: MdDashboard,
      href: "/dashboard",
      show: status === "authenticated",
    },
    {
      name: "About",
      icon: MdInfo,
      href: "/about",
      show: true,
    },
    {
      name: "Privacy",
      icon: MdLock,
      href: "/privacy-policy",
      show: true,
    },
    {
      name: "Employees",
      icon: MdGroup,
      href: "/employees",
      show: status === "authenticated" && isHR,
    },
    {
      name: hasOrg ? "Org Dashboard" : (isHR ? "Create Org" : "Organization"),
      icon: MdBusiness,
      href: hasOrg ? "/organization/dashboard" : (isHR ? "/organization/create" : "/organization/dashboard"),
      show: status === "authenticated",
    },
    {
      name: "Sign Up",
      icon: MdLogin,
      href: "/auth",
      show: status === "unauthenticated",
    },
  ];

  const authItems = [
    {
      name: "Profile",
      icon: MdPerson,
      href: "/profile",
      show: status === "authenticated",
    },
    {
      name: "Logout",
      icon: MdLogout,
      href: "#",
      show: status === "authenticated",
      isLogout: true,
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-3 rounded-full border-2 border-slate-900 shadow-2xl">
        {/* Main Navigation Items */}
        <div className="flex items-center gap-2">
          {navItems.map((item, index) => {
            if (!item.show) return null;
            const isActive = pathname === item.href;

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <DockItem item={item} isActive={isActive} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-bold text-xs">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Vertical Separator */}
        {status === "authenticated" && (
          <div className="w-[1.5px] h-8 bg-slate-300 mx-1" />
        )}

        {/* Auth Items (Profile + Logout) */}
        <div className="flex items-center gap-2">
          {authItems.map((item) => {
            if (!item.show) return null;

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  {item.isLogout ? (
                    <button type="button" aria-label="Logout" onClick={() => signOut()}>
                      <DockItem item={item} isActive={false} isLogout={true} />
                    </button>
                  ) : (
                    <Link href={item.href}>
                      <DockItem item={item} isActive={pathname === item.href} />
                    </Link>
                  )}
                </TooltipTrigger>
                <TooltipContent side="top" className="font-bold text-xs">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DockItem({
  item,
  isActive,
  isLogout = false,
}: {
  item: any;
  isActive: boolean;
  isLogout?: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "p-2.5 rounded-lg transition-all duration-200",
          isActive
            ? "bg-sky-100 text-sky-900 border border-sky-300"
            : "text-slate-600 hover:text-sky-900 hover:bg-sky-50",
          isLogout &&
            "text-red-500 hover:text-red-700 hover:bg-red-50 border hover:border-red-300",
        )}
      >
        <Icon size={20} />
      </motion.div>
      {isActive && !isLogout && (
        <motion.div
          layoutId="activeDot"
          className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-sky-900"
        />
      )}
    </div>
  );
}
