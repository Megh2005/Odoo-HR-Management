import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getUserById } from "@/lib/services";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendLeaveRequestEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user || user.role !== "employee") {
            return NextResponse.json({ message: "Forbidden - Employee access required" }, { status: 403 });
        }

        const { startDate, endDate, leaveType, reason } = await req.json();

        // Validation
        if (!startDate || !endDate || !leaveType) {
            return NextResponse.json({ 
                message: "Start date, end date, and leave type are required" 
            }, { status: 400 });
        }

        if (leaveType === "other" && !reason) {
            return NextResponse.json({ 
                message: "Reason is required for 'Other' leave type" 
            }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check both dates are after today
        if (start < today || end < today) {
            return NextResponse.json({ 
                message: "Leave dates must be after today" 
            }, { status: 400 });
        }

        // Check end date is after start date
        if (end < start) {
            return NextResponse.json({ 
                message: "End date must be after start date" 
            }, { status: 400 });
        }

        // Check maternity leave is only for females
        if (leaveType === "maternity" && user.gender !== "female") {
            return NextResponse.json({ 
                message: "Maternity leave is only available for female employees" 
            }, { status: 400 });
        }

        // Calculate duration
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date

        // Get HR for the organization
        const orgId = user.organizationId;
        if (!orgId) {
            return NextResponse.json({ 
                message: "User not assigned to an organization" 
            }, { status: 400 });
        }

        // Create leave request in Firestore
        const leavesRef = collection(db, "leaveRequests");
        const leaveRequestData = {
            employeeId: user.id,
            employeeName: user.name,
            employeeEmail: user.email,
            organizationId: orgId,
            startDate: startDate,
            endDate: endDate,
            duration: diffDays,
            leaveType: leaveType,
            reason: reason || "",
            status: "pending", // pending, approved, rejected
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await addDoc(leavesRef, leaveRequestData);
        const docSnap = await getDoc(docRef);
        const leaveRequest = {
            id: docSnap.id,
            _id: docSnap.id,
            ...docSnap.data(),
        };

        // Send email to HR
        try {
            const orgRef = doc(db, "organizations", orgId);
            const orgSnap = await getDoc(orgRef);
            const org = orgSnap.exists() ? orgSnap.data() : null;

            if (org) {
                await sendLeaveRequestEmail(
                    org,
                    user,
                    leaveRequest,
                    "request"
                ).catch(err => console.error("Failed to send leave request email:", err));
            }
        } catch (emailError) {
            console.error("Error sending leave request email:", emailError);
        }

        return NextResponse.json({ 
            message: "Leave request submitted successfully", 
            leaveRequest 
        }, { status: 201 });

    } catch (error: any) {
        console.error("Leave request error:", error);
        return NextResponse.json({ 
            message: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
