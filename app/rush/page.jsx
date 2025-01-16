'use client'
import Link from "next/link"
import React from 'react'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import Footer from '../../components/ui/footer'
import Timeline from '../../components/ui/timeline'

const responsive = {
  superLargeDesktop: {
    breakpoint: { max: 4000, min: 1024 },
    items: 3
  },
  desktop: {
    breakpoint: { max: 1024, min: 768 },
    items: 2
  },
  tablet: {
    breakpoint: { max: 768, min: 464 },
    items: 1
  },
  mobile: {
    breakpoint: { max: 464, min: 0 },
    items: 1
  }
};
  const resources = [
    {
      title: "UGA CC - Online Resources",
      url: "https://career.uga.edu/online_resources"
    },
    {
      title: "Resume Cover Letter Templates",
      url: "https://career.uga.edu/students#resumes_cover_letters"
    },
    {
      title: "Interviewing Resources",
      url: "https://career.uga.edu/students#interviewing"
    },
    {
      title: "WU - Interviews Do and Donts",
      url: "https://www.wayup.com/guide/6-dos-and-donts-of-video-interviews/"
    },
    {
      title: "WU - 7 First-Round Interview Tips",
      url: "https://www.wayup.com/guide/first-round-interview-tips-will-land-second-interview/"
    },
    {
      title: "WU - Ultimate Guide to Follow Ups",
      url: "https://www.wayup.com/guide/the-ultimate-guide-to-following-up/"
    },
    {
      title: "UGA CC - Email Signature Builder",
      url: 'https://brand.uga.edu/email-signature-builder/'
    }
  ];

  // Responsive settings for react-multi-carousel
export default function Page() {
    return (
        (
        <div className="flex flex-col min-h-screen font-sans bg-black text-gray-900 scroll-smooth ">
            <header className="sticky top-0 px-4 lg:px-6 h-16 flex items-center border-b border-gray-200 bg-white/[.3] backdrop-blur z-50">
              <Link className="flex items-center justify-center" href="/">
                <span className="font-bold text-2xl text-pink-500">ΚΘΠ</span>
            
                  <span className="ml-2 font-semibold text-lg">Phi Chapter at UGA</span>
            
              
              </Link>
              <nav className="ml-auto flex gap-4 sm:gap-6">
              <Link className="text-sm font-medium hover:text-pink-500 transition-colors"
            href="/">
                  Home
                </Link>
                </nav>
                </header>
                <main className="flex-1">
        {/* RESOURCES SECTION */}
        <section id="resources" className="bg-[#1A1A1A] py-6 md:py-10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="container mx-auto text-center gap-6 md:gap-10">
              <div className="space-y-4 animate-fade-in-left">
                <h2
                  className="text-3xl font-bold tracking-tighter md:text-4xl font-['Source Sans Pro'] text-pink-500"
                >
  ΚΘΠ <span className="p-2 font-gameOfSquids">Prep Resources:</span>
</h2>
<Carousel 
        responsive={responsive} 
        infinite={true} 
        autoPlay={true} 
        autoPlaySpeed={3000}
        arrows={false}
        showDots={true}
        containerClass="carousel-container"
        itemClass="carousel-item"
        removeArrowOnDeviceType={["tablet", "mobile"]}
      >
        {resources.map((resource, index) => (
          <div key={index}    className="p-6 border border-pink-500 rounded-lg shadow-lg bg-[#2A2A2A] mx-4">
            <div className="list-disc ml-6 hover:animate-pulse">
              <div className="text-[#FFF] md:text-xl font-['Source Sans Pro']">
                <Link className="text-pink-400 underline" href={resource.url} target="_blank" rel="noopener noreferrer">
                  {resource.title}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
                    </div>

                  </div>
                </div>
              </section>
            <section className="bg-[#2B2B2B] mx-auto py-12 md:py-20 flex flex-col items-center justify-center">
  <div className="container mx-auto px-4 md:px-6">
    <div className="gap-6 md:gap-10 text-center">
      <div className="space-y-4">
        
        <h1 className="text-3xl font-bold text-[#249f9c] tracking-tighter md:text-4xl lg:text-5xl font-gameOfSquids">
          Spring 2025 Rush
        </h1>
        <p className="animate-pulse text-[#6B6B6B] md:text-xl font-gameOfSquids ">
          Rush Theme: <span className="text-pink-500">Squid Games</span>
        </p>
        <Timeline/>
    
        {/* <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
          Our first week consists of 2 information sessions to tell you more about our mission. You only have to attend 1 of these; they will have the same information!
        </p> */}
        {/* <Image src={rushImg} unoptimized className="mx-auto w-1/2" /> */}
        <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
         
        </div>
      </div>
      <div className="flex items-center justify-center">
       
      </div>
    </div>
  </div>
</section>


            
             
            </main>
           <Footer/>
          </div>)
        );
        
    
    
  }
