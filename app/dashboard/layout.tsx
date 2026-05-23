"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navigationItems = [
    { 
      name: "Event types", 
      href: "/dashboard/event-types",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    { 
      name: "Bookings", 
      href: "/dashboard/bookings",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: "Availability", 
      href: "/dashboard/availability",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: "Apps",
      href: "/dashboard/apps",
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#0b0b0c] text-[#f4f4f5] antialiased">
      
      {/* PERSISTENT LEFT PANEL SIDEBAR */}
      <aside className="w-[240px] bg-[#0b0b0c] flex flex-col justify-between border-r border-[#19191b] p-3 sticky top-0 h-screen select-none shrink-0">
        
        {/* TOP NAVIGATION LINK CLUSTER */}
        <div>
          {/* Identity Header */}
          <div className="flex items-center space-x-2.5 p-2 rounded-md hover:bg-[#141416] transition-all cursor-pointer mb-4">
            <div className="w-5 h-5 rounded-full bg-[#2a2a2f] border border-[#3e3e44] flex items-center justify-center text-[10px] font-bold text-white uppercase">
              RK
            </div>
            <span className="font-medium text-sm tracking-tight text-white">Rozy Koranga</span>
          </div>

          {/* Main Navigation Stack */}
          <nav className="space-y-[3px]">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-2.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                    isActive ? "bg-[#1d1d20] text-white" : "text-[#8a8a93] hover:bg-[#141416] hover:text-[#f4f4f5]"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-[#71717a]"}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM SECTION: SECURELY ANCHORED AT THE BOTTOM */}
        <div className="space-y-[2px] border-t border-[#141416] pt-3">
          <Link 
            href="/public/rozy-koranga-forwy0" 
            target="_blank"
            className="flex items-center space-x-3 px-2.5 py-1.5 text-sm font-medium text-[#8a8a93] hover:text-white rounded-md hover:bg-[#141416] transition-all"
          >
            <svg className="w-4 h-4 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="text-xs">View public page</span>
          </Link>

          <Link 
            href="/dashboard/settings"
            className="flex items-center space-x-3 px-2.5 py-1.5 text-sm font-medium text-[#8a8a93] hover:text-white rounded-md hover:bg-[#141416] transition-all"
          >
            <svg className="w-4 h-4 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </aside>

      {/* FULL-WIDTH MAIN CONTENT HOUSING WINDOW */}
      <main className="flex-1 bg-[#101011] overflow-y-auto px-8 py-8">
        <div className="w-full">{children}</div>
      </main>

    </div>
  );
}