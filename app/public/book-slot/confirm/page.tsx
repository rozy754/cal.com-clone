"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BookerInformationFormCoreEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Extract parameter matrices sent directly from the Calendar Selection page
  const eventSlug = searchParams.get("event") || "";
  const username = searchParams.get("user") || "rozy-koranga-forwy0";
  const eventTypeId = searchParams.get("eventTypeId") || "";
  const startTimeISO = searchParams.get("startTime") || "";
  const endTimeISO = searchParams.get("endTime") || "";
  const dateStr = searchParams.get("date") || "";
  const timeStr = searchParams.get("time") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);

  // States to keep tracking of direct data fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notes: ""
  });

  useEffect(() => {
    async function loadFormSpecsLayer() {
      if (!eventSlug) return;
      try {
        const response = await fetch("/api/event-type");
        if (response.ok) {
          const events = await response.json();
          const extracted = Array.isArray(events) ? events : events?.data || [];
          const currentEvent = extracted.find((e: any) => e.slug === eventSlug);

          if (currentEvent) {
            setEventData(currentEvent);
            if (currentEvent.scheduleId) {
              const scheduleRes = await fetch(`/api/availability/${currentEvent.scheduleId}`);
              if (scheduleRes.ok) {
                const schedulePayload = await scheduleRes.json();
                setScheduleData(schedulePayload?.data || schedulePayload);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed loading configurations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFormSpecsLayer();
  }, [eventSlug]);

  const formatTimeSlotRange = () => {
    if (!timeStr) return "";
    const [startH, startM] = timeStr.split(":").map(Number);
    const duration = eventData?.duration || 30;

    const startTotalMin = startH * 60 + startM;
    const endTotalMin = startTotalMin + duration;

    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;

    const getAmPm = (h: number) => (h >= 12 ? "pm" : "am");
    const getDisplayH = (h: number) => (h % 12 === 0 ? 12 : h % 12);

    return `${getDisplayH(startH)}:${startM.toString().padStart(2, "0")}${getAmPm(startH)} - ${getDisplayH(endH)}:${endM.toString().padStart(2, "0")}${getAmPm(endH)}`;
  };

  const formatDisplayDate = () => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("en-US", options);
  };

  // 🔥 SUBMIT HANDLER EXECUTION ENGINE
  const handleSubmitBookingAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert("Name and email are strictly required fields.");
      return;
    }

    if (!eventTypeId || !startTimeISO || !endTimeISO) {
      alert("Missing background slot credentials parameters. Please choose a slot again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Direct network dispatch payload hitting your PostgreSQL database endpoints
      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId,
          bookerName: formData.name,
          bookerEmail: formData.email,
          startTime: startTimeISO,
          endTime: endTimeISO,
          customResponses: {
            notes: formData.notes
          }
        })
      });

      const result = await response.json().catch(() => ({ success: false, error: "Empty stream mapping error." }));

      if (!response.ok || !result.success) {
        alert(result.error || "Slot lock collision or internal system error.");
        setIsSubmitting(false);
        return;
      }

      // ✅ SUCCESS: Redirecting forward carrying query string variables directly to success engine parameters
      router.push(
        `/public/book-slot/success?` +
        `event=${encodeURIComponent(eventSlug)}&` +
        `date=${dateStr}&` +
        `time=${timeStr}&` +
        `name=${encodeURIComponent(formData.name)}&` +
        `email=${encodeURIComponent(formData.email)}&` +
        `notes=${encodeURIComponent(formData.notes || "")}&` +
        `user=${username}&` +
        `location=${encodeURIComponent(eventData?.location || "Cal Video")}`
      );
    } catch (err: any) {
      console.error("Submission engine runtime error:", err);
      alert(`Network failure: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-xs text-zinc-500 font-mono">Loading form context...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] px-4 py-16 flex items-center justify-center antialiased select-none">
      <div className="w-full max-w-[840px] bg-[#141416] border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        
        {/* LEFT COLUMN PANEL */}
        <div className="md:col-span-5 p-8 border-b md:border-b-0 md:border-r border-zinc-800/70 space-y-4 text-left">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
            {username.charAt(0)}
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-xs text-zinc-400 font-medium capitalize tracking-wide">{username.replace(/-/g, " ")}</p>
            <h2 className="text-lg font-bold text-white tracking-tight">{eventData?.title || "Meeting"}</h2>
          </div>
          <div className="space-y-3.5 pt-4 text-zinc-400 text-xs font-light">
            <div className="flex items-start space-x-2">
              <span className="text-sm mt-0.5">📅</span>
              <div className="space-y-0.5">
                <p className="text-zinc-300 font-medium">{formatDisplayDate()}</p>
                <p className="text-zinc-400 font-mono text-[11px]">{formatTimeSlotRange()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2"><span>⏱️</span><span>{eventData?.duration || 30}m</span></div>
            <div className="flex items-center space-x-2"><span>📹</span><span>{eventData?.location || "Cal Video"}</span></div>
            <div className="flex items-center space-x-2"><span>🌐</span><span>{scheduleData?.timeZone || "Asia/Kolkata"}</span></div>
          </div>
        </div>

        {/* RIGHT COLUMN INPUT FORM */}
        <form onSubmit={handleSubmitBookingAction} className="md:col-span-7 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-300">Your name *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-300">Email address *</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none" />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-300">Additional notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Please share anything that will help prepare for our meeting." rows={3} className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none placeholder:text-zinc-700" />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-[10px] text-left text-zinc-500 font-light">By proceeding, you agree to Terms and Privacy Policy.</p>
            <div className="flex items-center justify-end space-x-2 border-t border-zinc-800/60 pt-4">
              <button type="button" onClick={() => router.back()} className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2">Back</button>
              <button type="submit" disabled={isSubmitting} className="bg-white text-black font-semibold text-xs px-5 py-2 rounded-xl disabled:opacity-40 shadow-md">
                {isSubmitting ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}

export default function PublicBookerInformationFormWorkspace() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-xs text-zinc-500 font-medium">Loading form configuration fields...</div>}>
      <BookerInformationFormCoreEngine />
    </Suspense>
  );
}