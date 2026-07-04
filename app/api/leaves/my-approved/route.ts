import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/services";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user || user.role !== "employee") {
            return NextResponse.json({ message: "Forbidden - Employee access required" }, { status: 403 });
        }

        // Get all approved leave requests for this employee
        const leavesRef = collection(db, "leaveRequests");
        const q = query(
            leavesRef,
            where("employeeId", "==", user.id),
            where("status", "==", "approved"),
            orderBy("startDate", "asc")
        );

        const querySnapshot = await getDocs(q);
        const approvedLeaves = querySnapshot.docs.map(doc => ({
            id: doc.id,
            _id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(approvedLeaves, { status: 200 });

    } catch (error: any) {
        console.error("Fetch approved leaves error:", error);
        return NextResponse.json({ 
            message: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
