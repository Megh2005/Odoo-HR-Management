import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { transporter } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { email, name, role, organizationId } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const existingUser = await User.findOne({ email });

        if (role === "employee") {
            if (!existingUser) {
                return NextResponse.json(
                    { message: "No employee account exists with this email. Please contact your HR." },
                    { status: 400 }
                );
            }
            if (existingUser.status === "active") {
                return NextResponse.json(
                    { message: "Account is already active. Please sign in." },
                    { status: 400 }
                );
            }
            if (!organizationId) {
                return NextResponse.json(
                    { message: "Please select your organization." },
                    { status: 400 }
                );
            }
            if (existingUser.organizationId?.toString() !== organizationId.toString()) {
                return NextResponse.json(
                    { message: "This email is not registered under the selected organization." },
                    { status: 400 }
                );
            }
        } else {
            // HR registration
            if (existingUser) {
                return NextResponse.json(
                    { message: "User already exists with this email" },
                    { status: 400 }
                );
            }
        }

        // Generate 8-digit OTP
        const otp = Math.floor(10000000 + Math.random() * 90000000).toString();

        // Create a hash of the OTP and email with expiration
        // Format: email.otp.expiresAt
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        const data = `${email}.${otp}.${expiresAt}`;
        const secret = process.env.NEXTAUTH_SECRET || "fallback_secret_key";

        // Generate HMAC signature
        const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");

        // Create token to send to client: hash.expiresAt
        const token = `${hash}.${expiresAt}`;

        // Send OTP via email
        const mailOptions = {
            from: `"HRSpecs Team" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your Verification Code",
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0c4a6e; margin: 0;">Verify Your Email</h2>
            </div>
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <p style="margin: 0; color: #334155; font-size: 16px;">Your verification code is:</p>
              <h1 style="color: #0284c7; font-size: 32px; letter-spacing: 5px; margin: 10px 0;">${otp}</h1>
              <p style="margin: 0; color: #64748b; font-size: 14px;">This code will expire in 10 minutes.</p>
            </div>
            <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { message: "OTP sent successfully", hash: token, isPreCreatedEmployee: role === "employee" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error sending OTP:", error);
        return NextResponse.json(
            { message: error.message || "Failed to send OTP" },
            { status: 500 }
        );
    }
}
