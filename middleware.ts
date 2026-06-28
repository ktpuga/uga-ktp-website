import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Returns the home portal path for a user based on their Authentik groups.
// Used to redirect users who try to access a portal they don't belong to.
function homePortal(groups: string[]): string {
  if (groups.includes("eboard")) return "/admin"
  if (groups.includes("chair") || groups.includes("active")) return "/member"
  if (groups.includes("alumni")) return "/alumni"
  if (groups.includes("pledge")) return "/pledge"
  return "/login"
}

export default auth((req) => {
  // Not logged in — send to login page
  if (!req.auth)
    return NextResponse.redirect(new URL("/login", req.url))

  const user = req.auth.user as any
  const groups: string[] = user.groups ?? []
  const path = req.nextUrl.pathname

  // Profile not complete — force onboarding before anything else
  if (!user.profile_complete && !path.startsWith("/complete-profile"))
    return NextResponse.redirect(new URL("/complete-profile", req.url))

  // Enforce strict portal boundaries — each group only sees their portal
  if (path.startsWith("/admin") && !groups.includes("eboard"))
    return NextResponse.redirect(new URL(homePortal(groups), req.url))

  if (path.startsWith("/member") && !groups.includes("chair") && !groups.includes("active"))
    return NextResponse.redirect(new URL(homePortal(groups), req.url))

  if (path.startsWith("/alumni") && !groups.includes("alumni"))
    return NextResponse.redirect(new URL(homePortal(groups), req.url))

  if (path.startsWith("/pledge") && !groups.includes("pledge"))
    return NextResponse.redirect(new URL(homePortal(groups), req.url))
})

export const config = {
  // List both the exact path and the wildcard so /member (no slash) is also protected
  matcher: [
    "/member",
    "/member/:path*",
    "/admin",
    "/admin/:path*",
    "/alumni",
    "/alumni/:path*",
    "/pledge",
    "/pledge/:path*",
    "/complete-profile",
    "/complete-profile/:path*",
  ],
}
