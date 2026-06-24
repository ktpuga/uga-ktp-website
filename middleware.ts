import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth)
    return NextResponse.redirect(new URL("/login", req.url))

  const groups: string[] = (req.auth.user as any).groups ?? []

  if (req.nextUrl.pathname.startsWith("/admin") && !groups.includes("admin"))
    return NextResponse.redirect(new URL("/member", req.url))
})

export const config = {
  matcher: ["/member/:path*", "/admin/:path*", "/alumni/:path*"],
}
