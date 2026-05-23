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
        weekly_slots: true,   // Exact sync with your Prisma relations mapping
        date_overrides: true, // Exact sync with your Prisma relations mapping
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
    
    // 1. FIXED: Destructuring parameters mapping exactly what frontend transmits
    const { name, timeZone, isDefault, weekly_slots, date_overrides } = body;

    // Check if the target schedule exists
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    // 2. Perform safe relational updates inside a clean transaction block
   const updated = await prisma.$transaction(async (tx: any) => {
      // Update schedule metadata
      await tx.schedule.update({
        where: { id },
        data: {
          name,
          timeZone: timeZone || "Asia/Kolkata",
          isDefault: isDefault ?? false,
        },
      });

      // FIXED: Safely cascade delete & re-create weekly slots if present in request body
      if (weekly_slots) {
        await tx.availability.deleteMany({ where: { scheduleId: id } });
        if (weekly_slots.length > 0) {
          await tx.availability.createMany({
            data: weekly_slots.map((slot: any) => ({
              dayOfWeek: Number(slot.dayOfWeek),
              startTime: slot.startTime,
              endTime: slot.endTime,
              scheduleId: id,
            })),
          });
        }
      }

      // FIXED: Safely cascade delete & re-create date overrides if present in request body
      if (date_overrides) {
        await tx.dateOverride.deleteMany({ where: { scheduleId: id } });
        if (date_overrides.length > 0) {
          await tx.dateOverride.createMany({
            data: date_overrides.map((ov: any) => ({
              date: new Date(ov.date),
              isBlocked: ov.isBlocked ?? false,
              startTime: ov.isBlocked ? null : ov.startTime,
              endTime: ov.isBlocked ? null : ov.endTime,
              scheduleId: id,
            })),
          });
        }
      }

      // 3. FIXED: Fetch fully updated record snapshot including fresh child models relation array tracks
      const comprehensiveSnapshot = await tx.schedule.findUnique({
        where: { id },
        include: {
          weekly_slots: true,
          date_overrides: true,
        }
      });

      return comprehensiveSnapshot;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Failed transaction commit on availability update:", error);
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