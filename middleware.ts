import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const session_token = request.cookies.get("session_token")?.value
  const { pathname } = request.nextUrl

  // List of protected routes
  const protectedRoutes = ["/dashboard"]

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !session_token) {
    // Redirect to login if no session
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
}
