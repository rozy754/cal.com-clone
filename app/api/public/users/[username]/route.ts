import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Next.js 16 Version Dynamic Unwrapping Check
    const { username } = await params;

    // 1. Host user dhoondo unke unique identifier name se
    const hostUser = await prisma.user.findFirst({
      where: {
        name: { equals: username, mode: "insensitive" }, // Case-insensitive matching
      },
      include: {
        schedules: {
          include: {
            eventTypes: {
              where: { isActive: true }, // Sirf publicly active events filter karo
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                location: true,
                duration: true,
                minNoticePeriod: true,
                bufferTime: true,
                customQuestions: true, 
                scheduleId: true,
              },
            },
          },
        },
      },
    });

    // Handle missing host condition
    if (!hostUser) {
      return NextResponse.json(
        { success: false, error: `Host user '${username}' not found in registry.` },
        { status: 404 }
      );
    }

    // 2. Host ke saare distinct schedules se unke active mapped events flat out extract karo
    const publicEventsListing = hostUser.schedules.flatMap((sch) => sch.eventTypes);

    // 3. Clear payload respond back to frontend client
    return NextResponse.json({
      success: true,
      data: {
        host: {
          id: hostUser.id,
          name: hostUser.name,
          email: hostUser.email,
        },
        events: publicEventsListing,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}