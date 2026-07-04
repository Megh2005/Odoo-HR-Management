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
        if (!user || user.role !== "hr" || !user.organizationId) {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        // Get URL query parameters
        const url = new URL(req.url);
        const status = url.searchParams.get("status"); // pending, approved, rejected, or all

        // Build query
        const leavesRef = collection(db, "leaveRequests");
        let q;

        if (status && status !== "all") {
            q = query(
                leavesRef,
                where("organizationId", "==", user.organizationId),
                where("status", "==", status),
                orderBy("createdAt", "desc")
            );
        } else {
            q = query(
                leavesRef,
                where("organizationId", "==", user.organizationId),
                orderBy("createdAt", "desc")
            );
        }

        const querySnapshot = await getDocs(q);
        const leaveRequests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            _id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(leaveRequests, { status: 200 });

    } catch (error: any) {
        console.error("Fetch leave requests error:", error);
        return NextResponse.json({ 
            message: error.message || "Internal Server Error" 
        }, { status: 500 });
    }
}
