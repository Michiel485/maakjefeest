import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|_vercel).*)"],
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone()
  const hostname = req.headers.get("host") || ""
  const currentHost = hostname.split(":")[0]
  const baseDomain = currentHost.includes("localhost") ? "localhost" : "maakjefeest.nl"

  // Subdomain rewrite for event pages (e.g. janenjoop.maakjefeest.nl)
  if (
    currentHost !== baseDomain &&
    currentHost !== `www.${baseDomain}` &&
    currentHost.endsWith(`.${baseDomain}`)
  ) {
    const slug = currentHost.replace(`.${baseDomain}`, "")
    url.pathname = `/events/${slug}${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Dashboard protection: require Supabase Auth session
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    let supabaseResponse = NextResponse.next({ request: req })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request: req })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/inloggen"
      loginUrl.searchParams.set("next", req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  return NextResponse.next()
}
