import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // 1. Database se first user account fetch karne ki koshish karo
    let userRecord = await prisma.user.findFirst({
      select: {
        id: true,
        email: true
      }
    });

    // 🚀 AUTO-SEED PROTECTION: Agar database bilkul khali hai aur koi user nahi mila
    if (!userRecord) {
      console.log("🌱 Database is empty! Auto-seeding a default operational host user row...");
      
      userRecord = await prisma.user.create({
        data: {
          email: "rozy.koranga@example.com",
          name: "Rozy Koranga"
          // Agar aapke schema mein password ya username mandatory hai toh unhe yahan add kar lijiye
        },
        select: {
          id: true,
          email: true
        }
      });
    }

    // 2. Returns the fully validated dynamic identity back to dashboard safely
    return NextResponse.json({ 
      success: true, 
      id: userRecord.id,
      email: userRecord.email 
    });

  } catch (error: any) {
    console.error("❌ Profile Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}