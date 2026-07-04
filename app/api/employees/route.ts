import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { validateEmail } from "@/lib/validations";

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

        const { name, email, employeeId } = await req.json();

        if (!name || !email) {
            return NextResponse.json({ message: "Name and email are required" }, { status: 400 });
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

        // Generate unique employee ID if not provided
        let finalEmployeeId = employeeId?.trim();
        if (!finalEmployeeId) {
            const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
            finalEmployeeId = `EMP-${randomSuffix}`;
        }

        // Check if employeeId already registered
        const existingEmployee = await User.findOne({ employeeId: finalEmployeeId });
        if (existingEmployee) {
            return NextResponse.json({ message: "Employee ID is already registered" }, { status: 400 });
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

        return NextResponse.json({ message: "Employee added successfully", employee: newEmployee }, { status: 201 });
    } catch (error: any) {
        console.error("Add employee error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
