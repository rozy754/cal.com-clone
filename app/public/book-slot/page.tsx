"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// HELPER FUNCTION: CONVERT 24H STRING ("14:30") TO CAL.COM STYLE AM/PM STRING ("2:30pm")
function formatToAmPm(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  
  const ampm = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  
  return `${displayHours}:${displayMinutes}${ampm}`;
}

function CalendarSlotPickerCoreEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventSlug = searchParams.get("event") || "";
  const username = searchParams.get("user") || "rozy-koranga-forwy0";

  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);
  const [allPossibleSlots, setAllPossibleSlots] = useState<{ time: string; displayRange: string; isAvailable: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookingCalendarSpecs() {
      if (!eventSlug) return;
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
        console.error("Failed loading data layers:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookingCalendarSpecs();
  }, [eventSlug, username, router]);

  const checkDateAvailabilityStatus = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return { isAvailable: false };

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
    
    const slotsArray: { time: string; displayRange: string; isAvailable: boolean }[] = [];
    const stepDuration = eventData?.duration || 30;
    const bufferTime = eventData?.bufferTime || 0;
    const totalStep = stepDuration + bufferTime;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const now = new Date();
    const isTodaySelected = date.toISOString().split("T")[0] === now.toISOString().split("T")[0];
    const minNoticeMinutes = eventData?.minNoticePeriod || 120;

    while (currentMinutes + stepDuration <= endMinutes) {
      const startHSlot = Math.floor(currentMinutes / 60);
      const startMSlot = currentMinutes % 60;
      
      const endTotalMinutes = currentMinutes + stepDuration;
      const endHSlot = Math.floor(endTotalMinutes / 60);
      const endMSlot = endTotalMinutes % 60;

      const time24Start = `${startHSlot.toString().padStart(2, "0")}:${startMSlot.toString().padStart(2, "0")}`;
      const time24End = `${endHSlot.toString().padStart(2, "0")}:${endMSlot.toString().padStart(2, "0")}`;
      
      const displayRangeString = `${formatToAmPm(time24Start)} - ${formatToAmPm(time24End)}`;

      let isSlotValid = true;
      if (isTodaySelected) {
        const currentTotalMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();
        if (currentMinutes < currentTotalMinutesFromMidnight + minNoticeMinutes) {
          isSlotValid = false;
        }
      }

      slotsArray.push({
        time: time24Start,
        displayRange: displayRangeString,
        isAvailable: isSlotValid && status.isAvailable,
      });

      currentMinutes += totalStep;
    }

    setAllPossibleSlots(slotsArray);
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

  // ✅ NEW INTERACTION CONTEXT: AUTOMATED STRINGS COMPILATION PIPELINE FOR ROUTING
  const executeNextStepTransition = (pickedTime24: string) => {
    if (!selectedDateString || !eventData) return;

    // 1. Compile pure backend global standard ISO strings
    const startISO = new Date(`${selectedDateString}T${pickedTime24}:00`).toISOString();
    const meetingDuration = eventData.duration || 30;
    const endISO = new Date(new Date(`${selectedDateString}T${pickedTime24}:00`).getTime() + meetingDuration * 60000).toISOString();

    // 2. Multi-parameter routing linking to your form view exactly
    router.push(
      `/public/book-slot/confirm?` +
      `event=${encodeURIComponent(eventSlug)}&` +
      `user=${encodeURIComponent(username)}&` +
      `eventTypeId=${encodeURIComponent(eventData.id)}&` +
      `startTime=${encodeURIComponent(startISO)}&` +
      `endTime=${encodeURIComponent(endISO)}&` +
      `date=${selectedDateString}&` +
      `time=${pickedTime24}`
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] px-4 py-16 flex items-center justify-center antialiased">
      <div className="w-full max-w-[900px] bg-[#141416] border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        
        {/* LEFT DETAILS COLUMN */}
        <div className="md:col-span-3 p-6 border-b md:border-b-0 md:border-r border-zinc-800/70 space-y-4 select-none">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
            {username.charAt(0)}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 font-medium capitalize">{username.replace(/-/g, " ")}</p>
            <h2 className="text-base font-bold text-white tracking-tight">{eventData?.title}</h2>
          </div>
          <div className="space-y-2.5 text-zinc-400 text-xs font-light">
            <div className="flex items-center space-x-2"><span>⏱️</span><span className="font-mono">{eventData?.duration} minutes</span></div>
            <div className="flex items-center space-x-2"><span>📹</span><span>{eventData?.location || "Google Meet"}</span></div>
          </div>
        </div>

        {/* MIDDLE CALENDAR ENGINE */}
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

        {/* RIGHT SIDEBAR: TIMELINE GRID PILLS */}
        <div className="md:col-span-4 p-6 bg-[#0b0b0c]/40 flex flex-col justify-start overflow-y-auto max-h-[520px]">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 select-none">
            {selectedDateString ? `Available Slots` : "Select a Date"}
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {selectedDateString && allPossibleSlots.map((item) => {
              const isSlotChosen = selectedSlot === item.time;
              
              return (
                <div key={item.time} className="flex items-center space-x-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <button
                    disabled={!item.isAvailable}
                    onClick={() => setSelectedSlot(item.time)}
                    className={`flex-1 text-center font-medium text-xs py-2.5 rounded-xl border transition-all focus:outline-none ${
                      isSlotChosen
                        ? "bg-zinc-800 text-zinc-400 border-zinc-700 shadow-inner"
                        : item.isAvailable
                        ? "bg-[#141416] text-white border-zinc-800 hover:border-zinc-500 hover:text-zinc-200 cursor-pointer"
                        : "bg-zinc-900/40 text-zinc-600 border-zinc-900/60 opacity-45 cursor-not-allowed select-none"
                    }`}
                  >
                    {item.isAvailable && !isSlotChosen && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />}
                    {item.displayRange}
                  </button>
                  
                  {/* ✅ FIXED NEXT ACTION: Direct hook linking dynamic ISO strings forwarding to your confirm view handler */}
                  {isSlotChosen && (
                    <button
                      onClick={() => executeNextStepTransition(item.time)}
                      className="bg-white text-black font-semibold text-xs px-3.5 py-2.5 rounded-xl hover:bg-zinc-200 cursor-pointer animate-in fade-in zoom-in-95 duration-150 shrink-0"
                    >
                      Next
                    </button>
                  )}
                </div>
              );
            })}

            {!selectedDateString && (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 text-xs font-light py-14 select-none">
                <span>📅</span>
                <p className="mt-1.5 leading-relaxed">Choose an open active day to reveal corresponding am/pm timeline slots matrix ranges.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PublicEventCalendarSlotPicker() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-xs text-zinc-500 font-medium">Loading layout...</div>}>
      <CalendarSlotPickerCoreEngine />
    </Suspense>
  );
}