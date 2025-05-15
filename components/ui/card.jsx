import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React from 'react';

const Card = ({ name, title, bio, avatarSrc, fallbackInitials, instagramUrl, linkedinUrl, otherUrl }) => {
  return (
    <div className="rounded-lg bg-gradient-to-br from-[#c8e6ff] to-[#c7f8d4] p-4 text-center shadow-xs w-45 h-45 flex flex-col items-center justify-center">
      <Avatar className="w-20 h-20 mb-2">                     
        {/* embedded bio for SEO purposes */}
        <AvatarImage src={avatarSrc} alt={`${name} Avatar, bio: ${bio}`} /> 
        <AvatarFallback>{fallbackInitials}</AvatarFallback>
      </Avatar>
      <h3 className="text-md font-bold font-['Source Sans Pro']">{name}</h3>
      <p className="text-[#6B6B6B] text-sm font-['Source Sans Pro']">{title}</p>
      <div className="flex gap-2 mt-2">
        {otherUrl && 
          <a href={otherUrl} className="text-[#6B6B6B] hover:text-[#0000F0]" target="_blank" rel="noopener noreferrer">
            <HomeIcon className="h-5 w-5" />
          </a>
        }
        <a href={instagramUrl} className="text-[#6B6B6B] hover:text-[#0000F0]" target="_blank" rel="noopener noreferrer">
          <InstagramIcon className="h-5 w-5" />
        </a>
        <a href={linkedinUrl} className="text-[#6B6B6B] hover:text-[#0000F0]" target="_blank" rel="noopener noreferrer">
          <LinkedinIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
};
function InstagramIcon(props) {
    return (
      (<svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>)
    );
  }
function LinkedinIcon(props) {
    return (
      (<svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path
          d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>)
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
    )
  }
  

export default Card;