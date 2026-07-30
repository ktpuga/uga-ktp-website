import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { homePortal } from "@/lib/home-portal"

export default async function AuthRedirect() {
  const session = await auth()
  if (!session || session.error) redirect("/login")

  // Shared with middleware.ts — see lib/home-portal.js for why this rule isn't
  // written out again here. It previously omitted the rush portal, which left
  // rushees signed in but stranded on the public homepage.
  redirect(homePortal(session.user?.groups ?? []))
}
