import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|_vercel).*)',
  ],
};

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  const currentHost = hostname.split(':')[0];
  const baseDomain = currentHost.includes('localhost') ? 'localhost' : 'maakjefeest.nl';

  if (
    currentHost !== baseDomain &&
    currentHost !== `www.${baseDomain}` &&
    currentHost.endsWith(`.${baseDomain}`)
  ) {
    const slug = currentHost.replace(`.${baseDomain}`, '');
    url.pathname = `/events/${slug}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
