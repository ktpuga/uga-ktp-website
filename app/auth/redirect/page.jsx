import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { homePortal } from "@/lib/home-portal"

export default async function AuthRedirect() {
  const session = await auth()

  // No session of ours, but landing HERE means the visitor was on their way
  // into the portal — most often straight out of the Authentik enrollment
  // flow, where they have an Authentik session and we simply haven't traded
  // it for one yet. /auth/start finishes that trade silently.
  //
  // Sending them to /login instead (what this used to do) hands them to the
  // `prompt=none` probe, which cannot grant a brand-new account's first
  // consent — so a rushee who had just signed up was bounced to a page
  // offering them the button they should never have needed.
  if (!session || session.error) redirect("/auth/start")

  // Shared with middleware.ts — see lib/home-portal.js for why this rule isn't
  // written out again here. It previously omitted the rush portal, which left
  // rushees signed in but stranded on the public homepage.
  redirect(homePortal(session.user?.groups ?? []))
}
