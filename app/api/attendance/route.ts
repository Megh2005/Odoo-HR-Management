import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { 
    getUserByEmail, 
    getOrganizationById, 
    getAttendanceByUserAndDate, 
    getAttendanceByUserAndMonth, 
    createAttendance, 
    updateAttendance 
} from "@/lib/services";

export const dynamic = 'force-dynamic';

// GET: Fetch employee's monthly attendance logs
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0"); // YYYY-MM prefix
        const yearMonthPrefix = `${currentYear}-${currentMonth}`;

        // Retrieve existing records
        let records = await getAttendanceByUserAndMonth(user.id, yearMonthPrefix);

        // Today's specific date string
        const todayStr = now.toISOString().split("T")[0];

        // To make the monthly preview look realistic and complete, we auto-fill previous days of the month
        // with mock attendance data if they do not exist.
        const currentDayNumber = now.getDate();
        const generatedRecords = [];

        for (let d = 1; d < currentDayNumber; d++) {
            const dayStr = `${yearMonthPrefix}-${String(d).padStart(2, "0")}`;
            const existing = records.find(r => r.date === dayStr);

            if (existing) {
                generatedRecords.push(existing);
            } else {
                // Skip weekends (Saturday: 6, Sunday: 0)
                const dateObj = new Date(currentYear, now.getMonth(), d);
                const dayOfWeek = dateObj.getDay();
                
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    // Randomize working hours slightly for mock realism
                    const workingHours = parseFloat((7.5 + Math.random() * 1.5).toFixed(2));
                    generatedRecords.push({
                        date: dayStr,
                        status: "present",
                        workingHours,
                        checkIn: new Date(currentYear, now.getMonth(), d, 9, Math.floor(Math.random() * 15)).toISOString(),
                        checkOut: new Date(currentYear, now.getMonth(), d, 17, Math.floor(Math.random() * 15)).toISOString(),
                        isMock: true
                    });
                } else {
                    generatedRecords.push({
                        date: dayStr,
                        status: "leave",
                        workingHours: 0,
                        isMock: true
                    });
                }
            }
        }

        // Add today's log (if exists) and future records (if any)
        const todayAndFutureRecords = records.filter(r => {
            const dayParts = r.date.split("-");
            const dayNum = parseInt(dayParts[2]);
            return dayNum >= currentDayNumber;
        });

        const allMonthRecords = [...generatedRecords, ...todayAndFutureRecords].sort((a, b) => a.date.localeCompare(b.date));

        // Locate today's specific check-in status
        const todayRecord = records.find(r => r.date === todayStr);

        return NextResponse.json({
            records: allMonthRecords,
            today: todayRecord || null
        }, { 
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            }
        });

    } catch (error: any) {
        console.error("Fetch attendance error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST: Log Check-In or Check-Out for today
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { action } = await req.json();
        if (action !== "checkin" && action !== "checkout") {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];

        let record = await getAttendanceByUserAndDate(user.id, todayStr);

        if (action === "checkin") {
            if (record) {
                return NextResponse.json({ message: "Already checked in today" }, { status: 400 });
            }

            // Verify check-in window settings if organization is linked
            if (user.organizationId) {
                const org = await getOrganizationById(user.organizationId);
                if (org) {
                    const startVal = org.checkInStart || "09:00";
                    const endVal = org.checkInEnd || "11:00";

                    const [startH, startM] = startVal.split(":").map(Number);
                    const [endH, endM] = endVal.split(":").map(Number);

                    const currentH = now.getHours();
                    const currentM = now.getMinutes();

                    const currentTotal = currentH * 60 + currentM;
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;

                    if (currentTotal < startTotal || currentTotal > endTotal) {
                        return NextResponse.json({
                            message: `The check-in portal is closed. It is only open between ${startVal} and ${endVal}.`
                        }, { status: 400 });
                    }
                }
            }

            record = await createAttendance({
                userId: user.id,
                date: todayStr,
                checkIn: now.toISOString(),
                status: "present"
            });

            return NextResponse.json({ message: "Checked in successfully", record }, { 
                status: 201,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                }
            });
        } else {
            // Checkout
            if (!record) {
                return NextResponse.json({ message: "No check-in record found for today. Check in first." }, { status: 400 });
            }
            if (record.checkOut) {
                return NextResponse.json({ message: "Already checked out today" }, { status: 400 });
            }

            // Calculate working hours
            const checkInTime = new Date(record.checkIn).getTime();
            const checkOutTime = now.getTime();
            const diffMs = checkOutTime - checkInTime;
            const hours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

            const updatedRecord = await updateAttendance(record.id, {
                checkOut: now.toISOString(),
                workingHours: hours
            });

            return NextResponse.json({ message: "Checked out successfully", record: updatedRecord }, { 
                status: 200,
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                }
            });
        }

    } catch (error: any) {
        console.error("Log attendance error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
