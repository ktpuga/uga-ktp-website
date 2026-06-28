import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AuthRedirect() {
  const session = await auth()
  if (!session) redirect("/login")

  const groups = (session.user?.groups ?? [])

  if (groups.includes("eboard")) redirect("/admin")
  if (groups.includes("alumni")) redirect("/alumni")
  if (groups.includes("pledge")) redirect("/pledge")
  redirect("/member")
}
