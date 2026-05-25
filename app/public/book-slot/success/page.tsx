"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessPageUIContent() {
  const searchParams = useSearchParams();

  const title = searchParams.get("event") || "Meeting Session"; 
  const bookerName = searchParams.get("name") || ""; 
  const bookerEmail = searchParams.get("email") || ""; 
  const rawNotes = searchParams.get("notes") || "";
  const additionalNotes = rawNotes === "na" ? "" : rawNotes;
  const location = searchParams.get("location") || "Google Meet";
  const username = searchParams.get("user") || "Host";

  // 💥 FIXED ERROR 2: Extract fully descriptive dynamic string computed from confirm handler pipeline directly
  const formattedClientWhen = searchParams.get("formattedClientWhen") || "Scheduled Range Timings";

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] px-4 py-16 flex items-center justify-center antialiased">
      <div className="w-full max-w-[560px] space-y-6 text-center animate-in fade-in zoom-in-95 duration-150">
        
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

        <div className="bg-[#121214] border border-zinc-800/60 rounded-xl p-6 text-left space-y-5 text-sm shadow-xl">
          
          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">What</span>
            <span className="col-span-9 text-zinc-200 font-normal text-xs leading-relaxed capitalize">
              {title.replace(/-/g, " ")} between <span className="font-semibold text-white">{bookerName}</span> and <span className="font-semibold text-white">{username.replace(/-forwy0/g, "").replace(/-/g, " ")}</span>
            </span>
          </div>

          {/* 📅 FIXED "WHEN" BLOCK: Directly outputs local client timeline summary details ranges */}
          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">When</span>
            <div className="col-span-9 text-xs">
              <p className="text-zinc-200 font-medium font-sans leading-relaxed">{formattedClientWhen}</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">Who</span>
            <div className="col-span-9 space-y-3 text-xs">
              <div className="space-y-0.5">
                <p className="text-zinc-200 font-medium flex items-center space-x-1.5">
                  <span className="capitalize">{username.replace(/-forwy0/g, "").replace(/-/g, " ")}</span>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-mono text-[9px] uppercase tracking-wide select-none">Host</span>
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-zinc-200 font-medium capitalize">{bookerName}</p>
                {bookerEmail && <p className="text-zinc-500 text-[11px] font-mono">{bookerEmail}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 border-b border-zinc-800/40 pb-4">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">Where</span>
            <span className="col-span-9 text-blue-400 text-xs font-medium flex items-center space-x-1 hover:underline cursor-pointer">
              <span>{location}</span>
              <span className="text-[10px]">↗</span>
            </span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-3 text-zinc-400 font-medium text-xs">Additional notes</span>
            <span className="col-span-9 text-zinc-300 font-normal text-xs leading-relaxed font-sans whitespace-pre-wrap break-words">
              {(!additionalNotes || additionalNotes.trim() === "") ? "No notes added." : additionalNotes}
            </span>
          </div>

        </div>

        <p className="text-[11px] text-zinc-500 font-light select-none pt-2">
          Need to make a change? <span className="text-zinc-400 hover:underline cursor-pointer mx-0.5">Rescheduled</span> or <span className="text-zinc-400 hover:underline cursor-pointer mx-0.5">Cancel</span>
        </p>

      </div>
    </div>
  );
}

export default function PublicBookingSuccessWorkspace() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-xs text-zinc-500 font-mono animate-pulse">Generating confirmation workspace...</div>}>
      <SuccessPageUIContent />
    </Suspense>
  );
}