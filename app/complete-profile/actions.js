"use server"

import { auth } from "@/auth"
import { getAccessToken } from "@/lib/access-token"

export async function saveProfile(formData) {
  const session = await auth()
  if (!session) return { error: "Not authenticated" }
  const accessToken = await getAccessToken()
  if (!accessToken) return { error: "No access token in session" }

  const payload = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    preferred_name: formData.get("preferred_name") || null,
    dob: formData.get("dob") || null,
    major: formData.get("major") || null,
    graduation_date: formData.get("graduation_date") || null,
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    linkedin_url: formData.get("linkedin_url") || null,
    pledge_class: formData.get("pledge_class") || null,
  }

  try {
    const res = await fetch(`${process.env.API_URL}/users/me/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { error: err.message ?? "Failed to save profile. Please try again." }
    }

    return { success: true }
  } catch {
    return { error: "Could not reach the server. Please try again." }
  }
}
