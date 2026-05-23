"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PublicUserEventTypesListing() {
  const params = useParams();
  const router = useRouter();
  
  const rawUsername = params?.username as string;
  const cleanUsername = rawUsername
    ? rawUsername.replace(/-forwy0/g, "").replace(/-/g, " ")
    : "Rozy Koranga";

  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPublicPageData() {
      try {
        const response = await fetch("/api/event-type");
        if (response.ok) {
          const payload = await response.json();
          const extractedArray = Array.isArray(payload) ? payload : payload?.data || [];
          const activeEvents = extractedArray.filter((event: any) => event.isActive !== false);
          setEventTypes(activeEvents);
        }
      } catch (error) {
        console.error("Failed loading event layouts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicPageData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0c] text-white flex flex-col items-center justify-center space-y-3 select-none">
        <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
        <p className="text-xs text-zinc-500 font-medium">Loading slot profiles...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f4f4f5] antialiased px-4 py-16">
      <div className="max-w-[580px] mx-auto space-y-6">
        
        {/* PROFILE HEADER */}
        <div className="bg-[#141416] border border-zinc-800/70 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-white uppercase">
            {cleanUsername.charAt(0)}
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold tracking-tight text-white capitalize">{cleanUsername}</h1>
            <p className="text-xs text-zinc-400 font-light">learner</p>
          </div>
        </div>

        {/* EVENTS LOOP */}
        <div className="space-y-3">
          {eventTypes.map((event) => (
            <div
              key={event.id}
              onClick={() => {
                // FIXED: Direct clean redirect query string parameter pass to static page
                if (event.slug) {
                  router.push(`/public/book-slot?event=${event.slug}&user=${rawUsername}`);
                }
              }}
              className="bg-[#141416] border border-zinc-800/80 rounded-xl p-5 shadow-md hover:border-zinc-600 transition-all duration-200 group cursor-pointer flex flex-col space-y-2 relative overflow-hidden"
            >
              <div className="space-y-1 pr-6">
                <h3 className="text-sm font-semibold text-white tracking-tight group-hover:underline">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-xs text-zinc-400 font-light truncate max-w-[500px]">
                    {event.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-1.5 bg-[#1d1d20] border border-zinc-800 text-zinc-400 text-[11px] font-medium px-2.5 py-1 rounded-md w-fit font-mono">
                <span>{event.duration}m</span>
              </div>

              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}