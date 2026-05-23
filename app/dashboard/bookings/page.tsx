"use client";

import React, { useState, useEffect, useRef } from "react";

export default function BookingsDashboardView() {
  // Category Tab state configurations
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [bookingsData, setBookingsData] = useState<{ upcoming: any[]; past: any[]; cancelled: any[] }>({
    upcoming: [],
    past: [],
    cancelled: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // State management to isolate open menus inside rows independently
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Hardcoded userId to sync directly with your database master user profile record mapping
  const MASTER_USER_ID = "63d7eb95-bc65-4f38-89c5-a6e54fca64f0";

  // Core background network fetch process layer
  const fetchDashboardRegistry = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/bookings?userId=${MASTER_USER_ID}`);
      const payload = await res.json();
      
      if (payload.success && payload.data) {
        setBookingsData({
          upcoming: payload.data.upcoming || [],
          past: payload.data.past || [],
          cancelled: payload.data.cancelled || []
        });
      } else {
        setErrorMsg(payload.error || "Failed reading booking matrices records.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network execution layer halted.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardRegistry();
  }, []);

  // Closes any floating interactive context menus if click occurs outside row items
  useEffect(() => {
    function clickOutsideBarrier(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", clickOutsideBarrier);
    return () => document.removeEventListener("mousedown", clickOutsideBarrier);
  }, []);

  // Execution call to trigger backend database structural mutation via PATCH handler 
  const handleCancelActionCall = async (bookingId: string) => {
    const confirmationNote = prompt("Enter cancellation reason subtext note:", "Cancelled via host dashboard.");
    if (confirmationNote === null) return; // Action aborted safely

    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, cancellationNote: confirmationNote })
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setOpenMenuId(null);
        // Instant hot-reloading context sync state across interface arrays
        await fetchDashboardRegistry();
      } else {
        alert(result.error || "Execution error encountered while updating state.");
      }
    } catch (err: any) {
      alert(err.message || "Failed running pipeline mutations rows.");
    }
  };

  const handleRescheduleMockAction = (bookingId: string) => {
    alert(`Redirecting profile window to public slot selector context matching booking parameter: ${bookingId}`);
    setOpenMenuId(null);
  };

  // Humanize standard ISO string records straight into dashboard formatting models
  const formatTimeSlotUI = (startStr: string, endStr: string) => {
    const sDate = new Date(startStr);
    const eDate = new Date(endStr);
    const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
    return `${sDate.toLocaleTimeString("en-US", options).toLowerCase()} - ${eDate.toLocaleTimeString("en-US", options).toLowerCase()}`;
  };

  const formatDateLabelUI = (startStr: string) => {
    const dateObj = new Date(startStr);
    const weekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString("en-US", { month: "short" });
    return `${weekday}, ${day} ${month}`;
  };

  const currentActiveList = bookingsData[activeTab];

  return (
    <div className="space-y-6 max-w-[960px] mx-auto select-none text-left">
      
      {/* HEADER SECTION LAYOUT PLATFORM */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-white font-sans">Bookings</h1>
        <p className="text-xs text-zinc-500 font-light">See upcoming and past events booked through your event type public links.</p>
      </div>

      {/* HORIZONTAL THREE-TAB CATEGORY STACK PANELS */}
      <div className="flex items-center space-x-1 border-b border-zinc-800/60 pb-px text-xs font-medium">
        {(["upcoming", "past", "cancelled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setOpenMenuId(null); }}
            className={`px-4 py-2 capitalize transition-all border-b-2 -mb-px font-semibold cursor-pointer ${
              activeTab === tab
                ? "border-white text-white font-bold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CORE WORKSPACE LISTING MONITOR DISPLAY TERMINALS */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-zinc-500 font-mono animate-pulse">
          Loading metrics dataset registry streams...
        </div>
      ) : errorMsg ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-mono">
          ⚠️ {errorMsg}
        </div>
      ) : currentActiveList.length === 0 ? (
        <div className="py-24 border border-dashed border-zinc-800/80 rounded-xl text-center space-y-2 bg-[#121214]/20">
          <p className="text-zinc-400 text-xs font-medium capitalize">No {activeTab} bookings found</p>
          <p className="text-zinc-600 text-[11px] font-light max-w-[280px] mx-auto leading-normal">
            When users select live open slot times on your event listings page, they will show up inside this dynamic tracking log.
          </p>
        </div>
      ) : (
        <div className="border border-zinc-800/60 rounded-xl overflow-hidden bg-[#141416]/60 shadow-2xl divide-y divide-zinc-900/60">
          {currentActiveList.map((booking) => (
            <div key={booking.id} className="p-5 flex items-start justify-between hover:bg-[#18181b]/30 transition-all group relative">
              
              {/* LEFT TIMEFRAME METADATA INDEX DECK */}
              <div className="flex items-start space-x-6">
                <div className="w-[110px] space-y-0.5 shrink-0 pt-0.5">
                  <p className="text-white text-xs font-semibold">{formatDateLabelUI(booking.startTime)}</p>
                  <p className="text-[11px] font-mono text-zinc-500">{formatTimeSlotUI(booking.startTime, booking.endTime)}</p>
                  
                  {/* JOIN LINK INTERACTION */}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert("Initializing Cal Video meeting layer protocols..."); }}
                    className="inline-flex items-center space-x-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-medium pt-1.5 transition-colors"
                  >
                    <span className="text-[10px]">📹</span>
                    <span>Join Cal Video</span>
                  </a>
                </div>

                {/* MIDDLE ROW SUBJECT SPECIFICATION META VALUES BLOCK */}
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-zinc-100 leading-normal">
                    {booking.eventType?.title || "Custom Meeting Session"} between {booking.bookerName} and Host
                  </h3>
                  <div className="text-[11px] text-zinc-500 font-light space-y-0.5">
                    <p className="font-mono text-zinc-400">{booking.bookerEmail}</p>
                    {booking.customResponses?.notes && (
                      <p className="italic text-zinc-500 text-[10px] bg-zinc-900/40 border border-zinc-800/30 px-2 py-1 rounded mt-1.5 max-w-[480px] break-words">
                        "{booking.customResponses.notes}"
                      </p>
                    )}
                    {booking.cancellationNote && activeTab === "cancelled" && (
                      <p className="text-red-400/80 text-[10px] bg-red-500/5 border border-red-500/10 px-2 py-1 rounded mt-1.5">
                        Reason: {booking.cancellationNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT CONTEXT DROPDOWN MANAGEMENT TRIGGER ACTION CONTROLS */}
              {activeTab === "upcoming" && (
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer text-xs"
                  >
                    •••
                  </button>

                  {/* ABSOLUTE TARGET ACTION POPOVER DECK */}
                  {openMenuId === booking.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 mt-1 w-44 bg-[#1c1c1e] border border-zinc-800 rounded-lg shadow-2xl z-50 py-1 font-medium animate-in fade-in slide-in-from-top-1 duration-100 text-xs"
                    >
                      <button
                        onClick={() => handleRescheduleMockAction(booking.id)}
                        className="w-full px-3 py-2 text-left text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        Reschedule booking
                      </button>
                      <button
                        onClick={() => handleCancelActionCall(booking.id)}
                        className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 transition-all cursor-pointer block border-t border-zinc-900/80 font-sans font-semibold"
                      >
                        Cancel event
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VISUAL BADGES CHIPS FOR COMPLETED OR TERMINATED WORKSPACES */}
              {activeTab === "past" && (
                <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded select-none">
                  Past
                </span>
              )}
              {activeTab === "cancelled" && (
                <span className="text-[10px] uppercase tracking-wider font-mono text-red-400/70 bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded select-none">
                  Cancelled
                </span>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}