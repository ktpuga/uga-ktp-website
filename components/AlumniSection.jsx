// components/AlumniSection.jsx
// 📌 Add this file to your components directory and import it where you want the alumni section to appear.
// The top‑right badge now supports **either** a react‑icon *or* a custom image logo.
// If `alum.icon` is a component, we render it; if it’s a string (URL), we show that image.

import Card from "@/components/ui/Card"; // adjust path if Card lives elsewhere
import React, { useEffect, useState } from 'react';
import { FaGoogle, FaUniversity, FaUps } from "react-icons/fa";
  
// ⬇️ Headshot images
function importAll(r) {
  const images = {};
  r.keys().forEach((item) => {
    images[item.replace("./", "")] = r(item);
  });
  return images;
}
const leadershipImages = importAll(
  require.context("../public/leadership/", false, /\.(png|jpe?g|svg)$/)
);
const memberImages = importAll(
  require.context("../public/members/", false, /\.(png|jpe?g|svg)$/)
);
const images = { ...leadershipImages, ...memberImages };

// 🔗 Remote company / university logos (use any URL or local static file)
const logos = {
  invesco:
    "https://images.seeklogo.com/logo-png/32/1/invesco-logo-png_seeklogo-321428.png",
    statefarm:
    "https://freepnglogo.com/images/all_img/1725554212state-farm-symbol-logo.png",
    deloitte:
    "https://upload.wikimedia.org/wikipedia/commons/2/2b/DeloitteNewSmall.png",
}

// 🗂️ Alumni data
const alumniData = [
  {
    name: "Gargee Jamadagni",
    classYear: 2025,
    bio: "",
    class: "Founder",
    avatarSrc: images["gargee.jpeg"].default.src,
    fallbackInitials: "GJ",
    instagramUrl: "https://www.instagram.com/gargee.jam/",
    linkedinUrl: "https://www.linkedin.com/in/gargeejamadagni/",
    icon: FaUniversity, // grad‑school
  },
  {
    name: "Siya Sharma",
    classYear: 2025,
    bio: "",
    class: "Founder",
    avatarSrc: images["siya.jpeg"].default.src,
    fallbackInitials: "SS",
    instagramUrl: "https://www.instagram.com/siyasharma.03/",
    linkedinUrl: "https://www.linkedin.com/in/siya-sharma-ss2025/",
    icon: logos.invesco, // custom image logo
  },
  {
    name: "Jiya Patel",
    classYear: 2024,
    class: "Founder",
    bio: "Jiya Patel is a recent graduate with a degree in computer science from UGA and is currently doing a master's in Cybersecurity. She is involved in UGAHacks and GDG. In her free time she enjoys painting, shopping, working out and watching Netflix.",
    avatarSrc: images["jiya.jpeg"].default.src,
    fallbackInitials: "JP",
    instagramUrl: "https://www.instagram.com/jiyanpatel31/",
    linkedinUrl: "https://www.linkedin.com/in/jiya-patel-422615228/",
    icon: FaUps, // industry (placeholder icon)
  },
  {
    name: "Khushi Bhatamrekar",
    classYear: 2025,
    class: "Founder",
    bio: "Khushi Bhatamrekar is a senior studying Computer Science and Cognitive Science at UGA. She is a part of UGAHacks, GDG and enjoys dancing, running, and spending time with her friends",
    avatarSrc: images["khushi.jpeg"].default.src,
    fallbackInitials: "KB",
    instagramUrl: "https://www.instagram.com/khuxhix/",
    linkedinUrl: "https://www.linkedin.com/in/khushibhat/",
    icon: FaGoogle,
  },
  {
    name: "Shriya Rasale",
    classYear: 2025,
    class: "Alpha",
    bio: "",
    avatarSrc: images["ShriyaR.jpeg"].default.src,
    fallbackInitials: "SB",
    instagramUrl: "https://www.instagram.com/shriya_rasale/",
    linkedinUrl: "https://www.linkedin.com/in/shriya-rasale",
    icon: logos.statefarm,
  },
  {
    name: "Venn Reddy",
    classYear: 2025,
    class: "Affiliate",
    bio: "",
    avatarSrc: images["venn.jpeg"].default.src,
    fallbackInitials: "VR",
    instagramUrl: "https://www.instagram.com/venn.reddy/",
    linkedinUrl: "https://www.linkedin.com/in/venn-reddy/",
    icon: logos.deloitte,
  },
].sort((a, b) => a.classYear - b.classYear);

function AlumniCard({ alum }) {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 599)
    updateMobile()
    window.addEventListener('resize', updateMobile)
    return () => window.removeEventListener('resize', updateMobile)
  }, [])

  // decide where to place the badge
  const badgePos = mobile ? 'top-2 right-2' : 'top-2 right-8'

  const badgeEl = (() => {
    if (!alum.icon) return null
    if (typeof alum.icon === 'string')
      return (
        <img src={alum.icon} alt="organization logo" className="h-8 w-8 object-contain" />
      )
    const Icon = alum.icon
    return <Icon />
  })()

  return (
    <div className="relative">
      <Card
        name={alum.name}
        title={
          <>
            {alum.class && (
              <>
                <strong>{alum.class}</strong>
                <br />
              </>
            )}
            Class of {alum.classYear}
          </>
        }
        bio={alum.bio}
        avatarSrc={alum.avatarSrc}
        fallbackInitials={alum.fallbackInitials}
        instagramUrl={alum.instagramUrl}
        linkedinUrl={alum.linkedinUrl}
      />
      {badgeEl && (
        <span className={`absolute ${badgePos} text-xl text-slate-600`}>{badgeEl}</span>
      )}
    </div>
  )
}

// ===== section wrapper =====
export default function AlumniSection() {
  return (
    <section id="alumni" className="bg-white py-16 md:py-24">
      <div
        className="container mx-auto max-w-6xl px-4 md:px-6"
        data-aos="fade-up"
        data-aos-duration="600"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Meet Our Alumni Base</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-700">
            Celebrating ΚΘΠ alumni and their ongoing impact.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 text-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {alumniData.map((alum) => (
            <AlumniCard key={alum.name} alum={alum} />
          ))}
        </div>
      </div>
    </section>
  )
}
