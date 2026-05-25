"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// PART A: MAIN SUCCESS COMPONENT RENDER ENGINE
function SuccessPageUIContent() {
  const searchParams = useSearchParams();

  // Extract variables safely transmitted through the URL query string layer
  const title = searchParams.get("event") || "Meeting Session"; 
  const dateStr = searchParams.get("date") || "";
  const timeStr = searchParams.get("time") || "";
  const bookerName = searchParams.get("name") || ""; 
  const bookerEmail = searchParams.get("email") || ""; 
  
  // ✅ LIVE FIX: Fetching exactly what you write in the form safely with decoding
  const rawNotes = searchParams.get("notes") || "";
  const additionalNotes = rawNotes === "na" ? "" : rawNotes;

  const location = searchParams.get("location") || "Cal Video";
  const username = searchParams.get("user") || "Host";

  const formatDisplayDate = () => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("en-US", options);
  };

  const formatDisplayTimeRange = () => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const getAmPm = (hours: number) => (hours >= 12 ? "PM" : "AM");
    const getDisplayH = (hours: number) => (hours % 12 === 0 ? 12 : hours % 12);

    const startTimeFormatted = `${getDisplayH(h)}:${m.toString().padStart(2, "0")} ${getAmPm(h)}`;
    
    const endTotalMin = h * 60 + m + 30;
    const endH = Math.floor(endTotalMin / 60);
    const endM = endTotalMin % 60;
    const endTimeFormatted = `${getDisplayH(endH)}:${endM.toString().padStart(2, "0")} ${getAmPm(endH)}`;

    return `${startTimeFormatted} - ${endTimeFormatted}`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] px-4 py-16 flex items-center justify-center antialiased">
      <div className="w-full max-w-[560px] space-y-6 text-center animate-in fade-in zoom-in-95 duration-150">
        
        {/* TOP STATUS TICK BADGE SIGN */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shadow-inner select-none">
            ✓
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">This meeting is scheduled</h1>
            <p className="text-xs text-zinc-400 font-light max-w-[380px] mx-auto leading-relaxed">
              We sent an email with a calendar invitation with the details to everyone.
            </p>
          </div>
        </div>

        {/* PREMIUM CONFIRMED DETAILS GRID CARD */}
        <div className="bg-[#121214] border border-zinc-800/60 rounded-xl p-6 text-left space-y-5 text-sm shadow-xl">
          
          {/* WHAT COLUMN FIELD */}
          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">What</span>
            <span className="col-span-9 text-zinc-200 font-normal text-xs leading-relaxed capitalize">
              {title.replace(/-/g, " ")} between <span className="font-semibold text-white">{bookerName}</span> and <span className="font-semibold text-white">{username.replace(/-forwy0/g, "").replace(/-/g, " ")}</span>
            </span>
          </div>

          {/* WHEN COLUMN FIELD */}
          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">When</span>
            <div className="col-span-9 space-y-0.5 text-xs">
              <p className="text-zinc-200 font-normal">{formatDisplayDate()}</p>
              <p className="text-zinc-400 font-light font-mono text-[11px]">{formatDisplayTimeRange()} (India Standard Time)</p>
            </div>
          </div>

          {/* WHO COLUMN FIELD */}
          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">Who</span>
            <div className="col-span-9 space-y-3 text-xs">
              
              {/* HOST INFO */}
              <div className="space-y-0.5">
                <p className="text-zinc-200 font-medium flex items-center space-x-1.5">
                  <span className="capitalize">{username.replace(/-forwy0/g, "").replace(/-/g, " ")}</span>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-mono text-[9px] uppercase tracking-wide select-none">Host</span>
                </p>
              </div>

              {/* LIVE ACTUAL ATTENDEE INFO */}
              <div className="space-y-0.5">
                <p className="text-zinc-200 font-medium capitalize">{bookerName}</p>
                {bookerEmail && <p className="text-zinc-500 text-[11px] font-mono">{bookerEmail}</p>}
              </div>

            </div>
          </div>

          {/* WHERE COLUMN FIELD */}
          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">Where</span>
            <span className="col-span-9 text-blue-400 text-xs font-medium flex items-center space-x-1 hover:underline cursor-pointer">
              <span>{location}</span>
              <span className="text-[10px]">↗</span>
            </span>
          </div>

          {/* ADDITIONAL NOTES FIELD (FIXED: Dynamic text handling from form with proper text layout wraps) */}
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">Additional notes</span>
            <span className="col-span-9 text-zinc-300 font-normal text-xs leading-relaxed font-sans whitespace-pre-wrap break-words">
              {(!additionalNotes || additionalNotes.trim() === "") 
                ? "No notes added." 
                : additionalNotes
              }
            </span>
          </div>

        </div>

        {/* ✅ REMOVED: "Add to Calendar" section utility component box completely stripped down */}

        <p className="text-[11px] text-zinc-500 font-light select-none pt-2">
          Need to make a change? <span className="text-zinc-400 hover:underline cursor-pointer mx-0.5">Rescheduled</span> or <span className="text-zinc-400 hover:underline cursor-pointer mx-0.5">Cancel</span>
        </p>

      </div>
    </div>
  );
}

// PART B: VALID DEFAULT EXPORT REACT COMPONENT WITH SUSPENSE MATRIX
export default function PublicBookingSuccessWorkspace() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-xs text-zinc-500 font-mono animate-pulse">
        Generating confirmation workspace metadata...
      </div>
    }>
      <SuccessPageUIContent />
    </Suspense>
  );
}