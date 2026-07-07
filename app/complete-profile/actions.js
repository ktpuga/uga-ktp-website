"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { buildProfilePayload } from "@/lib/profile"

// if you need to figure the order this goes in

// check components/profile/ProfileForm.jsx line 65-72
// then lib/profile.js
// then check here?
// or just use ai ask where everything goes
import { getAccessToken } from "@/lib/access-token"

export async function saveProfile(formData) {
  const session = await auth()
  if (!session) redirect("/login")
  const accessToken = await getAccessToken()
  if (!accessToken) redirect("/login")

  //
  const payload = buildProfilePayload(formData)

  // I mean this is straight forward
  let res
  try {
    // trys to fetch the profile part of the api
    res = await fetch(`${process.env.API_URL}/users/me/profile`, {
      // we use PUT to not get members but instead update the user information
      method: "PUT",
      // we are updating the information with json based text
      // and we also need the authorazation of the users session so no random can go and edit our stuff
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      // the "payload" is just the information we got from when the user tried to update their information
      // kinda stupid to call it payload just sounds like overwatch
      body: JSON.stringify(payload),
    })
  } catch {
    return { error: "Could not reach the server. Please try again." }
  }

  if (res.status === 401) redirect("/login")

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.message ?? "Failed to save profile. Please try again." }
  }

  return { success: true }
}
