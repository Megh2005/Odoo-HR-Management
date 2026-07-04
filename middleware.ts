import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req: NextRequestWithAuth) {
        const { pathname } = req.nextUrl;
        const isAuth = !!req.nextauth.token;
        const publicRoutes = ["/", "/contact", "/about"];

        if (publicRoutes.includes(pathname) || pathname.startsWith("/auth")) {
            return NextResponse.next();
        }

        if (!isAuth) {
            const url = req.nextUrl.clone();
            url.pathname = "/auth/signin";
            url.search = "";
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: () => true,
        },
        pages: {
            signIn: "/auth/signin",
        },
    }
);

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
