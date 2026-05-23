import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET() {
  try {
    console.log("🌱 Next.js API Runtime Seeding Started with Clean Relations...");

    // 1. Purana data saaf karo structural level par safely cascade order mein
    await prisma.booking.deleteMany();
    await prisma.eventType.deleteMany();
    await prisma.dateOverride.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Default Admin User
    const user = await prisma.user.create({
      data: {
        name: "Default Admin",
        email: "admin@cal.com",
      },
    });

    // 3. Create Default Master Schedule with inline nested 'weekly_slots' (No relational mismatch!)
    const defaultSchedule = await prisma.schedule.create({
      data: {
        name: "Working Hours",
        timeZone: "Asia/Kolkata",
        isDefault: true,
        userId: user.id,
        weekly_slots: { // 👈 Updated according to your simplified name shortcut
          create: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }, // Mon
            { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }, // Tue
            { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" }, // Wed
            { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" }, // Thu
            { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" }, // Fri
          ],
        },
      },
    });

    // 4. Create Sample Event Type matching your latest default schemas
    const sampleEvent = await prisma.eventType.create({
      data: {
        title: "30 Minute Coffee Chat",
        slug: "30-min",
        description: "Catch up, discuss project assignments, or brainstorm ideas.",
        duration: 30,
        location: "Google Meet", // Fixed default state
        isActive: true,
        minNoticePeriod: 120,
        bufferTime: 5, // Bonus buffer parameter
        scheduleId: defaultSchedule.id,
        customQuestions: [
          { id: "notes", label: "Additional notes", type: "textarea", required: false }
        ]
      },
    });

    // 5. Create an additional Sample Event for Dashboard mapping representation
    const sampleEventTwo = await prisma.eventType.create({
      data: {
        title: "OS Daily Discussion",
        slug: "os-daily-discussion",
        description: "To discuss assignments, coding parameters and scheduling bugs.",
        duration: 20,
        location: "Cal Video",
        isActive: true,
        minNoticePeriod: 120,
        bufferTime: 0,
        scheduleId: defaultSchedule.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: "🔥 Balle Balle! Database latest simplified schema ke sath sync hokar seed ho gaya!",
      details: {
        user: user.email,
        events: [sampleEvent.slug, sampleEventTwo.slug]
      }
    });

  } catch (error: any) {
    console.error("❌ Seeding runtime failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}