import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import { validatePincode } from "@/lib/pincode-validator";
import { indianStatesAndCities } from "@/lib/states";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { state, city, pincode } = await req.json();

        if (!state || !city || !pincode) {
            return NextResponse.json(
                { message: "State, City and Pincode are required" },
                { status: 400 }
            );
        }

        // Validate State
        if (!indianStatesAndCities[state]) {
            return NextResponse.json(
                { message: "Invalid State selected" },
                { status: 400 }
            );
        }

        // Validate City
        if (!indianStatesAndCities[state].includes(city)) {
            return NextResponse.json(
                { message: "Invalid City for the selected State" },
                { status: 400 }
            );
        }

        // Validate Pincode
        const validation = validatePincode(state, city, pincode);
        if (!validation.isValid) {
            return NextResponse.json(
                { message: validation.message || "Invalid Pincode" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        user.state = state;
        user.city = city;
        user.pincode = pincode;

        await user.save();

        return NextResponse.json(
            { message: "Profile updated successfully", user },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
