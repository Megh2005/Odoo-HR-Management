import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email, otp, hash } = await req.json();

        if (!email || !otp || !hash) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify OTP Hash
        const [signature, expiresAt] = hash.split(".");
        if (Date.now() > parseInt(expiresAt)) {
            return NextResponse.json(
                { message: "OTP has expired" },
                { status: 400 }
            );
        }

        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_key";
        const data = `${email}.${otp}.${expiresAt}`;
        const computedSignature = crypto.createHmac("sha256", secret).update(data).digest("hex");

        if (computedSignature !== signature) {
            return NextResponse.json(
                { message: "Invalid OTP" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "OTP verified successfully" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Verify OTP error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
