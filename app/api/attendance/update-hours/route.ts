import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, updateAttendance } from "@/lib/services";

export const dynamic = 'force-dynamic';

// POST: Update working hours for active check-in (saves every 2 minutes)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const { recordId, workingHours } = await req.json();
        
        if (!recordId || workingHours === undefined) {
            return NextResponse.json({ message: "Record ID and working hours are required" }, { status: 400 });
        }

        // Update the attendance record with current working hours
        const updatedRecord = await updateAttendance(recordId, {
            workingHours: parseFloat(workingHours)
        });

        return NextResponse.json({ 
            message: "Working hours updated successfully", 
            record: updatedRecord 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Update working hours error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
