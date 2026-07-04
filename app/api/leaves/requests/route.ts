import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getUserByEmail } from "@/lib/services";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user || user.role !== "hr" || !user.organizationId) {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        // Get URL query parameters
        const url = new URL(req.url);
        const status = url.searchParams.get("status"); // pending, approved, rejected, or all

        // Build query by organizationId (utilizing standard single-field index)
        const leavesRef = collection(db, "leaveRequests");
        const q = query(
            leavesRef,
            where("organizationId", "==", user.organizationId)
        );

        const querySnapshot = await getDocs(q);
        let leaveRequests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            _id: doc.id,
            ...doc.data(),
        })) as any[];

        // Filter by status in memory
        if (status && status !== "all") {
            leaveRequests = leaveRequests.filter(req => req.status === status);
        }

        // Sort in memory by createdAt descending
        leaveRequests.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json(leaveRequests, { status: 200 });

    } catch (error: any) {
        console.error("Fetch leave requests error:", error);
        return NextResponse.json({ 
            message: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
