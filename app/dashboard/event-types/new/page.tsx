"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { eventTypeApi } from "../../utils/api";

export default function NewEventAutoProvisioner() {
  const router = useRouter();
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Preventing double network trigger flags inside React StrictMode
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    async function provisionNewDefaultEvent() {
      try {
        // Generate a random 4-digit number to make the initial slug unique
        const randomSeed = Math.floor(1000 + Math.random() * 9000);
        
        // 1. Commit a clean default shell entry right into your Prisma Database
        const newEvent = await eventTypeApi.create({
          title: "Untitled Event",
          slug: `untitled-slot-${randomSeed}`,
          description: "Add a helpful description details block here.",
          duration: 30,
          location: "Cal Video (Default)",
          isActive: true,
        });

        // 2. Safely direct the user into the Workspace Editor matching your [id] route
        if (newEvent && newEvent.id) {
          router.replace(`/dashboard/event-types/${newEvent.id}`);
        } else {
          // Fallback if the payload response structure changes
          router.push("/dashboard/event-types");
        }
      } catch (error) {
        console.error("Failed to automatically provision default database row slot:", error);
        // Fall back gracefully to primary dashboard view if network operations fail
        router.push("/dashboard/event-types");
      }
    }

    provisionNewDefaultEvent();
  }, [router]);

  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4 select-none">
      {/* Sleek Minimal Loading Ring Spinner */}
      <svg className="animate-spin h-6 w-6 text-white opacity-80" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="text-xs text-zinc-500 font-medium tracking-wide animate-pulse">
        Provisioning a fresh workspace slot...
      </p>
    </div>
  );
}