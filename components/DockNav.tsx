"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MdHome, 
  MdDashboard, 
  MdPerson, 
  MdBusiness, 
  MdGroup, 
  MdLogin, 
  MdLogout, 
  MdInfo, 
  MdLock,
  MdMenu,
  MdClose
} from "react-icons/md";

export default function DockNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isHR = session?.user?.role === "hr";
  const hasOrg = !!(session?.user as any)?.organizationId;

  // Organized nav items with logical grouping
  const mainNavItems = [
    {
      name: "Home",
      icon: MdHome,
      href: "/",
      show: true,
      group: "main",
    },
    {
      name: "Dashboard",
      icon: MdDashboard,
      href: "/dashboard",
      show: status === "authenticated",
      group: "main",
    },
    {
      name: "Employees",
      icon: MdGroup,
      href: "/employees",
      show: status === "authenticated" && isHR,
      group: "hr",
    },
    {
      name: hasOrg ? "Org Dashboard" : (isHR ? "Create Org" : "Organization"),
      icon: MdBusiness,
      href: hasOrg ? "/organization/dashboard" : (isHR ? "/organization/create" : "/organization/dashboard"),
      show: status === "authenticated",
      group: "org",
    },
  ];

  const infoNavItems = [
    {
      name: "About",
      icon: MdInfo,
      href: "/about",
      show: true,
      group: "info",
    },
    {
      name: "Privacy",
      icon: MdLock,
      href: "/privacy-policy",
      show: true,
      group: "info",
    },
  ];

  const authItems = [
    {
      name: "Profile",
      icon: MdPerson,
      href: "/profile",
      show: status === "authenticated",
      group: "auth",
    },
    {
      name: "Sign In",
      icon: MdLogin,
      href: "/auth",
      show: status === "unauthenticated",
      group: "auth",
    },
    {
      name: "Logout",
      icon: MdLogout,
      href: "#",
      show: status === "authenticated",
      group: "auth",
      isLogout: true,
    },
  ];

  const allItems = [...mainNavItems, ...infoNavItems, ...authItems];
  const visibleItems = allItems.filter(item => item.show);

  return (
    <>
      {/* Desktop Navigation - Bottom Dock */}
      <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-3 rounded-full border-2 border-slate-900 shadow-2xl">
          
          {/* Main Navigation Items */}
          <div className="flex items-center gap-1">
            {mainNavItems.map((item) => {
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

          {/* Separator 1 */}
          {mainNavItems.some(item => item.show) && infoNavItems.some(item => item.show) && (
            <div className="w-[1.5px] h-8 bg-slate-300 mx-0.5" />
          )}

          {/* Info Navigation Items */}
          <div className="flex items-center gap-1">
            {infoNavItems.map((item) => {
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

          {/* Separator 2 */}
          {status === "authenticated" && (
            <div className="w-[1.5px] h-8 bg-slate-300 mx-0.5" />
          )}

          {/* Auth Items (Profile + Logout) */}
          <div className="flex items-center gap-1">
            {authItems.map((item) => {
              if (!item.show) return null;

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {item.isLogout ? (
                      <button 
                        type="button" 
                        aria-label="Logout" 
                        onClick={() => signOut()}
                        className="cursor-pointer"
                      >
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

      {/* Mobile Navigation - Hamburger Menu */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 rounded-full bg-white/90 backdrop-blur-md border-2 border-slate-900 shadow-2xl hover:bg-sky-50 transition-all"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-md border-2 border-slate-900 rounded-2xl shadow-2xl overflow-hidden min-w-max"
            >
              {/* Main Navigation Section */}
              <div className="flex flex-col">
                {mainNavItems.map((item) => {
                  if (!item.show) return null;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors",
                        isActive
                          ? "bg-sky-100 text-sky-900"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Separator */}
              {mainNavItems.some(item => item.show) && infoNavItems.some(item => item.show) && (
                <div className="h-[1.5px] bg-slate-200" />
              )}

              {/* Info Navigation Section */}
              <div className="flex flex-col">
                {infoNavItems.map((item) => {
                  if (!item.show) return null;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors",
                        isActive
                          ? "bg-sky-100 text-sky-900"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Separator */}
              {status === "authenticated" && (
                <div className="h-[1.5px] bg-slate-200" />
              )}

              {/* Auth Section */}
              <div className="flex flex-col">
                {authItems.map((item) => {
                  if (!item.show) return null;

                  return item.isLogout ? (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors",
                        pathname === item.href
                          ? "bg-sky-100 text-sky-900"
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
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
