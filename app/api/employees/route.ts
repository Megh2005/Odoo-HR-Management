import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { validateEmail } from "@/lib/validations";
import { sendEmployeeAdditionEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

// GET: List all employees in the HR's organization
export async function GET() {
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

        const employees = await User.find({
            organizationId: hrUser.organizationId,
            role: "employee",
        }).select("-password");

        return NextResponse.json(employees, { status: 200 });
    } catch (error: any) {
        console.error("List employees error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// POST: Add a new employee (pre-created by HR)
export async function POST(req: Request) {
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

        const { name, email, joiningYear, serialNumber } = await req.json();

        if (!name || !email || !joiningYear || !serialNumber) {
            return NextResponse.json({ message: "Name, email, joining year, and serial number are required" }, { status: 400 });
        }

        const emailError = validateEmail(email);
        if (emailError) {
            return NextResponse.json({ message: emailError }, { status: 400 });
        }

        // Check if email already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: "User already exists with this email" }, { status: 400 });
        }

        // Fetch organization to compute initials
        const org = await Organization.findById(hrUser.organizationId);
        if (!org) {
            return NextResponse.json({ message: "Organization not found" }, { status: 404 });
        }

        // 1. Initials of the company name
        const words = org.name.trim().split(/\s+/);
        let orgInitials = "";
        if (words.length === 1) {
            orgInitials = words[0].substring(0, 2).toUpperCase();
        } else {
            orgInitials = words.map((w: string) => w[0]).join("").toUpperCase();
        }

        // 2. First 2+2 Letters of the employee's first name and last name
        const nameParts = name.trim().split(/\s+/);
        let nameCode = "";
        if (nameParts.length >= 2) {
            const firstPart = nameParts[0].substring(0, 2).toUpperCase();
            const lastPart = nameParts[nameParts.length - 1].substring(0, 2).toUpperCase();
            nameCode = firstPart + lastPart;
        } else {
            nameCode = name.trim().substring(0, 4).toUpperCase().padEnd(4, "_");
        }

        // 3 & 4. Joining Year and Serial Number
        const formattedSerial = serialNumber.toString().trim().padStart(2, "0");
        const finalEmployeeId = `${orgInitials}-${nameCode}-${joiningYear}-${formattedSerial}`.toUpperCase();

        // Check if employeeId already registered
        const existingEmployee = await User.findOne({ employeeId: finalEmployeeId });
        if (existingEmployee) {
            return NextResponse.json({ message: `Employee ID ${finalEmployeeId} is already registered` }, { status: 400 });
        }

        const newEmployee = new User({
            name: name.trim(),
            email: email.trim(),
            employeeId: finalEmployeeId,
            role: "employee",
            status: "pending",
            organizationId: hrUser.organizationId,
            avatar: `https://robohash.org/${email}`,
        });

        await newEmployee.save();

        // Send employee pre-registration onboarding email
        sendEmployeeAdditionEmail(newEmployee, org, hrUser).catch(err => {
            console.error("Failed to send employee addition email:", err);
        });

        return NextResponse.json({ message: "Employee added successfully", employee: newEmployee }, { status: 201 });
    } catch (error: any) {
        console.error("Add employee error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
