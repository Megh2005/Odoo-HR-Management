import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, updateUser, getOrganizationById } from "@/lib/services";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await getUserByEmail(session.user.email);

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Exclude password
        if (user.password) {
            delete user.password;
        }

        // Populate organization
        if (user.organizationId) {
            const org = await getOrganizationById(user.organizationId);
            if (org) {
                user.organizationId = org;
            }
        }

        if (!user.isAddressUpdated && user.state && user.city && user.pincode) {
            user.isAddressUpdated = true;
            await updateUser(user.id, { isAddressUpdated: true });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
