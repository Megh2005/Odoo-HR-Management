import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Organization from "@/models/Organization";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const hrUser = await User.findOne({ email: session.user.email });
        if (!hrUser || hrUser.role !== "hr") {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        // Enforce the rule: "one each hr can create at most one organisation not more than that"
        if (hrUser.organizationId) {
            return NextResponse.json(
                { message: "You are already linked to an organization. You cannot create another one." },
                { status: 400 }
            );
        }

        const existingOrg = await Organization.findOne({ createdBy: hrUser._id });
        if (existingOrg) {
            hrUser.organizationId = existingOrg._id;
            await hrUser.save();
            return NextResponse.json(
                { message: "Organization already exists. Linked successfully.", organization: existingOrg },
                { status: 200 }
            );
        }

        const { name, logo, address, additionalInfo } = await req.json();

        if (!name) {
            return NextResponse.json({ message: "Organization name is required" }, { status: 400 });
        }

        // Create new organization
        const newOrg = new Organization({
            name: name.trim(),
            logo: logo || "",
            address: address || "",
            additionalInfo: additionalInfo || {},
            createdBy: hrUser._id,
        });

        await newOrg.save();

        // Update the HR User's organizationId
        hrUser.organizationId = newOrg._id;
        await hrUser.save();

        return NextResponse.json(
            { message: "Organization created successfully", organization: newOrg },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Create organization error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
