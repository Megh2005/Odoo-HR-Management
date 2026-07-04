import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { transporter } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { name, email } = await req.json();

        if (!name || !email) {
            return NextResponse.json(
                { message: "Name and email are required" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Check if user exists with matching name and email
        const user = await User.findOne({ email });

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

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

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
            from: `"Tropical Coders" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Reset Your Password - Verification Code",
            html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }
    .content { padding: 40px 30px; color: #334155; text-align: center; }
    .greeting { font-size: 18px; color: #1e293b; margin-bottom: 24px; font-weight: 500; }
    .otp-box { background-color: #f0f9ff; border: 2px dashed #0ea5e9; border-radius: 12px; padding: 24px; margin: 32px 0; }
    .otp-code { color: #0369a1; font-size: 42px; font-weight: 800; letter-spacing: 8px; margin: 0; font-family: monospace; }
    .instruction { color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #94a3b8; font-size: 13px; margin: 0; }
    .highlight { color: #059669; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tropical Coders</h1>
    </div>
    <div class="content">
      <p class="greeting">Hello, ${name}</p>
      <p class="instruction">We received a request to reset your password. Use the verification code below to proceed with your request.</p>
      
      <div class="otp-box">
        <h2 class="otp-code">${otp}</h2>
      </div>
      
      <p class="instruction">This code is valid for <strong>10 minutes</strong>. If you did not request this password reset, please ignore this email and your account will remain secure.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} <span class="highlight">Tropical Coders</span>. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json(
            { message: "OTP sent successfully", hash: token },
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
