import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, getUserById, deleteUser, getSalaryByUserIdAndOrgId } from "@/lib/services";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";

export const dynamic = "force-dynamic";

// GET: Fetch a single employee by ID (HR-only, same org)
export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const hrUser = await getUserByEmail(session.user.email);
        if (!hrUser || hrUser.role !== "hr" || !hrUser.organizationId) {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        const employee = await getUserById(id);

        if (!employee || employee.organizationId !== hrUser.organizationId || employee.role !== "employee") {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        if (employee.password) {
            delete employee.password;
        }

        return NextResponse.json(employee, { status: 200 });
    } catch (error: any) {
        console.error("Get employee error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Remove an employee permanently (HR-only, same org)
export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const hrUser = await getUserByEmail(session.user.email);
        if (!hrUser || hrUser.role !== "hr" || !hrUser.organizationId) {
            return NextResponse.json({ message: "Forbidden - HR access required" }, { status: 403 });
        }

        const employee = await getUserById(id);

        if (!employee || employee.organizationId !== hrUser.organizationId || employee.role !== "employee") {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        // Delete associated salary records
        if (employee.organizationId) {
            const salariesRef = collection(db, "salaries");
            const q = query(
                salariesRef,
                where("userId", "==", id),
                where("organizationId", "==", employee.organizationId)
            );
            const salaryDocs = await getDocs(q);
            for (const salaryDoc of salaryDocs.docs) {
                await deleteDoc(doc(db, "salaries", salaryDoc.id));
            }
        }

        // Delete associated attendance records
        const attendanceRef = collection(db, "attendances");
        const attendanceQuery = query(
            attendanceRef,
            where("userId", "==", id)
        );
        const attendanceDocs = await getDocs(attendanceQuery);
        for (const attendanceDoc of attendanceDocs.docs) {
            await deleteDoc(doc(db, "attendances", attendanceDoc.id));
        }

        // Delete the employee user document
        await deleteUser(id);

        return NextResponse.json({ message: "Employee deleted successfully", id }, { status: 200 });
    } catch (error: any) {
        console.error("Delete employee error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
}
