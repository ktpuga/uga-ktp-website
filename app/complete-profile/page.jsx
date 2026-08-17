import Image from "next/image"
import Link from "next/link"
import ProfileForm from "./ProfileForm"

export const metadata = { title: "Complete Your Profile" }

export default function CompleteProfile() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#081b42] p-4">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-28 h-[32rem] w-[32rem] rounded-full bg-[#2454a6]/35 blur-[120px]" />
        <div className="absolute -bottom-44 -right-28 h-[34rem] w-[34rem] rounded-full bg-[#d4af37]/15 blur-[140px]" />
      </div>
      <div className="relative w-full max-w-2xl py-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 inline-flex items-center justify-center transition-transform hover:scale-[1.02]">
            <Image
              src="/KTP PHI CHAPTER.svg"
              alt="Kappa Theta Pi, Phi Chapter"
              width={150}
              height={77}
              priority
              style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 22px rgba(255,255,255,0.2))" }}
            />
          </Link>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f0d060]">Phi Chapter · UGA</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Build your KTP profile</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            Fill in your details to finish setting up your KTP account.
            You can update this information later from your profile settings.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.07] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-7">
          <ProfileForm />
        </div>
      </div>
    </div>
  )
}
