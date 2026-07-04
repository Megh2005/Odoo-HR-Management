import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getUserById, getAttendanceByUserAndMonth, getAttendanceByUserId } from "@/lib/services";

export const dynamic = "force-dynamic";

// GET: Fetch attendance records for a specific employee (HR-only)
export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const hrUser = await getUserByEmail(session.user.email);
        if (!hrUser || hrUser.role !== "hr" || !hrUser.organizationId) {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        // Ensure the employee belongs to this HR's org
        const employee = await getUserById(id);
        if (!employee || employee.organizationId !== hrUser.organizationId || employee.role !== "employee") {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        // Get query params for optional month filter
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // e.g. "2026-07"

        let records;
        if (month) {
            records = await getAttendanceByUserAndMonth(id, month);
        } else {
            records = await getAttendanceByUserId(id);
        }

        return NextResponse.json(records, { status: 200 });
    } catch (error: any) {
        console.error("Get employee attendance error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
