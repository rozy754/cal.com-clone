import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// Next.js 14 App Router params structural constraint type safe definition
interface RouteContext {
  params: Promise<{ id: string }>;
}

// 0. GET Handler: Fetch a single event type by ID
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const event = await prisma.eventType.findUnique({
      where: { id },
      include: {
        schedule: {
          select: { id: true, name: true, timeZone: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event Type not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 1. PUT Handler: Update full schema form fields context inside individual objects
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params; // 👈 CRITICAL FIX: Await parameters asynchronously first!
    const body = await req.json();

    const existing = await prisma.eventType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Event Type not found" }, { status: 404 });
    }

    // Slug duplication protection checks on edit mode transformations
    if (body.slug && body.slug !== existing.slug) {
      const slugCheck = await prisma.eventType.findUnique({ where: { slug: body.slug.trim().toLowerCase() } });
      if (slugCheck) {
        return NextResponse.json({ success: false, error: "URL slug is already claimed!" }, { status: 400 });
      }
    }

    const updatedEvent = await prisma.eventType.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : existing.title,
        slug: body.slug ? body.slug.trim().toLowerCase() : existing.slug,
        description: body.description !== undefined ? body.description : existing.description,
        duration: body.duration ? Number(body.duration) : existing.duration,
        scheduleId: body.scheduleId !== undefined ? body.scheduleId : existing.scheduleId,
        customQuestions: body.customQuestions !== undefined ? body.customQuestions : existing.customQuestions,
        minNoticePeriod: body.minNoticePeriod ? Number(body.minNoticePeriod) : existing.minNoticePeriod,
        bufferTime: body.bufferTime ? Number(body.bufferTime) : existing.bufferTime,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
      }
    });

    return NextResponse.json({ success: true, data: updatedEvent });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 2. PATCH Handler: Mapped for quick dashboard grid switches (Toggles activation switches seamlessly)
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params; // 👈 CRITICAL FIX: Await parameters asynchronously first!
    const body = await req.json();

    const existing = await prisma.eventType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Event Type not found" }, { status: 404 });
    }

    const patchedResult = await prisma.eventType.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
      }
    });

    return NextResponse.json({ success: true, data: patchedResult }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 3. DELETE Handler: Remove config tracking row safely
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params; // 👈 CRITICAL FIX: Await parameters asynchronously first!

    const existing = await prisma.eventType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Event Type not found" }, { status: 404 });
    }

    await prisma.eventType.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Event type deleted successfully!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
