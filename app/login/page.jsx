"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ROLES = [
  { id: "member", label: "Member" },
  { id: "alumni", label: "Alumni" },
  { id: "Leadership", label: "Leadership" },
];

export default function Login() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const handleLogin = (role) => {
    if (role === "member") {
      router.push("/member");
    } else if (role === "alumni") {
      router.push("/alumni");
    } else {
      router.push("/admin");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "#14326E" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center mb-6"
          >
            <Image
              src="/KTP PHI CHAPTER.svg"
              alt="Kappa Theta Pi - Phi Chapter"
              width={180}
              height={92}
              priority
              style={{
                filter:
                  "brightness(0) invert(1) drop-shadow(0 0 18px rgba(255, 255, 255, 0.15))",
              }}
            />
          </Link>
          <h1 className="text-2xl font-semibold text-white text-center">
            Sign in to your KTP Account
          </h1>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRole(role.id)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all min-w-[88px] ${
                activeRole === role.id
                  ? "bg-white text-[#14326E] shadow-md"
                  : "bg-[#1d4090] text-white/80 hover:bg-[#244da8]"
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/60 text-sm">or</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(activeRole);
          }}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-xs font-semibold tracking-wider text-white/80 uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border border-white/40 rounded-md px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/60 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-xs font-semibold tracking-wider text-white/80 uppercase"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border border-white/40 rounded-md px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/60 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 text-white/90 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
            <span>Keep me signed in</span>
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white/40 text-white/60 text-[10px]"
            >
              ?
            </span>
          </label>

          <button
            type="submit"
            className="w-full bg-[#2A5CCA] hover:bg-[#3570DB] text-white font-semibold tracking-wider py-3 rounded-md uppercase transition-colors shadow-lg"
          >
            Sign In as {ROLES.find((role) => role.id === activeRole)?.label}
          </button>

          <div className="text-center">
            <a href="#" className="text-[#6CA0FF] hover:underline text-sm">
              Forgot your password?
            </a>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
