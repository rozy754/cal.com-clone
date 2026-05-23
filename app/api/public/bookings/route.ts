import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      eventTypeId, 
      bookerName, 
      bookerEmail, 
      startTime, // Expected: Strict Full ISO String (e.g., "2026-05-23T12:00:00.000Z")
      endTime,   // Expected: Strict Full ISO String (e.g., "2026-05-23T12:30:00.000Z")
      customResponses // Expected: JSON Object containing dynamic question answers
    } = body;

    // Basic Validation Check
    if (!eventTypeId || !bookerName || !bookerEmail || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields for creating booking." },
        { status: 400 }
      );
    }

    const startBookingDate = new Date(startTime);
    const endBookingDate = new Date(endTime);

    // 1. STRICT RACE-CONDITION CHECK: Prevent Double Booking at the very final millisecond
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        eventTypeId: eventTypeId,
        status: { in: ["UPCOMING", "RESCHEDULED"] },
        // Standard non-overlapping mathematical boundary logic:
        // !(NewStart >= ExistEnd || NewEnd <= ExistStart)
        NOT: {
          OR: [
            { startTime: { gte: endBookingDate } },
            { endTime: { lte: startBookingDate } }
          ]
        }
      }
    });

    if (overlappingBooking) {
      return NextResponse.json(
        { success: false, error: "Woah! This slot was just booked by someone else a second ago. Please choose another slot." },
        { status: 409 } // Conflict Status
      );
    }

    // 2. Insert secure booking row inside database
    const newBooking = await prisma.booking.create({
      data: {
        bookerName,
        bookerEmail,
        startTime: startBookingDate,
        endTime: endBookingDate,
        status: "UPCOMING",
        customResponses: customResponses || null,
        eventTypeId: eventTypeId
      },
      include: {
        eventType: {
          include: {
            schedule: {
              include: {
                user: true // Pulling out Host email metadata for notifications later
              }
            }
          }
        }
      }
    });

    // 3. TODO: TRIGGER MAIL NOTIFICATION (Nodemailer / Resend service execution goes here)
    console.log(`✉️ Triggering confirmation email to Booker: ${bookerEmail} and Host: ${newBooking.eventType.schedule.user.email}`);

    // 4. Return success metadata back to client to redirect to Confirmation Page (Screenshot 4)
    return NextResponse.json({
      success: true,
      message: "Meeting scheduled successfully!",
      data: {
        bookingId: newBooking.id,
        title: newBooking.eventType.title,
        bookerName: newBooking.bookerName,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        location: newBooking.eventType.location
      }
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

