import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getOrganizationById, updateOrganization } from "@/lib/services";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email || (session.user as any).role !== "hr") {
            return NextResponse.json({ message: "Unauthorized. HR access required." }, { status: 401 });
        }

        const { checkInStart, checkInEnd } = await req.json();
        
        if (!checkInStart || !checkInEnd) {
            return NextResponse.json({ message: "Start and End times are required" }, { status: 400 });
        }

        // Validate time format HH:MM
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(checkInStart) || !timeRegex.test(checkInEnd)) {
            return NextResponse.json({ message: "Invalid time format. Please use HH:MM." }, { status: 400 });
        }

        // Find HR user
        const hrUser = await getUserByEmail(session.user.email);
        if (!hrUser || !hrUser.organizationId) {
            return NextResponse.json({ message: "HR has no active organization" }, { status: 400 });
        }

        const org = await getOrganizationById(hrUser.organizationId);
        if (!org) {
            return NextResponse.json({ message: "Organization not found" }, { status: 404 });
        }

        const updatedOrg = await updateOrganization(org.id, {
            checkInStart,
            checkInEnd,
        });

        return NextResponse.json({
            message: "Attendance check-in window updated successfully",
            organization: updatedOrg
        }, { status: 200 });

    } catch (error: any) {
        console.error("Update timeline error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
