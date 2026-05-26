"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface EventType {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: number;
  isActive: boolean;
}

export default function EventTypesPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // FETCH LIVE DATA FROM DATABASE VIA YOUR API ROUTE
  useEffect(() => {
    async function getEventTypes() {
      try {
        const response = await fetch("/api/event-type");
        if (response.ok) {
          const result = await response.json();
          setEvents(result.data || []);
        }
      } catch (error) {
        console.error("Failed to sync database events feed:", error);
      } finally {
        setIsLoading(false);
      }
    }
    getEventTypes();
  }, []);

  // TOGGLE ISACTIVE SWITCH AND TRIGGER PATCH TO DB
  const toggleEventActive = async (id: string, currentStatus: boolean) => {
    setEvents(events.map((ev) => (ev.id === id ? { ...ev, isActive: !ev.isActive } : ev)));

    try {
      await fetch(`/api/event-type/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
    } catch (error) {
      console.error("Failed to commit toggle status state modification to database:", error);
    }
  };

  // DELETE EVENT FROM DATABASE
  const handleDeleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/event-type/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvents(events.filter((ev) => ev.id !== id));
        setOpenMenuId(null);
      } else {
        console.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#101011]">
      {/* CONTROL ACTIONS STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Event types</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure different events for people to book on your calendar.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111111] text-xs text-zinc-300 pl-8 pr-3 py-2 rounded-md border border-zinc-800 focus:outline-none focus:border-zinc-700 w-48 transition-all placeholder-zinc-600"
            />
            <svg className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => router.push("/dashboard/event-types/new")}
            className="bg-white text-black text-xs font-medium px-3.5 py-2 rounded-md hover:bg-zinc-200 transition-colors shrink-0"
          >
            + New
          </button>
        </div>
      </div>

      {/* RENDER RUNTIME LOADING STATE FALLBACK */}
      {isLoading ? (
        <div className="text-xs text-zinc-500 py-4">Syncing live databases feeds...</div>
      ) : (
        /* ✅ FIXED: Hataya overflow-hidden taaki menu boundary se bahar safely render ho sake */
        <div className="w-full border border-zinc-800 rounded-lg bg-[#09090b] divide-y divide-zinc-800/80 shadow-xl">
          {filteredEvents.map((event, index) => {
            // ✅ DYNAMIC DIRECTION LOGIC: Agar aakhri ya second last element hai toh dropdown upar khulega
            const isLastItems = index >= filteredEvents.length - 2 && filteredEvents.length > 2;

            return (
              <div
                key={event.id}
                className="p-4 flex items-center justify-between hover:bg-zinc-900/40 transition-all duration-150 group"
              >
                <div className="space-y-1 pr-4 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h2 
                      onClick={() => router.push(`/dashboard/event-types/${event.id}`)}
                      className="text-sm font-medium text-white hover:underline cursor-pointer truncate"
                    >
                      {event.title}
                    </h2>
                    <span className="text-xs text-zinc-500 font-mono truncate">
                      /rozy-koranga-forwy0/{event.slug}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1 font-light">
                    {event.description || "No description provided."}
                  </p>
                  <div className="flex items-center pt-1">
                    <span className="inline-flex items-center text-[11px] font-medium text-zinc-400">
                      <svg className="h-3.5 w-3.5 mr-1 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {event.duration}m
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTON WRAPPER ROW */}
                <div className="flex items-center space-x-2 shrink-0 pl-2 relative">
                  <button
                    onClick={() => toggleEventActive(event.id, event.isActive)}
                    className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                      event.isActive ? "bg-white" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full shadow-sm transform transition-transform duration-200 ${
                        event.isActive ? "translate-x-3.5 bg-black" : "translate-x-0 bg-zinc-400"
                      }`}
                    />
                  </button>

                  {/* THREE DOTS DROPDOWN MENU */}
                  <div className="relative">
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                      className="p-1.5 text-zinc-400 hover:text-white border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>

                    {/* DROPDOWN MENU CONTENT */}
                    {openMenuId === event.id && (
                      <div 
                        className={`absolute right-0 w-32 bg-[#1a1a1e] border border-zinc-800 rounded-md shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 ${
                          isLastItems ? "bottom-full mb-1 origin-bottom-right" : "top-full mt-1 origin-top-right"
                        }`}
                      >
                        <button
                          onClick={() => {
                            router.push(`/dashboard/event-types/${event.id}`);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors rounded-t-md cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors rounded-b-md border-t border-zinc-800 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="p-8 text-center text-xs text-zinc-500">
              No live event arrangements found in database matching selection parameters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}