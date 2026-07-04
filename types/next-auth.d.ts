import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    
    interface Session {
        user: {
            /** The user's unique identifier */
            id: string;
            /** The user's avatar URL */
            avatar?: string;
            /** The user's gender */
            gender?: string;
            /** The user's employee ID */
            employeeId?: string;
            /** The user's role (employee or hr) */
            role?: string;
            /** The user's organization ID */
            organizationId?: string;
        } & DefaultSession["user"];
    }

    interface User {
        avatar?: string;
        gender?: string;
        employeeId?: string;
        role?: string;
        organizationId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        avatar?: string;
        gender?: string;
        employeeId?: string;
        role?: string;
        organizationId?: string;
    }
}
