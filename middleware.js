import { NextResponse } from "next/server";

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Public paths define karein jahan bina login ke ja sakte hain
  const isPublicPath = path === "/login" || path === "/book-online";

  // Browser ki cookies se admin token check karein
  const token = request.cookies.get("admin-token")?.value || "";

  // Agar path public nahi hai aur token bhi nahi hai, toh login par bhej dein
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Agar user pehle se logged in hai aur login page par jane ki koshish kare, toh dashboard par bhej dein
  if (path === "/login" && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

// Ye config batata hai ki middleware kin routes par chalna chahiye
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
