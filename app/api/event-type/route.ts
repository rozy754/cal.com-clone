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

// 2. POST: NextRequest wrapper formats for strict method detection
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

    // If scheduleId is not provided, use the default schedule
    let finalScheduleId = scheduleId;
    if (!finalScheduleId) {
      const defaultSchedule = await prisma.schedule.findFirst({
        where: { isDefault: true }
      });

      if (!defaultSchedule) {
        return NextResponse.json(
          { success: false, error: "No default schedule found. Please create a schedule first." },
          { status: 400 }
        );
      }

      finalScheduleId = defaultSchedule.id;
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
