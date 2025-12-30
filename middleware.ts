import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/login(.*)", "/signup(.*)", "/api/webhooks/stripe", "/about", "/docs", "/api-reference", "/community", "/privacy", "/terms", "/security"]);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl;
    const hostname = req.headers.get("host")!;

    // 1. Define our domains
    const appDomain = process.env.NODE_ENV === "production" ? "heftcoder.icu" : "localhost:3000";
    const userDomain = process.env.NODE_ENV === "production" ? "nextcoder.icu" : "nextcoder.localhost:3000";

    // 2. Check which domain we are on
    const isAppDomain = hostname === appDomain || hostname.includes(appDomain) || hostname.includes("localhost");
    const isUserDomain = hostname.includes(userDomain);

    // --- SCENARIO A: User visits the Main App (heftcoder.icu or localhost) ---
    if (isAppDomain) {
        if (!isPublicRoute(req)) {
            await auth.protect();
        }
        return NextResponse.next();
    }

    // --- SCENARIO B: User visits a Project (cool-project.nextcoder.icu) ---
    if (isUserDomain) {
        const subdomain = hostname.replace(`.${userDomain}`, "");
        // Rewrite to the internal route that handles preview rendering
        return NextResponse.rewrite(new URL(`/_sites/${subdomain}${url.pathname}`, req.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
