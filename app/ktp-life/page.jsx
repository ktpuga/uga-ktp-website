"use client";
import PageLayout from "@/components/page-layout";
import { AOSInit } from "@/components/ui/timeline";

export default function KTPLifePage() {
  return (
    <PageLayout>
      <AOSInit />

      {/* ===============================  HERO  ============================== */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-25 blur-[120px]" />
          <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-20 blur-[110px]" />
        </div>

        <div className="container mx-auto max-w-6xl px-4 md:px-6">
          <div
            className="text-center max-w-3xl mx-auto"
            data-aos="fade-up"
            data-aos-duration="600"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wider text-blue-600 shadow-sm mb-4">
              Phi Chapter at UGA
            </p>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-blue-900 drop-shadow-xl mb-4">
              KTP Life
            </h1>
            <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto">
              More than a fraternity — a community of builders, leaders, and
              lifelong friends.
            </p>
          </div>
        </div>
      </section>

      {/* ===============================  CONTENT  =========================== */}
      {/* Add your sections here */}

    </PageLayout>
  );
}
