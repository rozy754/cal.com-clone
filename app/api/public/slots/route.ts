import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// Helper: HH:MM string ko minutes mein badalne ke liye
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper: Minutes ko wapas HH:MM string mein badalne ke liye
function minutesToTime(mins: number): string {
  const hours = Math.floor(mins / 60).toString().padStart(2, "0");
  const minutes = (mins % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventTypeId = searchParams.get("eventTypeId");
    const scheduleId = searchParams.get("scheduleId");
    const dateStr = searchParams.get("date"); // Format: YYYY-MM-DD

    if (!eventTypeId || !scheduleId || !dateStr) {
      return NextResponse.json(
        { success: false, error: "Missing parameters: eventTypeId, scheduleId, or date" },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // 1. Fetch Event Type configuration metadata
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
    });

    if (!eventType || !eventType.isActive) {
      return NextResponse.json({ success: false, error: "Event type not found or inactive" }, { status: 404 });
    }

    // 2. Fetch Schedule along with weekly slots and date overrides
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        weekly_slots: true,
        date_overrides: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ success: false, error: "Schedule context not found" }, { status: 404 });
    }

    // 3. Resolve active timing ranges for this date
    let activeRanges: { startTime: string; endTime: string }[] = [];

    // Filter dynamic overrides securely matching ISO split strings
    const override = schedule.date_overrides.find(
      (ov) => new Date(ov.date).toISOString().split("T")[0] === dateStr
    );

    if (override) {
      if (override.isBlocked) {
        return NextResponse.json({ success: true, date: dateStr, slots: [] }); // Fully blocked day
      }
      if (override.startTime && override.endTime) {
        activeRanges.push({ startTime: override.startTime, endTime: override.endTime });
      }
    } else {
      // Fetch standard weekly configurations
      const standardSlots = schedule.weekly_slots.filter((s) => s.dayOfWeek === dayOfWeek);
      standardSlots.forEach((s) => activeRanges.push({ startTime: s.startTime, endTime: s.endTime }));
    }

    if (activeRanges.length === 0) {
      return NextResponse.json({ success: true, date: dateStr, slots: [] }); // Non-working day
    }

    // 4. Generate base raw time slices matching event duration
    let rawSlots: { start: number; end: number }[] = [];
    const duration = eventType.duration;

    activeRanges.forEach((range) => {
      let currentMins = timeToMinutes(range.startTime);
      const endMins = timeToMinutes(range.endTime);

      while (currentMins + duration <= endMins) {
        rawSlots.push({
          start: currentMins,
          end: currentMins + duration,
        });
        currentMins += duration; // Dynamic increment chunk loop
      }
    });

    // 5. Notice Period Filtering (If user is trying to book for today)
    const now = new Date();
    // Host timezone configuration layout conversion
    const localTodayStr = now.toLocaleDateString("en-CA", { timeZone: schedule.timeZone }); // Returns YYYY-MM-DD safely

    if (localTodayStr === dateStr) {
      const currentMinsInDay = now.getHours() * 60 + now.getMinutes();
      const minimumCutoff = currentMinsInDay + eventType.minNoticePeriod;
      rawSlots = rawSlots.filter((slot) => slot.start >= minimumCutoff);
    }

    // 6. Double-Booking Prevention (Fetch active conflicts inside strict ranges)
    const existingBookings = await prisma.booking.findMany({
      where: {
        eventTypeId: eventType.id,
        status: { in: ["UPCOMING", "RESCHEDULED"] },
        startTime: { gte: new Date(`${dateStr}T00:00:00.000Z`) },
        endTime: { lte: new Date(`${dateStr}T23:59:59.999Z`) },
      },
    });

    // Extract locked ranges with buffer requirements added
    const buffer = eventType.bufferTime;
    const bookedBlocks = existingBookings.map((b) => {
      const startMins = b.startTime.getUTCHours() * 60 + b.startTime.getUTCMinutes();
      const endMins = b.endTime.getUTCHours() * 60 + b.endTime.getUTCMinutes();
      return {
        start: startMins - buffer,
        end: endMins + buffer,
      };
    });

    // Check overlaps to safely build final available items array
    const finalSlots = rawSlots.filter((slot) => {
      const isOverlap = bookedBlocks.some(
        (booked) => !(slot.end <= booked.start || slot.start >= booked.end)
      );
      return !isOverlap;
    });

    // 7. Parse minutes back to standard clean output display strings
    const formattedSlots = finalSlots.map((slot) => ({
      startTime: minutesToTime(slot.start),
      endTime: minutesToTime(slot.end),
    }));

    return NextResponse.json({
      success: true,
      date: dateStr,
      slots: formattedSlots,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}