import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/services";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendLeaveResponseEmail } from "@/lib/email";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user || user.role !== "hr" || !user.organizationId) {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        const { status, remarks } = await req.json();

        if (!status || !["approved", "rejected"].includes(status)) {
            return NextResponse.json({ 
                message: "Status must be 'approved' or 'rejected'" 
            }, { status: 400 });
        }

        // Get leave request
        const leaveRef = doc(db, "leaveRequests", params.id);
        const leaveSnap = await getDoc(leaveRef);

        if (!leaveSnap.exists()) {
            return NextResponse.json({ message: "Leave request not found" }, { status: 404 });
        }

        const leaveData = leaveSnap.data();

        // Verify HR belongs to same organization
        if (leaveData.organizationId !== user.organizationId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Update leave request status
        await updateDoc(leaveRef, {
            status: status,
            remarks: remarks || "",
            approvedAt: status === "approved" ? new Date().toISOString() : null,
            rejectedAt: status === "rejected" ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
        });

        // If approved, automatically mark attendance as "leave" for all dates in range
        if (status === "approved") {
            const startDate = new Date(leaveData.startDate);
            const endDate = new Date(leaveData.endDate);

            // Generate all dates in range
            const datesArray = [];
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
                datesArray.push(dateStr);
                currentDate.setDate(currentDate.getDate() + 1);
            }

             // Mark attendance for all dates
            for (const dateStr of datesArray) {
                const attendanceRef = collection(db, "attendances");
                const q = query(
                    attendanceRef,
                    where("userId", "==", leaveData.employeeId),
                    where("date", "==", dateStr)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Update existing attendance record
                    const attendanceDoc = querySnapshot.docs[0];
                    await updateDoc(doc(db, "attendances", attendanceDoc.id), {
                        status: "leave",
                        leaveRequestId: params.id,
                        checkIn: null,
                        checkOut: null,
                        workingHours: 0,
                        updatedAt: new Date().toISOString(),
                    });
                } else {
                    // Create new attendance record for leave
                    const newAttendanceRef = collection(db, "attendances");
                    await (await import("firebase/firestore")).addDoc(newAttendanceRef, {
                        userId: leaveData.employeeId,
                        employeeId: leaveData.employeeId,
                        date: dateStr,
                        status: "leave",
                        leaveRequestId: params.id,
                        checkIn: null,
                        checkOut: null,
                        workingHours: 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    });
                }
            }
        }

        // Send email to employee
        try {
            const employee = await (await import("@/lib/services")).getUserById(leaveData.employeeId);
            if (employee) {
                await sendLeaveResponseEmail(
                    user.organizationId,
                    employee,
                    leaveSnap.data(),
                    status,
                    remarks
                ).catch(err => console.error("Failed to send leave response email:", err));
            }
        } catch (emailError) {
            console.error("Error sending leave response email:", emailError);
        }

        return NextResponse.json({ 
            message: `Leave request ${status} successfully`,
            leaveRequest: {
                id: params.id,
                ...leaveData,
                status: status,
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error("Update leave request error:", error);
        return NextResponse.json({ 
            message: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user || user.role !== "hr") {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        const leaveRef = doc(db, "leaveRequests", params.id);
        const leaveSnap = await getDoc(leaveRef);

        if (!leaveSnap.exists()) {
            return NextResponse.json({ message: "Leave request not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: leaveSnap.id,
            _id: leaveSnap.id,
            ...leaveSnap.data(),
        }, { status: 200 });

    } catch (error: any) {
        console.error("Get leave request error:", error);
        return NextResponse.json({ 
            message: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
