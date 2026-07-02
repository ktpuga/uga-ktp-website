"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { saveProfile } from "./actions"

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function ProfileForm() {
  const { update } = useSession()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.target)
    const semester = formData.get("graduation_semester")
    const year = formData.get("graduation_year")
    if (semester && year) {
      formData.set("graduation_date", `${semester} ${year}`)
    }
    formData.delete("graduation_semester")
    formData.delete("graduation_year")

    const result = await saveProfile(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Refresh the JWT so profile_complete flips to true in the session,
    // which tells the middleware to stop redirecting here
    await update({ profile_complete: true })
    window.location.href = "/auth/redirect"
  }

  const inputClass = "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/50"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" required>
          <Input name="first_name" required className={inputClass} />
        </Field>
        <Field label="Last Name" required>
          <Input name="last_name" required className={inputClass} />
        </Field>
      </div>

      <Field label="Preferred Name">
        <Input name="preferred_name" placeholder="Leave blank to use first name" className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth">
          <Input type="date" name="dob" className={inputClass} />
        </Field>
        <Field label="Graduation">
          <div className="flex gap-2">
            <select name="graduation_semester" className={`${inputClass} flex-1 h-10 rounded-md border px-3 py-2 text-sm`}>
              <option value="" className="bg-[#14326E]">Semester</option>
              <option value="Spring" className="bg-[#14326E]">Spring</option>
              <option value="Fall" className="bg-[#14326E]">Fall</option>
            </select>
            <Input name="graduation_year" placeholder="2026" maxLength={4} className={`${inputClass} w-24`} />
          </div>
        </Field>
      </div>

      <Field label="Major">
        <Input name="major" placeholder="e.g. Computer Science" className={inputClass} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email">
          <Input type="email" name="email" className={inputClass} />
        </Field>
        <Field label="Phone Number">
          <Input type="tel" name="phone" placeholder="(555) 000-0000" className={inputClass} />
        </Field>
      </div>

      <Field label="LinkedIn URL">
        <Input name="linkedin_url" placeholder="https://linkedin.com/in/..." className={inputClass} />
      </Field>

      <Field label="Pledge Class">
        <Input name="pledge_class" placeholder="e.g. Alpha, Beta, Gamma" className={inputClass} />
      </Field>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2A5CCA] hover:bg-[#3570DB] text-white font-semibold tracking-wider py-3 uppercase"
      >
        {loading ? "Saving..." : "Complete Profile"}
      </Button>
    </form>
  )
}
