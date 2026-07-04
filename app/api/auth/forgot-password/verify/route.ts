import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/services";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";

export async function POST(req: Request) {
    try {
        const { name, email } = await req.json();

        if (!name || !email) {
            return NextResponse.json(
                { message: "Name and email are required" },
                { status: 400 }
            );
        }

        // Check if user exists with matching name and email
        const user = await getUserByEmail(email);

        if (!user) {
            return NextResponse.json(
                { message: "No account found with this email" },
                { status: 404 }
            );
        }

        // Case-insensitive name check
        if (user.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
            return NextResponse.json(
                { message: "Name does not match our records for this email" },
                { status: 400 }
            );
        }

        // Trigger password reset email via Firebase Auth directly
        await sendPasswordResetEmail(firebaseAuth, email);

        return NextResponse.json(
            { message: "Firebase password reset email sent successfully", useFirebaseDirectReset: true },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error asking for reset:", error);
        return NextResponse.json(
            { message: error.message || "Failed to process request" },
            { status: 500 }
        );
    }
}
