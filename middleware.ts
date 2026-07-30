import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { homePortal } from "@/lib/home-portal"

// Returns the home portal path for a user based on their Authentik groups.
// Used to redirect users who try to access a portal they don't belong to.
// Shared with app/auth/redirect/page.jsx. Deliberately NOT redefined here —
// the two copies have drifted apart twice, and both times it presented as
// "login is broken". See lib/home-portal.js.

export default auth((req) => {
  // Not logged in, or a token refresh already failed (see auth.ts) — send to
  // login page rather than letting the page load and hit the same dead
  // access token when it tries to fetch data.
  if (!req.auth || (req.auth as any).error)
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

  if (path.startsWith("/rushee") && !groups.includes("rush"))
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
    "/rushee",
    "/rushee/:path*",
    "/complete-profile",
    "/complete-profile/:path*",
  ],
}
