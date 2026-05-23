import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId query param" }, { status: 400 });
    }

    // 1. Absolute Safe Indian Current Time (IST) in ISO format
    // Yeh humesha correct current IST ISO string nikaalega (e.g., "2026-05-23T12:45:00.000Z")
    const tzOffset = 5.5 * 60 * 60 * 1000; // India is UTC +5:30
    const nowIST = new Date(Date.now() + tzOffset);
    const currentISTISO = nowIST.toISOString();

    // 2. Database se saari bookings fetch karo
    const allBookings = await prisma.booking.findMany({
      where: {
        eventType: { schedule: { userId: userId } },
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
        // Strict ISO string level comparison (Database timestamps match directly)
        const bookingStartISO = new Date(b.startTime).toISOString();

        if (bookingStartISO > currentISTISO) {
          // Future meeting
          upcoming.push(b);
        } else {
          // Past meeting -> Dynamically change status to string "PAST" on the fly for UI!
          const pastBooking = {
            ...b,
            status: "PAST" // 👈 Humne override kar diya taaki frontend ko badla hua mile!
          };
          past.push(pastBooking);
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { upcoming, past, cancelled },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// =========================================================================
// PATCH: Direct "Cancel It" Option Implementation with Notes
// =========================================================================
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, cancellationNote } = body; // 👈 Booking ID aur reasons payload se lenge

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: bookingId" },
        { status: 400 }
      );
    }

    // 1. Check karo ki booking database mein exist karti hai ya nahi
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Target booking reference not found in registry." },
        { status: 404 }
      );
    }

    // 2. Database mein status ko update karke CANCELLED mark karo
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationNote: cancellationNote || "Cancelled by host via dashboard panel." // Fallback note
      }
    });

    return NextResponse.json({
      success: true,
      message: "Booking successfully moved to the cancelled registry.",
      data: updatedBooking
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}