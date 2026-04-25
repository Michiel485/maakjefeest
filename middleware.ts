import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// De matcher zorgt ervoor dat de middleware NOOIT CSS, JS of images aanraakt
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|_vercel).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  // Verwijder poorten voor lokale testen
  const currentHost = hostname.split(':')[0];
  const baseDomain = currentHost.includes('localhost') ? 'localhost' : 'maakjefeest.nl';

  // Als het een subdomein is (en niet www of de hoofdsite)
  if (
    currentHost !== baseDomain &&
    currentHost !== `www.${baseDomain}` &&
    currentHost.endsWith(`.${baseDomain}`)
  ) {
    const slug = currentHost.replace(`.${baseDomain}`, '');

    // Rewrite onzichtbaar naar de events map
    url.pathname = `/events/${slug}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
