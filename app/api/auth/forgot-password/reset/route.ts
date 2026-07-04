import { NextResponse } from "next/server";
import { getUserByEmail, updateUser, hashPassword } from "@/lib/services";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email, otp, hash, newPassword } = await req.json();

        if (!email || !otp || !hash || !newPassword) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        // Validate password length (same as frontend/signup)
        if (newPassword.length < 8 || newPassword.length > 14) {
            return NextResponse.json(
                { message: "Password must be between 8 and 14 characters" },
                { status: 400 }
            );
        }

        // Verify OTP hash
        const [hashValue, expiresAt] = hash.split(".");
        const now = Date.now();

        if (now > parseInt(expiresAt)) {
            return NextResponse.json(
                { message: "OTP has expired. Please request a new one." },
                { status: 400 }
            );
        }

        const data = `${email}.${otp}.${expiresAt}`;
        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_key";
        const calculatedHash = crypto.createHmac("sha256", secret).update(data).digest("hex");

        if (calculatedHash !== hashValue) {
            return NextResponse.json(
                { message: "Invalid OTP" },
                { status: 400 }
            );
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user password
        await updateUser(user.id, { password: hashedPassword });

        return NextResponse.json(
            { message: "Password reset successfully" },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { message: error.message || "Failed to reset password" },
            { status: 500 }
        );
    }
}
