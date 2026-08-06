import { Inter } from "next/font/google";
import Script from "next/script";
import React from "react";
import "./globals.css";
import SessionProviderWrapper from "@/components/auth/SessionProviderWrapper";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "@/lib/seo";
const inter = Inter({ subsets: ["latin"] });

const HOME_TITLE = "Kappa Theta Pi | Professional Technology Fraternity at UGA";
const HOME_DESCRIPTION =
  "Phi Chapter at the University of Georgia. Kappa Theta Pi is UGA's first professional technology fraternity, building a community for students in tech through workshops, tech talks and networking.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: './' },
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: HOME_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Use a proper link tag for Google Fonts to avoid hydration issues */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap" 
        />
        
        {/* Correct usage of Google Tag Manager Script */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-KGXQMB8G');`}
        </Script>
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KGXQMB8G"
            height="0" width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        <SessionProviderWrapper>
          <ConfirmProvider>{children}</ConfirmProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
