"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { availabilityApi } from "../../utils/api";

// Mapping frontend days names to strict Prisma Schema Integer footprints
const MAP_DAY_TO_INT: { [key: string]: number } = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const MAP_INT_TO_DAY: { [key: number]: string } = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

const ORDERED_DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

export default function AvailabilityGridEditorWorkspace() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [scheduleName, setScheduleName] = useState("Working hours");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [days, setDays] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);

  // LOAD AND MAP SNAPSHOT FIELDS
  useEffect(() => {
    async function loadScheduleDetails() {
      if (!scheduleId) return;
      try {
        const response = await availabilityApi.getById(scheduleId);
        const schedule = response?.data || response;
        
        setScheduleName(schedule.name || "Working hours");
        setTimezone(schedule.timeZone || schedule.timezone || "Asia/Kolkata");

        // Map Overrides from schema's date_overrides key context safely
        const rawOverrides = schedule.date_overrides || schedule.overrides || [];
        const formattedOverrides = rawOverrides.map((ov: any) => ({
          id: ov.id,
          // Extracting strict "YYYY-MM-DD" string from full dynamic DateTime stamp
          date: ov.date ? new Date(ov.date).toISOString().split("T")[0] : "",
          startTime: ov.startTime || "09:00",
          endTime: ov.endTime || "17:00",
        }));
        setOverrides(formattedOverrides);

        // Map weekly slots arrays from schema's weekly_slots key context safely
        let databaseSlots = schedule.weekly_slots || [];
        const structuredDays = ORDERED_DAYS.map((dayName) => {
          const targetInt = MAP_DAY_TO_INT[dayName];
          const matchedSlot = databaseSlots.find((slot: any) => slot.dayOfWeek === targetInt);
          
          return {
            day: dayName,
            enabled: matchedSlot ? true : (dayName !== "SUNDAY" && dayName !== "SATURDAY"),
            startTime: matchedSlot ? matchedSlot.startTime : "09:00",
            endTime: matchedSlot ? matchedSlot.endTime : "17:00",
          };
        });
        
        setDays(structuredDays);
      } catch (err) {
        console.error("Failed executing structural dynamic configuration bindings:", err);
        router.push("/dashboard/availability");
      } finally {
        setIsLoading(false);
      }
    }
    loadScheduleDetails();
  }, [scheduleId, router]);

  const handleToggleDay = (index: number) => {
    const updated = [...days];
    updated[index].enabled = !updated[index].enabled;
    setDays(updated);
  };

  const handleTimeChange = (index: number, field: "startTime" | "endTime", value: string) => {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  };

  const handleAddOverride = () => {
    const newOverride = {
      id: `override-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
    };
    setOverrides([...overrides, newOverride]);
  };

  const handleOverrideChange = (id: string, field: string, value: string) => {
    setOverrides(overrides.map((ov) => (ov.id === id ? { ...ov, [field]: value } : ov)));
  };

  const handleRemoveOverride = (id: string) => {
    setOverrides(overrides.filter((ov) => ov.id !== id));
  };

  // TRANSMIT PAYLOAD BACKEND RULES MATCHING PRISMA DATA
  const handleSaveSchedule = async () => {
    if (!scheduleId) return;
    setIsSaving(true);
    try {
      const payload = {
        name: scheduleName,
        timeZone: timezone, // Matches strict schema name exactly
        
        // Transform and filter only ENABLED slots mapped to structural integers
        weekly_slots: days
          .filter((d) => d.enabled)
          .map((d) => ({
            dayOfWeek: MAP_DAY_TO_INT[d.day],
            startTime: d.startTime || "09:00",
            endTime: d.endTime || "17:00",
          })),

        // Transform string date stamps to ISO strings parsing checks
        date_overrides: overrides.map((ov) => ({
          date: new Date(ov.date).toISOString(),
          isBlocked: false,
          startTime: ov.startTime || "09:00",
          endTime: ov.endTime || "17:00",
        })),
      };

      await availabilityApi.update(scheduleId, payload);
      
      router.push("/dashboard/availability");
      router.refresh();
    } catch (err) {
      console.error("Save schema mutations transactional execution dropped:", err);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center text-xs text-zinc-500 animate-pulse font-medium">
        Syncing schedule config workspace layout...
      </div>
    );
  }

  return (
    <div className="w-full pb-20 text-white flex flex-col md:flex-row gap-8 items-start animate-in fade-in duration-200">
      
      {/* LEFT PRIMARY STREAM FORM LAYER */}
      <div className="flex-1 space-y-6 max-w-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/dashboard/availability")}
              className="p-1.5 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 rounded-md text-xs cursor-pointer"
            >
              ←
            </button>
            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="bg-transparent font-semibold text-base text-white border-b border-transparent focus:border-zinc-700 outline-none px-1"
            />
          </div>
          <button
            onClick={handleSaveSchedule}
            disabled={isSaving}
            className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-40 transition-colors cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* RECURRING SLOTS CONTAINER MODULE */}
        <div className="bg-[#101011] border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/60 shadow-lg">
          {days.map((item, index) => (
            <div key={item.day} className="p-4 flex items-center justify-between group">
              <div className="flex items-center space-x-3.5 w-32">
                <button
                  type="button"
                  onClick={() => handleToggleDay(index)}
                  className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors ${
                    item.enabled ? "bg-white" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full shadow transform transition-transform ${item.enabled ? "translate-x-3 bg-black" : "translate-x-0 bg-zinc-400"}`} />
                </button>
                <span className="text-xs font-semibold capitalize select-none">{item.day.toLowerCase()}</span>
              </div>

              <div className="flex-1 flex items-center justify-start">
                {item.enabled ? (
                  <div className="flex items-center space-x-2 bg-[#141416] border border-zinc-800 rounded-lg p-1">
                    <input
                      type="text"
                      value={item.startTime}
                      onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                      className="bg-black border border-zinc-800 rounded px-2 py-1 text-center font-mono text-xs w-16 focus:outline-none"
                    />
                    <span className="text-zinc-600 text-xs select-none">-</span>
                    <input
                      type="text"
                      value={item.endTime}
                      onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                      className="bg-black border border-zinc-800 rounded px-2 py-1 text-center font-mono text-xs w-16 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600 italic select-none font-light pl-2">Unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CALENDAR BLOCK DATE OVERRIDES MODULE */}
        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Date overrides</h4>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-light">Add dates when your availability changes from your daily hours loops.</p>
          </div>

          <div className="space-y-2">
            {overrides.map((ov) => (
              <div key={ov.id} className="flex items-center space-x-3 bg-[#0b0b0c] p-3 border border-zinc-800 rounded-lg animate-in slide-in-from-top-1 duration-150">
                <input
                  type="date"
                  value={ov.date}
                  onChange={(e) => handleOverrideChange(ov.id, "date", e.target.value)}
                  className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                />
                <div className="flex items-center space-x-2 bg-[#141416] border border-zinc-800 rounded-lg p-1">
                  <input
                    type="text"
                    value={ov.startTime}
                    onChange={(e) => handleOverrideChange(ov.id, "startTime", e.target.value)}
                    className="bg-black border border-zinc-800 rounded px-2 py-1 text-center font-mono text-xs w-16 focus:outline-none"
                  />
                  <span className="text-zinc-600 text-xs">-</span>
                  <input
                    type="text"
                    value={ov.endTime}
                    onChange={(e) => handleOverrideChange(ov.id, "endTime", e.target.value)}
                    className="bg-black border border-zinc-800 rounded px-2 py-1 text-center font-mono text-xs w-16 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOverride(ov.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-md hover:bg-zinc-900 font-semibold cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddOverride}
            className="text-xs font-semibold text-zinc-300 border border-zinc-800 bg-[#0b0b0c] px-4 py-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            + Add an override
          </button>
        </div>
      </div>

      {/* RIGHT TIMEZONE DROPDOWN BAR COLUMN */}
      <div className="w-full md:w-64 space-y-4 shrink-0">
        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg">
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>

        <div className="bg-[#141416]/50 border border-zinc-800/60 rounded-xl p-4 space-y-2">
          <h5 className="text-xs font-medium text-white">Something doesn't look right?</h5>
          <button type="button" className="text-[11px] text-zinc-400 border border-zinc-800 bg-[#0b0b0c] px-3 py-1.5 rounded-md hover:bg-zinc-900 font-medium cursor-pointer">
            Launch troubleshooter
          </button>
        </div>
      </div>

    </div>
  );
}