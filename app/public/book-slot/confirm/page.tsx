"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BookerInformationFormCoreEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventSlug = searchParams.get("event") || "";
  const dateStr = searchParams.get("date") || "";
  const timeStr = searchParams.get("time") || "";
  const username = searchParams.get("user") || "rozy-koranga-forwy0";

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [scheduleData, setScheduleData] = useState<any>(null);

  const [formData, setFormData] = useState<{ [key: string]: string }>({
    name: "",
    email: "",
    notes: "",
  });

  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);

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

            if (currentEvent.customQuestions && Array.isArray(currentEvent.customQuestions)) {
              setDynamicQuestions(currentEvent.customQuestions.filter((q: any) => !q.hidden));
            }
          }
        }
      } catch (error) {
        console.error("Failed parsing specific configuration boundaries:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadFormSpecsLayer();
  }, [eventSlug]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

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

    const startTimeFormatted = `${getDisplayH(startH)}:${startM.toString().padStart(2, "0")}${getAmPm(startH)}`;
    const endTimeFormatted = `${getDisplayH(endH)}:${endM.toString().padStart(2, "0")}${getAmPm(endH)}`;

    return `${startTimeFormatted} - ${endTimeFormatted}`;
  };

  const formatDisplayDate = () => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("en-US", options);
  };

  const handleSubmitBookingAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Name and email inputs are strictly required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadPayload = {
        eventTypeId: eventData?.id,
        bookerName: formData.name,
        bookerEmail: formData.email,
        startTime: new Date(`${dateStr}T${timeStr}:00`).toISOString(),
        endTime: new Date(new Date(`${dateStr}T${timeStr}:00`).getTime() + (eventData?.duration || 30) * 60000).toISOString(),
        customResponses: formData,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadPayload),
      });

      // ✅ FIXED: Now properly forwarding 'notes' via URL encoding along with name and email parameters
      router.push(
        `/public/book-slot/success?event=${eventSlug}&date=${dateStr}&time=${timeStr}&name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}&notes=${encodeURIComponent(formData.notes || "")}&user=${username}`
      );
    } catch (err) {
      console.error("Booking transmission error crashed:", err);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-xs text-zinc-500 font-mono">
        Loading context parameters form matrix...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] px-4 py-16 flex items-center justify-center antialiased select-none">
      <div className="w-full max-w-[840px] bg-[#141416] border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        
        {/* LEFT PANEL */}
        <div className="md:col-span-5 p-8 border-b md:border-b-0 md:border-r border-zinc-800/70 space-y-4 text-left">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 uppercase">
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
            
            <div className="flex items-center space-x-2">
              <span className="text-sm">⏱️</span>
              <span>{eventData?.duration || 30}m</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm">📹</span>
              <span>{eventData?.location || "Cal Video"}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm">🌐</span>
              <span>{scheduleData?.timeZone || "Asia/Kolkata"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT INPUT PANEL */}
        <form onSubmit={handleSubmitBookingAction} className="md:col-span-7 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {dynamicQuestions.length > 0 ? (
              dynamicQuestions.map((field) => (
                <div key={field.id} className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-zinc-300">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      rows={3}
                      className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors resize-none font-light leading-relaxed"
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      required={field.required}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  )}
                </div>
              ))
            ) : (
              <>
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-zinc-300">Your name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-zinc-300">Email address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* ADDITIONAL USER REFINEMENT NOTES */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-zinc-300">Additional notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Please share anything that will help prepare for our meeting."
                rows={3}
                className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors resize-none font-light leading-relaxed placeholder:text-zinc-700"
              />
            </div>
          </div>

          {/* PRIVACY FOOTER STATEMENT */}
          <div className="space-y-4 pt-2">
            <p className="text-[10px] text-left text-zinc-500 font-light leading-normal">
              By proceeding, you agree to Cal.com's <span className="text-zinc-400 hover:underline cursor-pointer">Terms</span> and <span className="text-zinc-400 hover:underline cursor-pointer">Privacy Policy</span>.
            </p>
            
            <div className="flex items-center justify-end space-x-2 border-t border-zinc-800/60 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-white text-black font-semibold text-xs px-5 py-2 rounded-xl hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer shadow-md"
              >
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
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-xs text-zinc-500 font-medium">
        Loading form configuration fields...
      </div>
    }>
      <BookerInformationFormCoreEngine />
    </Suspense>
  );
}