import { ROOT_DOMAIN } from "@/utils/constants";
import { NextRequest, NextResponse } from "next/server";

function extractSubdomain(request: NextRequest): string | null {
    const url = request.url;
    const host = request.headers.get("host") || "";
    const hostname = host.split(":")[0];

    // Localhost development environment
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
        const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
        if (fullUrlMatch && fullUrlMatch[1]) {
            return fullUrlMatch[1];
        }

        if (hostname.startsWith("localhost")) {
            return null;
        } else if (hostname.includes("localhost")) {
            return hostname.split(".")[0];
        }

        return null;
    }


    // Production environment
    const rootDomainFormatted = ROOT_DOMAIN.split(":")[0];

    // Handle preview deployments URLs (app.{ROOT_DOMAIN})
    if (hostname.startsWith(`app.${rootDomainFormatted}`)) {
        return "app";
    }

    if (hostname === rootDomainFormatted || hostname === `www.${rootDomainFormatted}`) {
        return null; // No subdomain, just the root domain
    }

    if (hostname.endsWith(`.${rootDomainFormatted}`)) {
        const subdomain = hostname.replace(`.${rootDomainFormatted}`, "");
        return subdomain;
    }

    const isSubdomain = hostname !== rootDomainFormatted;

    return isSubdomain ? hostname.split(".")[0] : null;
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const subdomain = extractSubdomain(request);

    // If no subdomain, proceed as normal
    if (!subdomain) {
        // Block access to /app on root domain - return 404
        if (pathname.startsWith("/app")) {
            return new NextResponse(null, { status: 404 });
        }

        return; // Allow other routes on root domain (landing pages)
    }

    if (subdomain === "whitepaper") {
        const url = request.nextUrl.clone();
        url.pathname = `/whitepaper.pdf`;
        return NextResponse.rewrite(url);
    }

    // Handle 'app' subdomain
    if (subdomain === "app") {
        // Rewrite to /app path instead of redirecting
        const url = request.nextUrl.clone();
        
        // Don't rewrite if already under /app
        if (pathname.startsWith("/app")) {
            return; // Already correct path
        }
        
        // Handle root path
        if (pathname === "/") {
            url.pathname = "/app";
        } else {
            // Rewrite all paths under /app
            url.pathname = `/app${pathname}`;
        }
        
        return NextResponse.rewrite(url);
    }

    // For other subdomains, redirect to a custom page or handle as needed
    const url = request.nextUrl.clone();
    url.pathname = `/custom-subdomain`; // Change to your custom subdomain handling path
    url.searchParams.set("subdomain", subdomain);
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: [
        /* Match all request paths except for the ones starting with:
       - api (API routes)
       - _next/static (static files)
       - _next/image (image optimization files)
       - favicon.ico (favicon file)
       - public (public files)
       - assets (assets files)
       */
        "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
    ],
};