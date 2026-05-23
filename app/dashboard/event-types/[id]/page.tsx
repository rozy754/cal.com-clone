"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// Dynamic relational structure configurations
interface BookingQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
  hidden: boolean;
  isDefault?: boolean;
}

const MAP_INT_TO_DAY_NAME: { [key: number]: string } = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export default function EventEventTypeEditorWorkspace() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState<"basics" | "schedule" | "advanced">("basics");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Core Entity Properties States
  const [title, setTitle] = useState("Untitled Event");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState("Cal Video (Default)");
  
  // 1. GENUINE SCHEDULES TRACKING STATE HOOKS (Added for DB Integration)
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");

  // Booking Questions Master Layout State
  const [customQuestions, setCustomQuestions] = useState<BookingQuestion[]>([
    { id: "name", label: "Your name", type: "text", required: true, hidden: false, isDefault: true },
    { id: "email", label: "Email address", type: "email", required: true, hidden: false, isDefault: true },
  ]);

  // Modal Editing Window State variables
  const [editingQuestion, setEditingQuestion] = useState<BookingQuestion | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editType, setEditType] = useState("text");
  const [editRequired, setEditRequired] = useState(false);

  // FETCH TARGET EVENT DETAILS + FETCH GENUINE SCHEDULES ON MOUNT
  useEffect(() => {
    async function initWorkspaceData() {
      if (!eventId) return;
      try {
        // Step A: Fetch all genuine schedules from database first
        const scheduleResponse = await fetch("/api/availability");
        if (scheduleResponse.ok) {
          const rawSchedules = await scheduleResponse.json();
          const extractedSchedules = Array.isArray(rawSchedules) ? rawSchedules : rawSchedules?.data || rawSchedules?.schedules || [];
          setSchedules(extractedSchedules);
        }

        // Step B: Fetch the specific Event Type details
        const response = await fetch(`/api/event-type/${eventId}`);
        if (response.ok) {
          const result = await response.json();
          const event = result.data || result;
          
          setTitle(event.title || "Untitled Event");
          setDescription(event.description || "");
          setSlug(event.slug || "");
          setDuration(event.duration || 30);
          setLocation(event.location || "Cal Video (Default)");
          setSelectedScheduleId(event.scheduleId || ""); // Track initial bound scheduleId
          
          if (event.customQuestions && Object.keys(event.customQuestions).length > 0) {
            setCustomQuestions(event.customQuestions);
          }
        }
      } catch (error) {
        console.error("Failed initializing editor data tracks sync:", error);
      } finally {
        setIsLoading(false);
      }
    }
    initWorkspaceData();
  }, [eventId]);

  // LIVE PREVIEW CALCULATION ENGINE
  // Dynamic schedule mapping block: Matches chosen drop dropdown id to render slots list live!
  const currentActivePreviewSchedule = schedules.find((s) => s.id === selectedScheduleId);
  const weeklySlotsPreviewArray = currentActivePreviewSchedule?.weekly_slots || [];

  const toggleQuestionHidden = (id: string) => {
    if (id === "name" || id === "email") return;
    setCustomQuestions(
      customQuestions.map((q) => (q.id === id ? { ...q, hidden: !q.hidden } : q))
    );
  };

  const deleteQuestionField = (id: string) => {
    if (id === "name" || id === "email") return;
    setCustomQuestions(customQuestions.filter((q) => q.id !== id));
  };

  const openEditModal = (question: BookingQuestion) => {
    setEditingQuestion(question);
    setEditLabel(question.label);
    setEditType(question.type);
    setEditRequired(question.required);
  };

  const saveQuestionEdits = () => {
    if (!editingQuestion) return;
    setCustomQuestions(
      customQuestions.map((q) =>
        q.id === editingQuestion.id
          ? { 
              ...q, 
              label: editLabel, 
              type: editType, 
              required: q.id === "name" || q.id === "email" ? true : editRequired 
            }
          : q
      )
    );
    setEditingQuestion(null);
  };

  const addNewQuestionField = () => {
    const uniqueId = `custom-field-${Date.now()}`;
    const newField: BookingQuestion = {
      id: uniqueId,
      label: "Custom Question Field Name",
      type: "text",
      required: false,
      hidden: false,
      isDefault: false,
    };
    setCustomQuestions([...customQuestions, newField]);
  };

  // COMMITTING COMPLETE WORKSPACE RE-SAVE TRANSACTION (WITH SCHEDULE ID BINDING)
  const handleSaveWorkspace = async () => {
    if (!eventId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/event-type/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          slug,
          duration: Number(duration),
          location,
          customQuestions, 
          scheduleId: selectedScheduleId, // 👈 GENUINE BINDING: Saves selected dropdown choice straight to database model field!
        }),
      });

      if (response.ok) {
        router.push("/dashboard/event-types");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed executing event save transactional operation:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center space-y-2">
        <div className="text-xs text-zinc-500 font-medium animate-pulse">Syncing editor payload grid parameters...</div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      {/* HEADER CONTROLS NAVIGATION BANNER */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/dashboard/event-types")}
            className="p-1.5 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-900 rounded-md transition-all cursor-pointer flex items-center justify-center"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-base text-white">{title || "Untitled Slot Setup"}</span>
        </div>
        <button
          onClick={handleSaveWorkspace}
          disabled={isSaving}
          className="bg-white text-black font-semibold text-xs px-4 py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-40 transition-all cursor-pointer"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* CORE WORKSPACE SPLIT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* VIEW SHIFT BUTTON NAVIGATION COLUMN */}
        <nav className="flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab("basics")}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "basics" ? "bg-[#1c1c1f] text-white font-semibold" : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
            }`}
          >
            Basics <div className="text-[10px] font-light text-zinc-500 mt-0.5">{duration} mins</div>
          </button>
          <button
            onClick={() => setActiveTab("schedule")}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "schedule" ? "bg-[#1c1c1f] text-white font-semibold" : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
            }`}
          >
            Availability <div className="text-[10px] font-light text-zinc-500 mt-0.5">
              {currentActivePreviewSchedule?.name || "Select Schedule"}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("advanced")}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === "advanced" ? "bg-[#1c1c1f] text-white font-semibold" : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
            }`}
          >
            Advanced <div className="text-[10px] font-light text-zinc-500 mt-0.5">Booking questions</div>
          </button>
        </nav>

        {/* COMPONENT DESK CONTEXT CONTAINER */}
        <div className="md:col-span-3 bg-[#141416] border border-zinc-800 rounded-xl p-6 shadow-xl">
          
          {/* TAB 1: BASICS */}
          {activeTab === "basics" && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors resize-none font-light leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">URL Slug</label>
                <div className="flex rounded-lg overflow-hidden border border-zinc-800 bg-[#0b0b0c]">
                  <span className="bg-zinc-900/60 text-xs px-3 py-2 text-zinc-500 border-r border-zinc-800 flex items-center select-none font-mono">cal.com/rozy/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Location Context</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors"
                  >
                    <option>Cal Video (Default)</option>
                    <option>Google Meet</option>
                    <option>Phone Call</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE (Retrieved and bound to genuine backend tables) */}
          {activeTab === "schedule" && (
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  Active Target Schedule
                </label>
                
                {/* DYNAMIC RETRIEVED SELECT DROPDOWN ROW */}
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer"
                >
                  <option value="" disabled>-- Select a Genuine Schedule --</option>
                  {schedules.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} ({sch.timeZone || "Asia/Kolkata"})
                    </option>
                  ))}
                </select>
              </div>

              {/* LIVE TIME PREVIEW MATRIX */}
              <div className="border-t border-zinc-800/80 pt-4 space-y-3">
                <h4 className="text-[11px] font-semibold uppercase text-zinc-400 tracking-wider mb-2">
                  Timeline Schedule Preview ({currentActivePreviewSchedule?.name || "No Schedule Chosen"})
                </h4>
                
                {/* Dynamically loops integers from 0 to 6 based on database array availability rows */}
                {[1, 2, 3, 4, 5, 6, 0].map((dayInt) => {
                  const activeSlot = weeklySlotsPreviewArray.find((slot: any) => slot.dayOfWeek === dayInt);
                  return (
                    <div key={dayInt} className="flex justify-between items-center text-xs border-b border-zinc-900/40 pb-2">
                      <span className="font-medium text-zinc-300">{MAP_INT_TO_DAY_NAME[dayInt]}</span>
                      <span className={!activeSlot ? "text-zinc-600 font-light italic" : "text-white font-mono font-medium"}>
                        {activeSlot ? `${activeSlot.startTime} - ${activeSlot.endTime}` : "Unavailable"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ADVANCED */}
          {activeTab === "advanced" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Booking questions</h3>
                <p className="text-xs text-zinc-400 mt-1 font-light leading-relaxed">
                  Customize the parameters data forms your booker must complete before checking out slots.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-xl bg-[#0b0b0c] overflow-hidden divide-y divide-zinc-800/80 shadow-inner">
                {customQuestions.map((q) => {
                  const isCore = q.id === "name" || q.id === "email";
                  return (
                    <div 
                      key={q.id} 
                      className={`p-4 flex items-center justify-between transition-colors ${
                        q.hidden ? "opacity-35 bg-zinc-900/10" : "hover:bg-zinc-900/20"
                      }`}
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-white">{q.label}</span>
                          {q.required && <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-light">Required</span>}
                          {q.hidden && <span className="text-[10px] bg-red-950/40 border border-red-900/40 text-red-400 px-1.5 py-0.5 rounded font-light">Hidden</span>}
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono font-light uppercase tracking-tight">Type: {q.type}</p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {!isCore ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleQuestionHidden(q.id)}
                              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                                q.hidden ? "bg-zinc-800" : "bg-white"
                              }`}
                            >
                              <div className={`w-3 h-3 rounded-full shadow transform transition-transform duration-200 ${q.hidden ? "translate-x-0 bg-zinc-400" : "translate-x-3 bg-black"}`} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteQuestionField(q.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-md hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center"
                              title="Delete Question"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1h.5m-.5 3h16" />
                              </svg>
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openEditModal(q)}
                          className="text-[11px] font-medium text-zinc-400 hover:text-white border border-zinc-800 bg-[#141416] px-2.5 py-1 rounded-md hover:bg-zinc-900 transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={addNewQuestionField}
                  className="text-xs font-semibold text-zinc-300 border border-zinc-800 bg-[#0b0b0c] px-4 py-2 rounded-lg hover:bg-zinc-900 transition-all cursor-pointer flex items-center space-x-2"
                >
                  <span>+ Add a question</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* POPUP SYSTEM DIALOG MODAL LAYOUT */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#141416] border border-zinc-800 w-full max-w-md rounded-xl p-6 space-y-4 shadow-2xl scale-in duration-200">
            <div>
              <h3 className="text-sm font-semibold text-white">Edit booking field question</h3>
              <p className="text-xs text-zinc-500 mt-0.5 font-light">Modify configuration parameters context bindings.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Question Label Text</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Input Render Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full bg-[#0b0b0c] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition-all"
                >
                  <option value="text">Short Text Box</option>
                  <option value="email">Email String Field</option>
                  <option value="phone">Phone Int Field</option>
                  <option value="textarea">Long Textarea Block</option>
                </select>
              </div>
              {editingQuestion.id !== "name" && editingQuestion.id !== "email" && (
                <div className="flex items-center justify-between p-2 bg-[#0b0b0c] border border-zinc-800 rounded-lg">
                  <span className="text-xs font-medium text-zinc-400">Mandatory Required Input Field</span>
                  <input
                    type="checkbox"
                    checked={editRequired}
                    onChange={(e) => setEditRequired(e.target.checked)}
                    className="w-3.5 h-3.5 accent-white rounded bg-black border-zinc-800 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800/60">
              <button type="button" onClick={() => setEditingQuestion(null)} className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={saveQuestionEdits} className="bg-white text-black font-semibold text-xs px-4 py-1.5 rounded-md hover:bg-zinc-200 transition-colors cursor-pointer">Apply Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}