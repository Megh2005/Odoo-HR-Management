import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getSalaryByUserIdAndOrgId } from "@/lib/services";

export const dynamic = "force-dynamic";

// GET: Employee fetches their own salary (read-only)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (!user.organizationId) {
            return NextResponse.json(null, { status: 200 });
        }

        const salary = await getSalaryByUserIdAndOrgId(user.id, user.organizationId);

        return NextResponse.json(salary || null, { status: 200 });
    } catch (error: any) {
        console.error("Get own salary error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
