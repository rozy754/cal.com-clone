"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

// PART A: INTERNAL CORE CALENDAR INTERFACE COMPONENT
function CalendarSlotPickerCoreEngine() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventSlug = params?.eventSlug as string;
  // Safely extract the username parameter from the query string
  const username = searchParams.get("user") || "rozy-koranga-forwy0";

  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookingCalendarSpecs() {
      try {
        const eventRes = await fetch("/api/event-type");
        if (!eventRes.ok) throw new Error("Failed fetching events stream");
        const events = await eventRes.json();
        const extractedEvents = Array.isArray(events) ? events : events?.data || [];
        
        const currentEvent = extractedEvents.find((e: any) => e.slug === eventSlug);
        if (!currentEvent) {
          router.push(`/public/${username}`);
          return;
        }
        setEventData(currentEvent);

        if (currentEvent.scheduleId) {
          const scheduleRes = await fetch(`/api/availability/${currentEvent.scheduleId}`);
          if (scheduleRes.ok) {
            const schedulePayload = await scheduleRes.json();
            setScheduleData(schedulePayload?.data || schedulePayload);
          }
        }
      } catch (err) {
        console.error("Failed loading data matrix layers:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookingCalendarSpecs();
  }, [eventSlug, username, router]);

  const checkDateAvailabilityStatus = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return { isAvailable: false, reason: "past" };

    const dateString = date.toISOString().split("T")[0];
    const overrides = scheduleData?.date_overrides || [];
    const matchedOverride = overrides.find((ov: any) => ov.date.split("T")[0] === dateString);
    if (matchedOverride) {
      return { isAvailable: !matchedOverride.isBlocked, isOverride: true, overrideData: matchedOverride };
    }

    const dayOfWeek = date.getDay();
    const weeklySlots = scheduleData?.weekly_slots || [];
    const hasWeeklySlot = weeklySlots.some((slot: any) => slot.dayOfWeek === dayOfWeek);

    return { isAvailable: hasWeeklySlot, isOverride: false, overrideData: null };
  };

  const generateSlotsForDate = (date: Date) => {
    const status = checkDateAvailabilityStatus(date);
    if (!status.isAvailable) {
      setAvailableSlots([]);
      return;
    }

    let startStr = "09:00";
    let endStr = "17:00";

    if (status.isOverride && status.overrideData) {
      startStr = status.overrideData.startTime || "09:00";
      endStr = status.overrideData.endTime || "17:00";
    } else {
      const dayOfWeek = date.getDay();
      const weeklySlots = scheduleData?.weekly_slots || [];
      const currentDaySlot = weeklySlots.find((slot: any) => slot.dayOfWeek === dayOfWeek);
      if (currentDaySlot) {
        startStr = currentDaySlot.startTime;
        endStr = currentDaySlot.endTime;
      }
    }

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    
    const slotsArray: string[] = [];
    const stepDuration = eventData?.duration || 30;
    const bufferTime = eventData?.bufferTime || 0;
    const totalStep = stepDuration + bufferTime;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const now = new Date();
    const isTodaySelected = date.toISOString().split("T")[0] === now.toISOString().split("T")[0];
    const minNoticeMinutes = eventData?.minNoticePeriod || 120;

    while (currentMinutes + stepDuration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const formattedSlotTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      
      if (isTodaySelected) {
        const slotTotalMinutesFromMidnight = h * 60 + m;
        const currentTotalMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
        if (slotTotalMinutesFromMidnight < currentTotalMinutesFromMidnight + minNoticeMinutes) {
          currentMinutes += totalStep;
          continue;
        }
      }

      slotsArray.push(formattedSlotTime);
      currentMinutes += totalStep;
    }

    setAvailableSlots(slotsArray);
  };

  const getDaysInMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const dayCells: (Date | null)[] = Array(firstDayIndex).fill(null);
    for (let i = 1; i <= totalDays; i++) {
      dayCells.push(new Date(year, month, i));
    }
    return dayCells;
  };

  const handleDateClick = (date: Date) => {
    const status = checkDateAvailabilityStatus(date);
    if (!status.isAvailable) return;

    const dateStr = date.toISOString().split("T")[0];
    setSelectedDateString(dateStr);
    setSelectedSlot(null);
    generateSlotsForDate(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-xs text-zinc-500 font-mono">
        Loading scheduler calendar grids metrics...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] px-4 py-16 flex items-center justify-center antialiased">
      <div className="w-full max-w-[860px] bg-[#141416] border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        
        {/* LEFT COMPONENT COLUMN AREA */}
        <div className="md:col-span-3 p-6 border-b md:border-b-0 md:border-r border-zinc-800/70 space-y-4 select-none">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
            {username.charAt(0)}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 font-medium capitalize">{username.replace(/-/g, " ")}</p>
            <h2 className="text-base font-bold text-white tracking-tight">{eventData?.title}</h2>
          </div>
          <div className="space-y-2 text-zinc-400 text-xs font-light">
            <div className="flex items-center space-x-2"><span>⏱️</span><span className="font-mono">{eventData?.duration} minutes</span></div>
            <div className="flex items-center space-x-2"><span>📹</span><span>{eventData?.location || "Google Meet"}</span></div>
            <div className="flex items-center space-x-2"><span>🌐</span><span>{scheduleData?.timeZone || "Asia/Kolkata"}</span></div>
          </div>
        </div>

        {/* MIDDLE CALENDAR GRID SYSTEM INTERFACE */}
        <div className="md:col-span-5 p-6 border-b md:border-b-0 md:border-r border-zinc-800/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 select-none">
              <span className="text-xs font-semibold text-white">
                {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
              </span>
              <div className="flex items-center space-x-1">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 text-zinc-400 hover:text-white border border-zinc-800 rounded-md bg-black text-xs cursor-pointer">◂</button>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 text-zinc-400 hover:text-white border border-zinc-800 rounded-md bg-black text-xs cursor-pointer">▸</button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2 select-none">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonthGrid().map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const status = checkDateAvailabilityStatus(day);
                const isSelected = selectedDateString === day.toISOString().split("T")[0];

                return (
                  <button
                    key={idx}
                    disabled={!status.isAvailable}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center focus:outline-none ${
                      isSelected
                        ? "bg-white text-black font-bold scale-105 shadow-md"
                        : status.isAvailable
                        ? "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
                        : "text-zinc-700 opacity-20 cursor-not-allowed select-none"
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={() => router.push(`/public/${username}`)} className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors w-fit pt-4 cursor-pointer">← Back to listing</button>
        </div>

        {/* RIGHT SIDE HOURLY TRACK PILLS ARRAY PANEL */}
        <div className="md:col-span-4 p-6 bg-[#0b0b0c]/40 flex flex-col justify-start overflow-y-auto max-h-[500px]">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 select-none">
            {selectedDateString ? `Available Slots` : "Select a Date"}
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {selectedDateString && availableSlots.map((slot) => {
              const isSlotChosen = selectedSlot === slot;
              return (
                <div key={slot} className="flex items-center space-x-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <button
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex-1 text-center font-mono text-xs py-2.5 rounded-xl border transition-all focus:outline-none ${
                      isSlotChosen ? "bg-zinc-800 text-zinc-400 border-zinc-700 line-through font-medium" : "bg-[#141416] text-white border-zinc-800/80 hover:border-zinc-500 cursor-pointer"
                    }`}
                  >
                    {slot}
                  </button>
                  {isSlotChosen && (
                    <button
                      onClick={() => router.push(`/public/booking/${eventSlug}/book?date=${selectedDateString}&time=${slot}&user=${username}`)}
                      className="bg-white text-black font-semibold text-xs px-3.5 py-2.5 rounded-xl hover:bg-zinc-200 cursor-pointer animate-in zoom-in-95 duration-150 shrink-0"
                    >
                      Next
                    </button>
                  )}
                </div>
              );
            })}
            {!selectedDateString && (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 text-xs font-light py-12 select-none">
                <span>📅</span>
                <p className="mt-1.5 leading-relaxed">Choose an open active calendar day from the grid view loop map to view corresponding time intervals.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// PART B: MASTER EXPORT WRAPPED IN STABLE SUSPENSE LAYER
export default function PublicEventCalendarSlotPicker() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-xs text-zinc-500 animate-pulse font-medium">
        Initializing dynamic secure calendar layers...
      </div>
    }>
      <CalendarSlotPickerCoreEngine />
    </Suspense>
  );
}