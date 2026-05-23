"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { availabilityApi } from "../utils/api";

export default function AvailabilityPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // FETCH FUNCTION TO REUSE
  const loadSchedules = async () => {
    try {
      const responseData: any = await availabilityApi.getAll();
      const extracted = Array.isArray(responseData) ? responseData : responseData?.data || responseData?.schedules || [];
      setSchedules(extracted);
      return extracted;
    } catch (err) {
      console.error("Failed loading rows:", err);
      setSchedules([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FIXED AUTO-PROVISION SYSTEM
  const handleCreateNewSchedule = async () => {
    setIsProvisioning(true);
    try {
      // Backend ko required defaults ke sath bhej rahe hain taaki save hone mein dikkat na ho
      const response = await availabilityApi.create({
        name: "Working hours",
        timezone: "Asia/Kolkata",
        days: []
      });

      const target = response?.data || response;
      
      // FIX: Agar backend direct ID de deta hai
      if (target && target.id) {
        router.push(`/dashboard/availability/${target.id}`);
        router.refresh();
      } else {
        // FALLBACK: Agar backend blank `{}` deta hai, toh data reload karo aur list mein sabse naye schedule par redirect kar do
        console.log("Backend returned empty payload, pulling fresh snapshot list layout...");
        const freshList = await loadSchedules();
        
        if (freshList && freshList.length > 0) {
          // Sabse last added schedule ki ID nikalte hain
          const latestSchedule = freshList[freshList.length - 1];
          if (latestSchedule && latestSchedule.id) {
            router.push(`/dashboard/availability/${latestSchedule.id}`);
            router.refresh();
          }
        } else {
          setIsProvisioning(false);
        }
      }
    } catch (err) {
      console.error("Auto provision failed:", err);
      setIsProvisioning(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await availabilityApi.delete(id);
      setSchedules(schedules.filter((s) => s.id !== id));
      setActiveMenuId(null);
    } catch (err) {
      console.error("Purging failed:", err);
    }
  };

  if (isLoading || isProvisioning) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center space-y-3 select-none">
        <svg className="animate-spin h-5 w-5 text-white opacity-60" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <div className="text-xs text-zinc-500 font-medium tracking-wide">Syncing schedule parameters with database...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#101011]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Availability</h1>
          <p className="text-xs text-zinc-400 mt-1">Configure your availability schedules mapping timelines format slots.</p>
        </div>
        <button
          onClick={handleCreateNewSchedule}
          className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer shrink-0 mt-3 sm:mt-0"
        >
          + New Schedule
        </button>
      </div>

      <div className="w-full border border-zinc-800 rounded-lg bg-[#09090b] overflow-hidden divide-y divide-zinc-800/80 shadow-xl">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-all group">
            <div className="flex items-center space-x-3.5 min-w-0 pr-4">
              <span className="text-sm select-none">📅</span>
              <div className="min-w-0">
                <h3 
                  onClick={() => router.push(`/dashboard/availability/${schedule.id}`)}
                  className="text-sm font-medium text-white hover:underline cursor-pointer truncate"
                >
                  {schedule.name || "Untitled Setup"}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 truncate font-light font-mono">
                  {schedule.timezone || "Asia/Kolkata"}
                </p>
              </div>
            </div>

            <div className="relative shrink-0" ref={activeMenuId === schedule.id ? menuRef : null}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(activeMenuId === schedule.id ? null : schedule.id);
                }}
                className="p-1.5 text-zinc-400 hover:text-white border border-zinc-800 rounded-md hover:bg-zinc-900/60 transition-colors tracking-widest cursor-pointer text-xs"
              >
                •••
              </button>

              {activeMenuId === schedule.id && (
                <div className="absolute right-0 mt-2 w-28 bg-[#141416] border border-zinc-800 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button 
                    onClick={() => router.push(`/dashboard/availability/${schedule.id}`)}
                    className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => schedule.id && handleDeleteSchedule(schedule.id)}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/20 font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div className="p-8 text-center text-xs text-zinc-500 font-light">
            No active schedules registered inside the database framework index.
          </div>
        )}
      </div>
    </div>
  );
}