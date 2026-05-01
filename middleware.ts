import { NextRequest, NextResponse } from "next/server"

const ROOT_HOSTS = new Set(["sayingyes.nl", "www.sayingyes.nl"])

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const hostname = host.split(":")[0] // strip port for local dev

  // Only apply subdomain routing on the production domain
  if (!hostname.endsWith(".sayingyes.nl")) return NextResponse.next()

  const subdomain = hostname.replace(/\.sayingyes\.nl$/, "")

  // www and root → pass through to the landing page
  if (ROOT_HOSTS.has(hostname) || subdomain === "www") return NextResponse.next()

  // Rewrite slug.sayingyes.nl/[...path] → /events/slug/[...path]
  const { pathname, search } = request.nextUrl
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = `/events/${subdomain}${pathname === "/" ? "" : pathname}`

  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
