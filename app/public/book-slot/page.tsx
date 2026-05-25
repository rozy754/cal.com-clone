"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function formatToAmPmRange(startDate: Date, durationMinutes: number, targetTimeZone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: targetTimeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const startStr = new Intl.DateTimeFormat("en-US", options).format(startDate).toLowerCase();
  const endStr = new Intl.DateTimeFormat("en-US", options).format(endDate).toLowerCase();
  return `${startStr} - ${endStr}`;
}

function convertHostTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const baseDate = new Date(`${dateStr}T${timeStr}:00`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(baseDate);
  const map: Record<string, string> = {};
  parts.forEach(p => { map[p.type] = p.value; });

  const formattedTargetStr = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`;
  const diff = baseDate.getTime() - new Date(formattedTargetStr).getTime();
  return new Date(baseDate.getTime() + diff);
}

function CalendarSlotPickerCoreEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventSlug = searchParams.get("event") || "";
  const username = searchParams.get("user") || "rozy-koranga-forwy0";

  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [globalBookedSlots, setGlobalBookedSlots] = useState<any[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateString, setSelectedDateString] = useState<string | null>(null);
  const [allPossibleSlots, setAllPossibleSlots] = useState<any[]>([]);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";

  useEffect(() => {
    async function loadBookingSpecs() {
      if (!eventSlug) return;
      try {
        const eventRes = await fetch("/api/event-type");
        if (!eventRes.ok) throw new Error("Failed fetching events");
        const events = await eventRes.json();
        const extractedEvents = Array.isArray(events) ? events : events?.data || [];
        
        const currentEvent = extractedEvents.find((e: any) => e.slug === eventSlug);
        if (!currentEvent) return;
        setEventData(currentEvent);

        if (currentEvent.scheduleId) {
          const scheduleRes = await fetch(`/api/availability/${currentEvent.scheduleId}`);
          if (scheduleRes.ok) {
            const schedulePayload = await scheduleRes.json();
            const sData = schedulePayload?.data || schedulePayload;
            setScheduleData(sData);

            if (sData?.userId) {
              const response = await fetch(`/api/bookings?userId=${sData.userId}`);
              if (response.ok) {
                const result = await response.json();
                const fetchedData = result?.data || {};
                const activeBookings = [
                  ...(fetchedData.upcoming || []),
                  ...(fetchedData.past || [])
                ];
                setGlobalBookedSlots(activeBookings);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading slot engine:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookingSpecs();
  }, [eventSlug]);

  const isSlotClashingWithHostCalendar = (start: Date, end: Date): boolean => {
    return globalBookedSlots.some((b: any) => {
      const existingStart = new Date(b.startTime).getTime();
      const existingEnd = new Date(b.endTime).getTime();
      return start.getTime() < existingEnd && end.getTime() > existingStart;
    });
  };

  const checkSlotsAvailabilityForGrid = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;

    const dayOfWeek = date.getDay();
    const weeklySlots = scheduleData?.weekly_slots || [];
    const hasWeeklySlot = weeklySlots.some((slot: any) => slot.dayOfWeek === dayOfWeek);
    if (!hasWeeklySlot) return false;

    let startStr = "09:00";
    let endStr = "17:00";
    const currentDaySlot = weeklySlots.find((slot: any) => slot.dayOfWeek === dayOfWeek);
    if (currentDaySlot) {
      startStr = currentDaySlot.startTime;
      endStr = currentDaySlot.endTime;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    const stepDuration = eventData?.duration || 30;
    const totalStep = stepDuration + (eventData?.bufferTime || 0);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const hostTimeZone = scheduleData?.timeZone || "Asia/Kolkata";
    const minNoticeMinutes = eventData?.minNoticePeriod || 120;

    while (currentMinutes + stepDuration <= endMinutes) {
      const sh = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
      const sm = (currentMinutes % 60).toString().padStart(2, "0");
      
      const slotStart = convertHostTimeToUtc(dateString, `${sh}:${sm}`, hostTimeZone);
      const slotEnd = new Date(slotStart.getTime() + stepDuration * 60000);

      const isOverdue = slotStart.getTime() <= (new Date().getTime() + minNoticeMinutes * 60000);
      const isClashing = isSlotClashingWithHostCalendar(slotStart, slotEnd);

      if (!isOverdue && !isClashing) {
        return true; 
      }
      currentMinutes += totalStep;
    }
    return false;
  };

  const generateSlotsForDate = (date: Date) => {
    let startStr = "09:00";
    let endStr = "17:00";
    const dayOfWeek = date.getDay();
    const weeklySlots = scheduleData?.weekly_slots || [];
    const currentDaySlot = weeklySlots.find((slot: any) => slot.dayOfWeek === dayOfWeek);
    if (currentDaySlot) {
      startStr = currentDaySlot.startTime;
      endStr = currentDaySlot.endTime;
    }

    const hostTimeZone = scheduleData?.timeZone || "Asia/Kolkata";
    const [startH, startM] = startStr.split(":").map(Number);
    const [endH, endM] = endStr.split(":").map(Number);
    
    const slotsArray: any[] = [];
    const stepDuration = eventData?.duration || 30;
    const totalStep = stepDuration + (eventData?.bufferTime || 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const minNoticeMinutes = eventData?.minNoticePeriod || 120;

    while (currentMinutes + stepDuration <= endMinutes) {
      const sh = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
      const sm = (currentMinutes % 60).toString().padStart(2, "0");
      
      const slotStart = convertHostTimeToUtc(dateString, `${sh}:${sm}`, hostTimeZone);
      const slotEnd = new Date(slotStart.getTime() + stepDuration * 60000);

      // ✅ CODES FIX: Variable defined properly to clear TypeScript compilation flags
      const isOverdue = slotStart.getTime() <= (new Date().getTime() + minNoticeMinutes * 60000);
      const isClashing = isSlotClashingWithHostCalendar(slotStart, slotEnd);

      if (!isOverdue && !isClashing) {
        const clientDisplayRange = formatToAmPmRange(slotStart, stepDuration, clientTimeZone);
        slotsArray.push({
          startISO: slotStart.toISOString(),
          endISO: slotEnd.toISOString(),
          displayRange: clientDisplayRange,
          isAvailable: true,
        });
      }
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

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-[900px] bg-[#141416] border border-zinc-800 rounded-2xl grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        
        {/* LEFT INFORMATION */}
        <div className="md:col-span-4 p-6 border-b md:border-r border-zinc-800 space-y-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
            {username.charAt(0) || "U"}
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium capitalize">{username.replace(/-/g, " ")}</p>
            <h2 className="text-base font-bold text-white mt-1">{eventData?.title || "Loading..."}</h2>
          </div>
          <div className="text-zinc-400 text-xs font-mono">⏱️ {eventData?.duration} mins</div>
        </div>

        {/* MIDDLE CALENDAR PANEL */}
        <div className="md:col-span-4 p-6 border-b md:border-r border-zinc-800">
          <div className="flex items-center justify-between pb-4">
            <span className="text-xs font-semibold text-white">
              {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
            </span>
            <div className="flex space-x-1">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-2 py-1 bg-black border border-zinc-800 rounded text-xs">◂</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-2 py-1 bg-black border border-zinc-800 rounded text-xs">▸</button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] uppercase font-bold text-zinc-500 mb-2">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonthGrid().map((day, idx) => {
              if (!day) return <div key={idx} />;
              
              const isDateValid = checkSlotsAvailabilityForGrid(day);
              const formattedDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
              const isSelected = selectedDateString === formattedDate;

              return (
                <button
                  key={idx}
                  disabled={!isDateValid}
                  onClick={() => {
                    setSelectedDateString(formattedDate);
                    setSelectedSlotIdx(null);
                    generateSlotsForDate(day);
                  }}
                  className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-white text-black font-bold"
                      : isDateValid
                      ? "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 border border-zinc-800 cursor-pointer"
                      : "text-zinc-700 opacity-20 cursor-not-allowed bg-transparent"
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT AVAILABLE SLOTS SLIDER */}
        <div className="md:col-span-4 p-6 bg-[#0b0b0c]/40 flex flex-col justify-start overflow-y-auto max-h-[500px]">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            {selectedDateString ? `Available Slots` : "Select a Date"}
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {selectedDateString && allPossibleSlots.map((item, idx) => {
              const isSlotChosen = selectedSlotIdx === idx;
              return (
                <div key={idx} className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedSlotIdx(idx)}
                    className={`flex-1 text-center font-mono text-xs py-2 rounded-xl border transition-all ${
                      isSlotChosen
                        ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                        : "bg-[#141416] text-white border-zinc-800 hover:border-zinc-500 cursor-pointer"
                    }`}
                  >
                    {item.displayRange}
                  </button>
                  {isSlotChosen && (
                    <button
                      onClick={() => {
                        const targetHostZone = scheduleData?.timeZone || "Asia/Kolkata";
                        router.push(
                          `/public/book-slot/confirm?` +
                          `event=${encodeURIComponent(eventSlug)}&` +
                          `user=${encodeURIComponent(username)}&` +
                          `eventTypeId=${encodeURIComponent(eventData.id)}&` +
                          `startTime=${encodeURIComponent(item.startISO)}&` +
                          `endTime=${encodeURIComponent(item.endISO)}&` +
                          `hostTimeZone=${encodeURIComponent(targetHostZone)}&` +
                          `clientTimeZone=${encodeURIComponent(clientTimeZone)}`
                        );
                      }}
                      className="bg-white text-black font-semibold text-xs px-3 py-2 rounded-xl hover:bg-zinc-200"
                    >
                      Next
                    </button>
                  )}
                </div>
              );
            })}
            {selectedDateString && allPossibleSlots.length === 0 && (
              <div className="text-center text-xs text-zinc-600 py-12">
                All slots are booked for this host across all events.
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
    <Suspense fallback={<div>Loading layout...</div>}>
      <CalendarSlotPickerCoreEngine />
    </Suspense>
  );
}