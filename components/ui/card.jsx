"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as React from "react";
import { cn } from "@/lib/utils";
// Plain function, no server imports — portal-format is deliberately separate
// from portal-api ('use server') so client components can use it.
import { safeExternalHref, traitText } from "@/lib/portal-format";

/* ── Shadcn-style layout card components (named exports) ── */

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

/* ── Exec-board profile card (default export) ── */

function InstagramIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// Hand-rolled like the three above rather than pulled from lucide: this file
// carries its own icons so the public marketing pages don't load the icon
// library for four glyphs.
function LinkIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function MailIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  );
}

// `avatarShape="square"` opts into a rounded square instead of the default
// circle — the roster uses it so more of each photo is visible. Both the Root
// and the Fallback need the override, since each carries its own rounded-full.
// `avatarSize="lg"` opts into a noticeably larger photo. Opt-in rather than a
// blanket change because this component is also used by the sponsorship page,
// whose cards are laid out around the smaller default — the roster wants the
// photo to be the point, sponsorship does not.
const AVATAR_SIZES = { default: "w-20 h-20", lg: "w-32 h-32 sm:w-36 sm:h-36" };

// `note` is one line of the member's own free text, rendered between their role
// and the icon row. It exists for the public roster's alumni cards ("SWE at
// Google", "Law school at Emory"), but it is deliberately generic rather than
// called `currentRole`: this card is shared by the roster, the sponsorship page,
// the alumni section and the homepage, and a prop named after one caller's use
// invites the next caller to add a second, near-identical one.
//
// Optional, so every existing caller renders exactly as before.
const ProfileCard = ({ name, title, note, traits, links, bio, avatarSrc, fallbackInitials, instagramUrl, linkedinUrl, otherUrl, email, className, avatarShape = "circle", avatarSize = "default" }) => {
  const squareAvatar = avatarShape === "square";
  // Every href is re-checked here rather than trusted from the API. Write-time
  // validation (services/urls.js) only ever covered rows written after it
  // existed, and this card renders on a page with no authentication, so a
  // `javascript:` URL stored before then would be a stored-XSS on the most
  // public page the site has. safeExternalHref returns null for anything that
  // isn't plain http(s), which drops the chip rather than rendering it dead.
  const safeLinks = (links ?? [])
    .map((link) => ({ label: link?.label, href: safeExternalHref(link?.url) }))
    .filter((link) => link.href && link.label);
  // Coerced rather than rendered directly: React throws on an object child, so
  // a pre-migration {label, value} row would take this PUBLIC page down rather
  // than look wrong. See traitText.
  const traitLabels = (traits ?? []).map(traitText).filter(Boolean);
  return (
    // cn() rather than plain interpolation so a caller's layout class (e.g.
    // justify-start) actually overrides the default instead of losing to it on
    // stylesheet order.
    <div className={cn("relative rounded-2xl bg-card/80 backdrop-blur-lg border-2 border-transparent bg-clip-padding p-6 text-center shadow-xl flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 hover:border-gradient-to-tr hover:from-indigo-400 hover:via-fuchsia-400 hover:to-cyan-400 group min-h-[260px] h-full", className)}>
      <Avatar className={cn(AVATAR_SIZES[avatarSize] ?? AVATAR_SIZES.default, "mb-4 shadow-lg ring-4 ring-indigo-200 group-hover:ring-fuchsia-300 transition-all duration-300", squareAvatar && "rounded-2xl")}>
        <AvatarImage src={avatarSrc} alt={`${name} Avatar, bio: ${bio}`} />
        <AvatarFallback className={cn(squareAvatar && "rounded-2xl")}>{fallbackInitials}</AvatarFallback>
      </Avatar>
      <h3 className="text-lg font-bold text-primary mb-1">{name}</h3>
      <p className="text-sm text-foreground mb-2">{title}</p>
      {/* Muted and a step smaller than the role above it, so a card with one
          reads as name → role → what they're up to rather than as two competing
          titles. text-balance keeps a two-line value from leaving one orphaned
          word, which is common at these widths: the grid goes to five columns
          on a large screen and this is free text up to 150 characters. */}
      {note && (
        <p className="text-xs text-muted-foreground mb-1 text-balance px-2">{note}</p>
      )}
      {/* Eboard-typed captions, rendered as pills rather than a definition
          list. `title` above is already this card's "Infrastructure Chair" line,
          and a trait is the same kind of thing, so it reads as more of those
          instead of as a table bolted under the name. Wraps and centres so a
          card with three still looks composed. */}
      {traitLabels.length > 0 && (
        <ul className="mt-1 mb-1 flex flex-wrap justify-center gap-1 px-2">
          {traitLabels.map((trait) => (
            <li
              key={trait}
              className="max-w-full truncate rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {trait}
            </li>
          ))}
        </ul>
      )}
      {/* The member's own links, below the eboard captions and above the icon
          row. Chips rather than icons because these are arbitrary destinations
          that need naming — the icon row underneath is for the fixed set
          (LinkedIn, Instagram) where the glyph IS the label. */}
      {safeLinks.length > 0 && (
        <ul className="mt-1 mb-1 flex flex-wrap justify-center gap-1.5 px-2">
          {safeLinks.map((link) => (
            <li key={`${link.label}-${link.href}`} className="max-w-full">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
                aria-label={`${link.label} (opens in a new tab)`}
              >
                <LinkIcon className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 mt-2 justify-center">
        {otherUrl && (
          <a href={otherUrl} className="text-foreground hover:text-indigo-500 transition-colors" target="_blank" rel="noopener noreferrer">
            <HomeIcon className="h-5 w-5" />
          </a>
        )}
        {instagramUrl && (
          <a href={instagramUrl} className="text-foreground hover:text-pink-500 transition-colors" target="_blank" rel="noopener noreferrer">
            <InstagramIcon className="h-5 w-5" />
          </a>
        )}
        {email && (
          <a href={'mailto:' + email} className="text-foreground hover:text-green-500 transition-colors" target="_blank" rel="noopener noreferrer">
            <MailIcon className="h-5 w-5" />
          </a>
        )}
        {linkedinUrl && (
          <a href={linkedinUrl} className="text-foreground hover:text-blue-500 transition-colors" target="_blank" rel="noopener noreferrer">
            <LinkedinIcon className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
