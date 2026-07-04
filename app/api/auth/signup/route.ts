import { NextResponse } from "next/server";
import { validateEmail, validatePassword } from "@/lib/validations";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { hashPassword } from "@/lib/services";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const { 
            name, 
            email, 
            password, 
            gender, 
            otp, 
            hash, 
            role,
            avatar
        } = await req.json();

        if (!email || !otp || !hash || !role) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        if (role !== "employee" && role !== "hr") {
            return NextResponse.json(
                { message: "Invalid role specified" },
                { status: 400 }
            );
        }

        const emailError = validateEmail(email);
        if (emailError) {
            return NextResponse.json({ message: emailError }, { status: 400 });
        }

        if (password) {
            const passwordError = validatePassword(password);
            if (passwordError) {
                return NextResponse.json({ message: passwordError }, { status: 400 });
            }
        }

        await connectToDatabase();

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

        const hashedPassword = password ? await hashPassword(password) : undefined;

        if (role === "employee") {
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                return NextResponse.json(
                    { message: "No employee account found for this email. Contact your HR." },
                    { status: 404 }
                );
            }
            if (existingUser.status === "active") {
                return NextResponse.json(
                    { message: "Account is already active. Please sign in." },
                    { status: 400 }
                );
            }

            if (!hashedPassword) {
                return NextResponse.json(
                    { message: "Password is required to complete account setup." },
                    { status: 400 }
                );
            }

            existingUser.password = hashedPassword;
            existingUser.status = "active";
            if (gender) existingUser.gender = gender;
            await existingUser.save();

            return NextResponse.json(
                { message: "Employee account activated successfully", user: existingUser },
                { status: 200 }
            );
        } else {
            // HR flow
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return NextResponse.json(
                    { message: "User already exists with this email" },
                    { status: 400 }
                );
            }

            if (!hashedPassword) {
                return NextResponse.json(
                    { message: "Password is required for registration." },
                    { status: 400 }
                );
            }

            // Create HR User
            const newUser = new User({
                name,
                email,
                password: hashedPassword,
                role: "hr",
                status: "active",
                avatar: avatar || `https://robohash.org/${email}`,
                gender: gender || "male",
            });

            await newUser.save();

            return NextResponse.json(
                { message: "HR registered successfully", user: newUser },
                { status: 201 }
            );
        }
    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
