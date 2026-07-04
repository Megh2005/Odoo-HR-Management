"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, LogIn, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DockNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const navItems = [
    {
      name: "Home",
      icon: Home,
      href: "/",
      show: true,
    },
    {
      name: "Profile",
      icon: User,
      href: "/profile",
      show: status === "authenticated",
    },
    {
      name: "Sign Up",
      icon: LogIn,
      href: "/auth",
      show: status === "unauthenticated",
    },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border-2 border-slate-900 shadow-xl dark:bg-black/80 dark:border-slate-100">
        {navItems.map((item, index) => {
          if (!item.show) return null;
          const isActive = pathname === item.href;

          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <DockItem item={item} isActive={isActive} isButton={false} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {status === "authenticated" && (
          <>
            <div className="w-[2px] h-6 bg-black dark:bg-white mx-2" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => signOut()}>
                  <DockItem
                    item={{ name: "Logout", icon: LogOut }}
                    isActive={false}
                    isButton
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}

function DockItem({
  item,
  isActive,
  isButton = false,
}: {
  item: any;
  isActive: boolean;
  isButton?: boolean;
}) {
  const Icon = item.icon;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div
        whileHover={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "p-3 rounded-full transition-colors",
          isActive
            ? "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          isButton &&
            "text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
        )}
      >
        <Icon size={24} />
      </motion.div>
      {isActive && (
        <motion.div
          layoutId="activeDot"
          className="absolute -bottom-1 w-1 h-1 rounded-full bg-sky-900 dark:bg-sky-400"
        />
      )}
    </div>
  );
}
