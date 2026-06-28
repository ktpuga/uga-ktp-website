import Image from "next/image"
import Link from "next/link"
import ProfileForm from "./ProfileForm"

export const metadata = { title: "Complete Your Profile — KTP" }

export default function CompleteProfile() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#14326E" }}>
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Image
              src="/KTP PHI CHAPTER.svg"
              alt="Kappa Theta Pi — Phi Chapter"
              width={150}
              height={77}
              priority
              style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 18px rgba(255,255,255,0.15))" }}
            />
          </Link>
          <h1 className="text-2xl font-semibold text-white text-center">Complete Your Profile</h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            Fill in your details to finish setting up your KTP account.
            You can update this information later from your profile settings.
          </p>
        </div>

        <ProfileForm />
      </div>
    </div>
  )
}
