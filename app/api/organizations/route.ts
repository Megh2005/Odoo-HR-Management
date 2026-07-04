import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Organization from "@/models/Organization";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const organizations = await Organization.find({}, "name _id").lean();
    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error("List organizations error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
