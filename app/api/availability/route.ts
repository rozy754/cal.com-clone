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
        weekly_slots: true,   // 👈 FIXED: Schema relation naming ke sath perfect sync
        date_overrides: true, // 👈 FIXED: Schema relation naming ke sath perfect sync
      },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new schedule with default operational weekly slots setup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, timeZone, userId } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name or userId" },
        { status: 400 }
      );
    }

    // Create schedule with default Monday-Friday availability slots (9 AM to 5 PM)
    const newSchedule = await prisma.schedule.create({
      data: {
        name,
        timeZone: timeZone || "Asia/Kolkata",
        userId,
        weekly_slots: { // 👈 FIXED: Changed 'availability' nesting parameter to 'weekly_slots'
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
        weekly_slots: true, // 👈 FIXED: Relation array fetch target synchronized
      }
    });

    return NextResponse.json({ success: true, data: newSchedule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}