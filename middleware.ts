import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname

  console.log('hostname:', hostname)

  // Werkt op Vercel: hostname is exact "bruiloft-m-en-l.maakjefeest.nl"
  if (hostname.endsWith('.maakjefeest.nl') && !hostname.startsWith('www.')) {
    const slug = hostname.replace('.maakjefeest.nl', '')
    console.log('slug gevonden:', slug)

    const url = request.nextUrl.clone()
    url.pathname = `/events/${slug}${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}
