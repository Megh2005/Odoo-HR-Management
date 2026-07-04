import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

// GET: Fetch a single employee by ID (HR-only, same org)
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

        await connectToDatabase();

        const hrUser = await User.findOne({ email: session.user.email });
        if (!hrUser || hrUser.role !== "hr" || !hrUser.organizationId) {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        const employee = await User.findOne({
            _id: id,
            organizationId: hrUser.organizationId,
            role: "employee",
        }).select("-password");

        if (!employee) {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        return NextResponse.json(employee, { status: 200 });
    } catch (error: any) {
        console.error("Get employee error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
