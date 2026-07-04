import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { 
    getUserByEmail, 
    getUserById, 
    getSalaryByUserIdAndOrgId, 
    upsertSalary 
} from "@/lib/services";

export const dynamic = "force-dynamic";

// GET: Fetch salary structure for an employee
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

        // Verify the employee belongs to this HR's org
        const employee = await getUserById(id);
        if (!employee || employee.organizationId !== hrUser.organizationId || employee.role !== "employee") {
            return NextResponse.json({ message: "Employee not found" }, { status: 404 });
        }

        const salary = await getSalaryByUserIdAndOrgId(id, hrUser.organizationId);

        return NextResponse.json(salary || null, { status: 200 });
    } catch (error: any) {
        console.error("Get salary error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// POST: Create or update salary structure for an employee
export async function POST(
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

        const body = await req.json();
        const { basic, hra, da, bonus, otherAllowances, pf, tax, otherDeductions } = body;

        if (!basic || isNaN(Number(basic)) || Number(basic) <= 0) {
            return NextResponse.json({ message: "Basic salary is required and must be a positive number" }, { status: 400 });
        }

        const salaryData = {
            basic: Number(basic),
            hra: Number(hra) || 0,
            da: Number(da) || 0,
            bonus: Number(bonus) || 0,
            otherAllowances: Number(otherAllowances) || 0,
            pf: Number(pf) || 0,
            tax: Number(tax) || 0,
            otherDeductions: Number(otherDeductions) || 0,
        };

        const salary = await upsertSalary(id, hrUser.organizationId, salaryData);

        return NextResponse.json({ message: "Salary structure saved successfully", salary }, { status: 200 });
    } catch (error: any) {
        console.error("Save salary error:", error);
        return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
    }
}
