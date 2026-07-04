import { NextResponse } from "next/server";
import { validateEmail, validatePassword } from "@/lib/validations";
import { getUserByEmail, createUser, updateUser } from "@/lib/services";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
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

        if (role === "employee") {
            const existingUser = await getUserByEmail(email);
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

            if (!password) {
                return NextResponse.json(
                    { message: "Password is required to complete account setup." },
                    { status: 400 }
                );
            }

            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(
                firebaseAuth,
                email,
                password
            );
            const firebaseUser = userCredential.user;

            // Copy pre-created employee document in Firestore with document ID set to firebaseUser.uid
            const updatedUser = await createUser({
                id: firebaseUser.uid,
                name: existingUser.name,
                email: existingUser.email,
                employeeId: existingUser.employeeId,
                role: "employee",
                status: "active",
                organizationId: existingUser.organizationId,
                avatar: avatar || existingUser.avatar || `https://robohash.org/${email}`,
                gender: gender || existingUser.gender || "male",
            });

            // Delete the old pre-created document with auto-generated ID
            const { doc, deleteDoc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            await deleteDoc(doc(db, "users", existingUser.id));

            return NextResponse.json(
                { message: "Employee account activated successfully", user: updatedUser },
                { status: 200 }
            );
        } else {
            // HR flow
            const existingUser = await getUserByEmail(email);
            if (existingUser) {
                return NextResponse.json(
                    { message: "User already exists with this email" },
                    { status: 400 }
                );
            }

            if (!password) {
                return NextResponse.json(
                    { message: "Password is required for registration." },
                    { status: 400 }
                );
            }

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                firebaseAuth,
                email,
                password
            );
            const firebaseUser = userCredential.user;

            // Create HR User document in Firestore using firebaseUser.uid as ID
            const newUser = await createUser({
                id: firebaseUser.uid,
                name,
                email,
                role: "hr",
                status: "active",
                avatar: avatar || `https://robohash.org/${email}`,
                gender: gender || "male",
            });

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
