import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfileCard({
  name,
  title,
  bio,
  avatarSrc,
  fallbackInitials,
  instagramUrl,
  linkedinUrl,
  otherUrl,
  email,
  className,
}) {
  const avatarAlt = bio ? `${name} avatar, bio: ${bio}` : `${name} avatar`;

  return (
    <div
      className={`relative flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-transparent bg-card/80 bg-clip-padding p-6 text-center shadow-xl backdrop-blur-lg transition-transform duration-300 hover:scale-105 group ${className ?? ""}`}
    >
      <Avatar className="mb-4 h-20 w-20 shadow-lg ring-4 ring-indigo-200 transition-all duration-300 group-hover:ring-fuchsia-300">
        <AvatarImage src={avatarSrc} alt={avatarAlt} />
        <AvatarFallback>{fallbackInitials}</AvatarFallback>
      </Avatar>

      <h3 className="mb-1 text-lg font-bold text-primary">{name}</h3>
      <p className="mb-2 text-sm text-foreground">{title}</p>

      <div className="mt-2 flex justify-center gap-2">
        {otherUrl && (
          <a
            href={otherUrl}
            className="text-foreground transition-colors hover:text-indigo-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HomeIcon className="h-5 w-5" />
          </a>
        )}
        {instagramUrl && (
          <a
            href={instagramUrl}
            className="text-foreground transition-colors hover:text-pink-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="text-foreground transition-colors hover:text-green-500"
          >
            <MailIcon className="h-5 w-5" />
          </a>
        )}
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            className="text-foreground transition-colors hover:text-blue-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkedinIcon className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  );
}
