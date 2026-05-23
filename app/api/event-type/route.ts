import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// 1. GET: Fetch all event types
export async function GET() {
  try {
    const eventTypes = await prisma.eventType.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        schedule: {
          select: { name: true, timeZone: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: eventTypes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. POST: Create a new event type
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      slug,
      description,
      location,
      duration,
      scheduleId,
      customQuestions,
      minNoticePeriod,
      bufferTime,
    } = body;

    // Validation - title, slug, and duration are required
    if (!title || !slug || !duration) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, slug, or duration" },
        { status: 400 }
      );
    }

    // FIXED: Only search databases if frontend did NOT provide a specific scheduleId
    let finalScheduleId = scheduleId;
    
    if (!finalScheduleId) {
      const defaultSchedule = await prisma.schedule.findFirst({
        where: { isDefault: true }
      });

      if (defaultSchedule) {
        finalScheduleId = defaultSchedule.id;
      } else {
        // Agar koi explicit default marked nahi hai, toh database ka pehla available schedule le lo
        const fallbackSchedule = await prisma.schedule.findFirst();
        if (fallbackSchedule) {
          finalScheduleId = fallbackSchedule.id;
        } else {
          // Agar pure database mein ek bhi schedule nahi hai, tabhi sirf yeh response jaye
          return NextResponse.json(
            { success: false, error: "Please create at least one availability schedule in your dashboard first!" },
            { status: 400 }
          );
        }
      }
    }

    // Check if slug is taken
    const existingEvent = await prisma.eventType.findUnique({
      where: { slug }
    });

    if (existingEvent) {
      return NextResponse.json(
        { success: false, error: "Unique URL (slug) is already taken!" },
        { status: 400 }
      );
    }

    const newEvent = await prisma.eventType.create({
      data: {
        title,
        slug,
        description,
        location: location || "Google Meet",
        duration: Number(duration),
        scheduleId: finalScheduleId,
        customQuestions: customQuestions || [],
        minNoticePeriod: minNoticePeriod ? Number(minNoticePeriod) : 120,
        bufferTime: bufferTime ? Number(bufferTime) : 0,
      }
    });

    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}