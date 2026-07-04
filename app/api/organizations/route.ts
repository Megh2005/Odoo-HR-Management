import { NextResponse } from "next/server";
import { getOrganizationsList } from "@/lib/services";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const organizations = await getOrganizationsList();
    return NextResponse.json(organizations);
  } catch (error: any) {
    console.error("List organizations error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
