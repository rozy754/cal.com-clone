import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// GET: Fetch all schedules with their simplified relational slot trees
export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        eventTypes: true,
        user: true,
        weekly_slots: true,   // Schema relation naming ke sath perfect sync
        date_overrides: true, // Schema relation naming ke sath perfect sync
      },
    });

    // Directly return the array so frontend schedules.map doesn't crash on layout wrappers
    return NextResponse.json(schedules);
  } catch (error: any) {
    return NextResponse.json([], { status: 500 });
  }
}

// POST: Create a new schedule with default operational weekly slots setup
export async function POST(req: NextRequest) {
  try {
    // 1. AUTO-BYPASS USER AUTH: Database mein pehla user dhoondo, nahi to default dummy admin banao
    let targetUser = await prisma.user.findFirst();
    if (!targetUser) {
      targetUser = await prisma.user.create({
        data: {
          email: "admin@cal.com",
          name: "Default Admin",
        },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { name, timeZone } = body;

    // Use default fallback name if frontend passes empty body parameters
    const finalName = name || "Working hours";

    // 2. Clear .create transactional mapping block (NO UPSERT, NO OVERWRITE)
    const newSchedule = await prisma.schedule.create({
      data: {
        name: finalName,
        timeZone: timeZone || "Asia/Kolkata",
        userId: targetUser.id, // 👈 Directly linking to our locked fallback user ID
        weekly_slots: { 
          createMany: {
            data: [
              { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Mon
              { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }, // Tue
              { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }, // Wed
              { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }, // Thu
              { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" }, // Fri
            ],
          },
        },
      },
      include: {
        weekly_slots: true, 
        date_overrides: true,
      }
    });

    // Return exact object mapping format wrapper so frontend reads target.id smoothly
    return NextResponse.json({ success: true, data: newSchedule }, { status: 201 });
  } catch (error: any) {
    console.error("Backend failed true CREATE database allocation operation:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}