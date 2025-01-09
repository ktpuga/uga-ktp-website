import { Inter } from "next/font/google";
import Script from "next/script";
import React from "react";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kappa Theta Pi",
  description: "Phi Chapter at UGA. UGA First Professional Technology Fraternity.",
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
        <Script async src="https://www.googletagmanager.com/gtag/js?id=GTM-5GWFPTWX" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GTM-5GWFPTWX');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager iframe */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-5GWFPTWX"
            height="0" width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>
        {children}
      </body>
    </html>
  );
}
