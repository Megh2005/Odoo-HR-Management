import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmailOrEmployeeId, verifyPassword } from "@/lib/services";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email or Employee ID", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await getUserByEmailOrEmployeeId(credentials.email);

                if (!user) {
                    throw new Error("Invalid credentials");
                }

                const isCorrectPassword = await verifyPassword(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    gender: user.gender,
                    employeeId: user.employeeId,
                    role: user.role,
                    organizationId: user.organizationId ? user.organizationId.toString() : undefined,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/auth",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            // Initial sign in - user object is available
            if (user) {
                token.avatar = user.avatar;
                token.gender = user.gender;
                token.employeeId = user.employeeId;
                token.role = user.role;
                token.organizationId = user.organizationId;
            }

            // Session update triggered - fetch fresh data from database
            if (trigger === "update") {
                const { getUserById } = await import("@/lib/services");
                const freshUser = await getUserById(token.sub);

                if (freshUser) {
                    token.name = freshUser.name;
                    token.email = freshUser.email;
                    token.avatar = freshUser.avatar;
                    token.gender = freshUser.gender;
                    token.employeeId = freshUser.employeeId;
                    token.role = freshUser.role;
                    token.organizationId = freshUser.organizationId ? freshUser.organizationId.toString() : undefined;
                }
            }

            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.avatar = token.avatar;
                session.user.gender = token.gender;
                session.user.employeeId = token.employeeId;
                session.user.role = token.role;
                session.user.organizationId = token.organizationId;
            }
            return session;
        },
    },
};
