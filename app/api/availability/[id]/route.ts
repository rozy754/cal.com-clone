import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Fetch individual schedule with all availability slots and date overrides
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        weekly_slots: true,   // 👈 EXACT MATCH WITH YOUR PRISMA LOGS
        date_overrides: true, // 👈 EXACT MATCH WITH YOUR PRISMA LOGS
        eventTypes: true,    
        user: true,          
      },
    });

    if (!schedule) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: schedule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update schedule metadata, availability slots, and date overrides in a transaction
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, timeZone, isDefault, availabilities, overrides } = body;

    // Check if the target schedule exists
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update schedule metadata
      const main = await tx.schedule.update({
        where: { id },
        data: {
          name,
          timeZone,
          isDefault: isDefault ?? false,
        },
      });

      // Update availability slots if provided
      if (availabilities) {
        await tx.availability.deleteMany({ where: { scheduleId: id } });
        await tx.availability.createMany({
          data: availabilities.map((slot: any) => ({
            dayOfWeek: Number(slot.dayOfWeek),
            startTime: slot.startTime,
            endTime: slot.endTime,
            scheduleId: id,
          })),
        });
      }

      // Update date overrides if provided
      if (overrides) {
        await tx.dateOverride.deleteMany({ where: { scheduleId: id } });
        await tx.dateOverride.createMany({
          data: overrides.map((ov: any) => ({
            date: new Date(ov.date),
            isBlocked: ov.isBlocked ?? false,
            startTime: ov.isBlocked ? null : ov.startTime,
            endTime: ov.isBlocked ? null : ov.endTime,
            scheduleId: id,
          })),
        });
      }

      return main;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Drop a master schedule completely
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    await prisma.schedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Schedule dropped completely!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}