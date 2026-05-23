/**
 * CAL.COM CLONE - API Layer Client Utilities
 * Maps directly over your backend routes for Event Type Management
 */

export interface CustomQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
  hidden?: boolean;
}

export interface EventTypeData {
  id?: string;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  location?: string;
  isActive?: boolean;
  minNoticePeriod?: number;
  bufferTime?: number;
  scheduleId?: string;
  customQuestions?: CustomQuestion[] | any;
}

const BASE_URL = "/api/event-type";

/**
 * Core Network Fetch Wrapper Engine
 * Handles explicit error reporting for JSON payload streams
 */
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.error || `HTTP Network Execution Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const eventTypeApi = {
  /**
   * 1. GET ALL EVENT TYPES
   * Maps to: GET /api/event-type
   */
  getAll: async (): Promise<EventTypeData[]> => {
    return apiRequest<EventTypeData[]>(BASE_URL);
  },

  /**
   * 2. GET SINGLE EVENT TYPE BY ID
   * Maps to: GET /api/event-type/[id]
   */
  getById: async (id: string): Promise<EventTypeData> => {
    return apiRequest<EventTypeData>(`${BASE_URL}/${id}`);
  },

  /**
   * 3. CREATE NEW EVENT TYPE
   * Maps to: POST /api/event-type
   */
  create: async (data: EventTypeData): Promise<EventTypeData> => {
    return apiRequest<EventTypeData>(BASE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * 4. UPDATE EXISTING EVENT TYPE (Basics, Schedule, and Custom Questions Matrix)
   * Maps to: PUT /api/event-type/[id]
   */
  update: async (id: string, data: Partial<EventTypeData>): Promise<EventTypeData> => {
    return apiRequest<EventTypeData>(`${BASE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * 5. TOGGLE ISACTIVE OR PATCH INDIVIDUAL ATTR
   * Maps to: PATCH /api/event-type/[id]
   */
  patch: async (id: string, data: { isActive: boolean }): Promise<EventTypeData> => {
    return apiRequest<EventTypeData>(`${BASE_URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * 6. DELETE EVENT TYPE CONTEXT ENTRY
   * Maps to: DELETE /api/event-type/[id]
   */
  delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
    return apiRequest<{ success: boolean; message?: string }>(`${BASE_URL}/${id}`, {
      method: "DELETE",
    });
  },
};
export interface ScheduleDay {
  id?: string;
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface DateOverride {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityData {
  id?: string;
  name: string;
  isDefault?: boolean;
  timezone?: string;
  days: ScheduleDay[];
  overrides?: DateOverride[];
}

const AVAILABILITY_BASE_URL = "/api/availability";

export const availabilityApi = {
  getAll: async (): Promise<any> => {
    const response = await fetch(AVAILABILITY_BASE_URL);
    return response.json();
  },

  getById: async (id: string): Promise<any> => {
    const response = await fetch(`${AVAILABILITY_BASE_URL}/${id}`);
    return response.json();
  },

  create: async (data: any): Promise<any> => {
    const response = await fetch(AVAILABILITY_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: string, data: any): Promise<any> => {
    const response = await fetch(`${AVAILABILITY_BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: string): Promise<any> => {
    const response = await fetch(`${AVAILABILITY_BASE_URL}/${id}`, {
      method: "DELETE",
    });
    return response.json();
  },
};