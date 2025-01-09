import { Inter } from "next/font/google";
import Script from 'next/script';
import PropTypes from 'prop-types';
import React from 'react';
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Kappa Theta Pi",
  description: "Phi Chapter at UGA. UGA First Professional Technology Fraternity.",
};
function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=GTM-5GWFPTWX"/>
        <Script id='google-analytics' strategy="afterInteractive">
         {`
         <!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5GWFPTWX');</script>
<!-- End Google Tag Manager -->
         `}

        </Script>
      <body className={inter.className}>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5GWFPTWX"
height="0" width="0" style={{display:'none', visibility:'hidden'}}></iframe></noscript>
{children}
</body>
      </head>
      
    </html>
)}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default RootLayout;
