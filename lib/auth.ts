import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase";
import { getUserByEmail, getUserById, createUser } from "@/lib/services";

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

                try {
                    // Firebase Auth supports sign in via email and password
                    // If credentials.email is an employeeId, we resolve it to email first
                    let email = credentials.email.trim();
                    if (!email.includes("@")) {
                        // Resolve employeeId to email
                        const usersRef = await import("@/lib/services");
                        const resolvedUser = await usersRef.getUserByEmailOrEmployeeId(email);
                        if (resolvedUser && resolvedUser.email) {
                            email = resolvedUser.email;
                        } else {
                            throw new Error("Invalid credentials");
                        }
                    }

                    // Authenticate with Firebase Auth directly
                    const userCredential = await signInWithEmailAndPassword(
                        firebaseAuth,
                        email,
                        credentials.password
                    );

                    const firebaseUser = userCredential.user;

                    // Fetch complete user document details from Firestore
                    // Try by Firebase Auth UID first
                    let user = await getUserById(firebaseUser.uid);

                    if (!user) {
                        // If not found by UID, check by email
                        const userByEmail = await getUserByEmail(email);
                        if (userByEmail) {
                            // Copy the old document to the new UID document ID and delete the old one
                            user = await createUser({
                                id: firebaseUser.uid,
                                name: userByEmail.name,
                                email: userByEmail.email,
                                role: userByEmail.role || "employee",
                                status: "active",
                                organizationId: userByEmail.organizationId || null,
                                employeeId: userByEmail.employeeId || null,
                                avatar: userByEmail.avatar || firebaseUser.photoURL || `https://robohash.org/${email}`,
                                gender: userByEmail.gender || "male",
                                state: userByEmail.state || null,
                                city: userByEmail.city || null,
                                pincode: userByEmail.pincode || null,
                                isAddressUpdated: userByEmail.isAddressUpdated || false,
                            });
                            
                            // Delete old document
                            const { doc, deleteDoc } = await import("firebase/firestore");
                            const { db } = await import("@/lib/firebase");
                            await deleteDoc(doc(db, "users", userByEmail.id));
                        } else {
                            // Create a completely new user document
                            user = await createUser({
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || email.split("@")[0],
                                email: email,
                                role: "employee",
                                status: "active",
                                avatar: firebaseUser.photoURL || `https://robohash.org/${email}`,
                                gender: "male",
                            });
                        }
                    }

                    return {
                        id: user.id, // Use Firestore document ID as the NextAuth session ID
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        gender: user.gender,
                        employeeId: user.employeeId,
                        role: user.role,
                        organizationId: user.organizationId ? user.organizationId.toString() : undefined,
                    };
                } catch (error: any) {
                    console.error("Firebase Auth error:", error.code || error.message);
                    throw new Error("Invalid credentials");
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
        updateAge: 10, // Check session token every 10 seconds
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
