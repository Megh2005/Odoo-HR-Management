import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Salary from "@/models/Salary";

export const dynamic = "force-dynamic";

// GET: Employee fetches their own salary (read-only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const salary = await Salary.findOne({
            userId: user._id,
            organizationId: user.organizationId,
        });

        return NextResponse.json(salary || null, { status: 200 });
    } catch (error: any) {
        console.error("Get own salary error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
