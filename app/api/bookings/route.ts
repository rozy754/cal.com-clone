import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// =========================================================================
// GET: Fetch Bookings Dynamically Based on User Session + Global Conflict Fix
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId query param" }, { status: 400 });
    }

    // Absolute Safe Indian Current Time (IST) in ISO format
    const tzOffset = 5.5 * 60 * 60 * 1000; // India is UTC +5:30
    const nowIST = new Date(Date.now() + tzOffset);
    const currentISTISO = nowIST.toISOString();

    // Fetch ALL bookings for this host natively through relational query mapping
    const allBookings = await prisma.booking.findMany({
      where: {
        eventType: {
          schedule: {
            userId: userId
          }
        }
      },
      include: {
        eventType: {
          select: { title: true, duration: true, location: true, scheduleId: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const upcoming: any[] = [];
    const past: any[] = [];
    const cancelled: any[] = [];

    allBookings.forEach((b) => {
      if (b.status === "CANCELLED") {
        cancelled.push(b);
      } else {
        const bookingStartISO = new Date(b.startTime).toISOString();

        if (bookingStartISO > currentISTISO) {
          upcoming.push(b);
        } else {
          const pastBooking = {
            ...b,
            status: "PAST"
          };
          past.push(pastBooking);
        }
      }
    });

    // 🌟 PERFECT RESTORATION: Structure array exactly how frontend dashboards read it!
    return NextResponse.json({
      success: true,
      data: { upcoming, past, cancelled },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// =========================================================================
// PATCH: Cancel Route Implementation (Untouched)
// =========================================================================
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, cancellationNote } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Missing required parameter: bookingId" }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Target booking reference not found." }, { status: 404 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationNote: cancellationNote || "Cancelled by host via dashboard panel."
      }
    });

    return NextResponse.json({ success: true, message: "Booking successfully cancelled.", data: updatedBooking });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}