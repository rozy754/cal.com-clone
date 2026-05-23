"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PublicUserEventTypesListing() {
  const params = useParams();
  const router = useRouter();
  
  // Clean string sanitation formatting the custom profile username context
  const rawUsername = params?.username as string;
  const cleanUsername = rawUsername
    ? rawUsername.replace(/-forwy0/g, "").replace(/-/g, " ")
    : "Rozy Koranga";

  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // FETCH ALL REALTIME ACTIVE EVENTS FROM THE BACKEND DATABASE
  useEffect(() => {
    async function loadPublicPageData() {
      try {
        // Calling your universal GET API endpoint directly
        const response = await fetch("/api/event-type");
        if (response.ok) {
          const payload = await response.json();
          const extractedArray = Array.isArray(payload) ? payload : payload?.data || [];
          
          // Only show events that have isActive = true marked in database
          const activeEvents = extractedArray.filter((event: any) => event.isActive !== false);
          setEventTypes(activeEvents);
        }
      } catch (error) {
        console.error("Failed loading event layouts onto the public screen context stream:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicPageData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] text-white flex flex-col items-center justify-center space-y-3 select-none antialiased">
        <svg className="animate-spin h-5 w-5 text-white opacity-40" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs text-zinc-500 font-medium tracking-wide">Loading slot profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] antialiased px-4 py-16 selection:bg-white selection:text-black">
      <div className="max-w-[580px] mx-auto space-y-6">
        
        {/* PROFILE HEADER BADGE BANNER CARD BLOCK */}
        <div className="bg-[#141416] border border-zinc-800/70 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center space-y-3.5">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 shadow-inner flex items-center justify-center text-xl font-bold text-white uppercase select-none">
            {cleanUsername.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold tracking-tight text-white capitalize">{cleanUsername}</h1>
            <p className="text-xs text-zinc-400 font-light tracking-wide">learner</p>
          </div>
        </div>

        {/* EVENTS LOOP GRID FRAME LIST DECK */}
        <div className="space-y-3">
          {eventTypes.map((event) => (
            <div
              key={event.id}
              onClick={() => {
                // FIXED: Now redirects straight to the conflict-free flat layout booking folder path safely!
                if (event.slug) {
                  router.push(`/public/booking/${event.slug}?user=${rawUsername}`);
                }
              }}
              className="bg-[#141416] border border-zinc-800/80 rounded-xl p-5 shadow-md hover:border-zinc-600 transition-all duration-200 group cursor-pointer flex flex-col space-y-2.5 relative overflow-hidden"
            >
              <div className="space-y-1 pr-6">
                <h3 className="text-sm font-semibold text-white tracking-tight group-hover:underline transition-all">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-xs text-zinc-400 font-light leading-relaxed truncate max-w-[500px]">
                    {event.description}
                  </p>
                )}
              </div>

              {/* DURATION BADGE STRIP CHIP */}
              <div className="flex items-center space-x-1.5 bg-[#1d1d20] border border-zinc-800 text-zinc-400 text-[11px] font-medium tracking-tight px-2.5 py-1 rounded-md w-fit select-none font-mono">
                <svg className="w-3.5 h-3.5 opacity-60 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{event.duration}m</span>
              </div>

              {/* RIGHT DIRECTIONAL CHEVRON INDICATION ACCENT */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-white transition-colors duration-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}

          {/* EMPTY DATABASES CONDITIONAL FALLBACK EXCEPTION STRIP */}
          {eventTypes.length === 0 && (
            <div className="p-10 border border-dashed border-zinc-800 bg-zinc-900/10 text-center rounded-xl text-xs text-zinc-500 font-light select-none">
              No public dynamic event bookers registered inside this account template matrix yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}