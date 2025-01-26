'use client'
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useState } from 'react'
import Carousel from 'react-multi-carousel'
import Card from '../components/ui/card'
import Footer from '../components/ui/footer'
import main from '../public/glitchKTP.gif'
import pcAlpha from '../public/PCalpha.jpg'
import pfp from '../public/whiteKTPpfp.jpg'; // deprecated for now 
import { AOSInit } from "./ui/timeline"
function importAll(r) {
  let images = {};
   r.keys().forEach((item) => { images[item.replace('./', '')] = r(item); });
  return images
 }

export default function TemplatePage() {
  const images = importAll(require.context('../public/leadership/', false, /\.(png|jpe?g|svg)$/));
  // const router = useRouter();

  // const rushPageClick = () => {
  //   router.push('/rush');
  // };
  const [mobile, setMobile] = useState(false);
   useEffect(() => {
     // Update the mobile state based on window width
     const updateMobile = () => setMobile(window.innerWidth < 599);
 
     // Call once to set initial state based on current window width
     updateMobile();
 
     // Setup event listener for resizing the window
     window.addEventListener('resize', updateMobile);
 
     // Cleanup the event listener when the component unmounts
     return () => window.removeEventListener('resize', updateMobile);
   }, []);

  
  return (
    (<div className="flex flex-col min-h-screen font-sans bg-white text-gray-900 scroll-smooth">
      <AOSInit/>

      <header className="sticky top-0 px-4 lg:px-6 h-16 flex items-center border-b border-gray-200 bg-white/[.3] backdrop-blur-sm z-50">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold text-2xl text-blue-600">ΚΘΠ</span>
          {!mobile &&
            <span className="ml-2 font-semibold text-lg">Phi Chapter at UGA</span>
          }
        
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
        <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulsetransition-colors" href="/rush">
            Rush
          </Link>
          {!mobile &&
            <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="#about">
            About
          </Link>
          }
          
          
          <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="#leadership">
            Leadership
          </Link>
          <Link className="text-sm font-medium hover:text-black-900 hover:animate-pulse transition-colors" href="/hackathon">
            Hackathon
          </Link>
          <Link className="text-sm font-medium hover:text-blue-600 hover:animate-pulse transition-colors" href="#contact">
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="bg-[#F0F0F0] py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-2 md:gap-10"  data-aos='flip-up' data-aos-duration='300'>
              <div className="space-y-4 ">
                <h1
                  className="hover:animate-bounce text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl font-['Source Sans Pro']">
                  ΚΘΠ
                </h1>
                <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                  The first and only Professional Technology fraternity at the University of Georgia, dedicated to empowering
                  students through leadership, networking, and friendships.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/rush">
                  <Button
    className="hover:animate-pulse bg-[#052039] hover:bg-[#2463EB] font-['Source Sans Pro'] text-white"
  >
    Spring Rush 2025
  </Button>
                  </Link>
                  {/* <Link
                    href="https://uga.campuslabs.com/engage/organization/ktp"
                    target="_Blank"
                    className="hover:animate-pulse hover:bg-[#2463EB] inline-flex items-center justify-center rounded-md border border-input bg-[#F0F0F0] px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-[#fff] hover:text-[#333333] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-['Source Sans Pro']"
                    prefetch={false}>
                    Involvement Network
                  </Link> */}
                </div>
              </div>
              <div className="flex items-center space-x-4 justify-center">
                {/* TODO: Fix this make it look pretty! */}
              {/* <Carousel 
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
          <div key={index} className="p-6 border rounded-lg shadow-lg bg-white mx-4">
            <div className="list-disc ml-6 hover:animate-pulse">
              <div className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                <Link className="text-blue-500" href={resource.url} target="_blank" rel="noopener noreferrer">
                  {resource.title}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </Carousel> */}
                {/* <Image
                unoptimized
                  src={pfp.src}
                  width="200"
                  height="200"
                  alt="ΚΘΠ"
                  className="rounded-xl"
                  style={{objectFit: "cover" }} /> */}
                  <Image
                unoptimized
                  src={pcAlpha.src}
                  width="400"
                  height="200"
                  alt="ΚΘΠ Pledge Class Alpha"
                  className="rounded-xl"
                  style={{objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="bg-[#E0E0E0] py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6 " data-aos='fade-up' data-aos-duration='400'>
            <div className="grid gap-6 md:grid-cols-2 md:gap-10">
              <div className="flex items-center justify-center">
                <Image
                unoptimized
                  src={main}
                  width="400"
                  height="400"
                  alt="About ΚΘΠ"
                  className="rounded-xl"
                  style={{  objectFit: "cover" }} />
              </div>
              <div className="space-y-4 animate-fade-in-left">
                <h2
                  className="text-3xl font-bold tracking-tighter md:text-4xl font-['Source Sans Pro']">About ΚΘΠ Phi Chapter</h2>
                <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
KTP focuses on
developing technical skills and professionalism while fostering strong friendships and networking. KTP at UGA is an exclusive organization chaptered to build a lasting legacy on-campus and around the globe 🌎
                </p>
                <p className="text-[#6B6B6B] md:text-l font-['Source Sans Pro']">
                  The <Link className=" text-blue-500" href="https://ktpmichigan.com" target="_blank">Alpha chapter</Link> was founded on January 10th, 2012 at the University of Michigan!
                </p>
              </div>
            </div>
          </div>
        </section>
        <section id="values" className="bg-[#F0F0F0] py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-6 text-center" data-aos='fade-up' data-aos-duration='500'>
              <h2
                className="text-3xl font-bold tracking-tighter md:text-4xl font-['Source Sans Pro']">Our Values</h2>
              <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                At the heart of ΚΘΠ are the values that guide our organization and shape our members.
              </p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-lg bg-[#E0E0E0] p-6 text-left shadow-xs" data-aos='fade-left' data-aos-duration='600'>
                  <h3 className="text-xl font-bold font-['Source Sans Pro']">Leadership</h3>
                  <p className="text-[#6B6B6B] font-['Source Sans Pro']">
                    We empower our members to take on leadership roles and develop their skills to make a positive
                    impact. Members have the opprotunity to join Comittee&apos;s and/or be involved in the Executive Board! 
                  </p>
                </div>
                <div className="rounded-lg bg-[#E0E0E0] p-6 text-left shadow-xs"data-aos='fade-up' data-aos-duration='600'>
                  <h3 className="text-xl font-bold font-['Source Sans Pro']">Professionalism</h3>
                  <p className="text-[#6B6B6B] font-['Source Sans Pro']">
                  Through events like interview training, resume building, one-on-one mentorship, and more, Kappa Theta Pi Professional Development aims to prepare members for success in any technology-related career. We take pride in developing the tech leaders of the future.
                  </p>
                </div>
                <div className="rounded-lg bg-[#E0E0E0] p-6 text-left shadow-xs" data-aos='fade-right' data-aos-duration='600'>
                  <h3 className="text-xl font-bold font-['Source Sans Pro']">Community</h3>
                  <p className="text-[#6B6B6B] font-['Source Sans Pro']">
                  The people you meet in Kappa Theta Pi will go on to be some of your closest friends throughout college and beyond. We host a variety of exclusive social events throughout the semester through which our members can bond.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="leadership" className="bg-[#E0E0E0] py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-6 text-center" data-aos='fade-up' data-aos-duration='600'>
              <h2
                className="text-3xl font-bold tracking-tighter md:text-4xl font-['Source Sans Pro']">
                Meet the Exec Board
              </h2>
              <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                Our dedicated executive board members are the driving force behind ΚΘΠ.
              </p>
              <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <Card
                name="Ryan Majd"
                title="President"
                bio="Ryan is a junior Computer Science major and Mathematics minor at UGA. He enjoys playing basketball, going to the gym and working on his Company."
                avatarSrc="https://media.licdn.com/dms/image/v2/D4E03AQHm2u_lAtKk8w/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1730818562764?e=1739404800&v=beta&t=o8kwyCJapNhv4VfVvgl7A4O4-TV2UfHD3GyvVMdVyWA" 
                fallbackInitials="RM"
                instagramUrl="https://www.instagram.com/TheRyanMajd"
                linkedinUrl="https://www.linkedin.com/in/ryan-majd/"
                otherUrl='https://theryanmajd.github.io/my-website/'
                />
                <Card
                name="Alli Gay"
                title="VP of Marketing"
                bio="Alli is a Data Science major at UGA. She is also involved in UGA’s Club Cross Country/Track team and Delta Zeta Sorority. She loves to run, be outside, paint, and listen to music."
                avatarSrc={images['alli.jpeg'].default.src}
                fallbackInitials="AG"
                instagramUrl="https://www.instagram.com/allisonngayy/"
                linkedinUrl="https://www.linkedin.com/in/allison-gay-8956a7296/"
                />
                <Card
                name="Daniel Rifai"
                title="VP of Finance"
                bio="Daniel Rifai is a third year Computer Science and Finance major. He enjoys the outdoors, sports, film, and card games."
                avatarSrc={images['danny.jpg'].default.src}
                fallbackInitials="DR"
                instagramUrl="https://www.instagram.com/dannyr_04/"
                linkedinUrl="https://www.linkedin.com/in/daniel-rifai-19226a292/"
                />
                <Card
                name="Ajeetha Murugappan"
                title="VP of Marketing"
                bio="Ajeetha is a sophomore Computer Science major and Business minor. She enjoys golfing, going to concerts, and long walks!"
                avatarSrc={images['ajeetha.jpeg'].default.src}
                fallbackInitials="AM"
                instagramUrl="https://www.instagram.com/ajeetha.05/"
                linkedinUrl="https://www.linkedin.com/in/ajeetha-murugappan-43b6a01b5/"
                />
                <Card
                name="Hayden Crane"
                title="VP of Internal Affairs"
                bio="Hayden oversees internal operations and ensures smooth communication among members. A third-year computer science major, Hayden is passionate about technology, leadership, and fostering a supportive KTP community."
                avatarSrc={images['hayden.jpeg'].default.src}
                fallbackInitials="HC"
                instagramUrl="https://www.instagram.com/haydencranee/"
                linkedinUrl="https://www.linkedin.com/in/hayden-crane-compsci/"
                />
                <Card
                name="Siya Sharma"
                title="VP of Engagement"
                bio="empty"
                avatarSrc={images['siya.jpeg'].default.src}
                fallbackInitials="SS"
                instagramUrl="https://www.instagram.com/siyasharma.03/"
                linkedinUrl="https://www.linkedin.com/in/siya-sharma-ss2025/"
                />

                <Card
                name="Stephen Sulimani"
                title="VP of External Affairs"
                bio="Stephen is a senior Computer Science major from New York City. He is interested in FinTech and enjoys playing tennis and working on personal hobby projects."
                avatarSrc={images['stephen.jpeg'].default.src}
                fallbackInitials="SS"
                instagramUrl="https://www.instagram.com/stephensulimani/"
                linkedinUrl="https://www.linkedin.com/in/stephensulimani/"
                />

                <Card
                name="Manya Vikram"
                title="VP of Professional Development"
                bio="empty"
                avatarSrc={images['manya.jpeg'].default.src}
                fallbackInitials="MV"
                instagramUrl="https://www.instagram.com/manya.vv/"
                linkedinUrl="https://www.linkedin.com/in/manya-vikram-bb0652220/"
                />

                <Card
                name="Ethan Ogle"
                title="VP of Technical Development"
                bio="Junior at the University of Georgia pursuing degrees in Computer Science and Applied Mathematics, currently serving as a Cloud SWE Intern at Altagrove, Co-President of ACM, and Technical Organizer for UGAHacks."
                avatarSrc={images['ethan.jpeg'].default.src}
                fallbackInitials="EO"
                instagramUrl="https://www.instagram.com/etho_ogle/"
                linkedinUrl="https://www.linkedin.com/in/ethan-ogle/"
                />

                <Card
                name="Jiya Patel"
                title="VP of Membership"
                bio="Jiya Patel is a recent graduate with a degree in computer science from UGA and is currently doing a master's in Cybersecurity. She is involved in UGAHacks and GDG. In her free time she enjoys painting, shopping, working out and watching Netflix."
                avatarSrc={images['jiya.jpeg'].default.src}
                fallbackInitials="JP"
                instagramUrl="https://www.instagram.com/jiyanpatel31/"
                linkedinUrl="https://www.linkedin.com/in/jiya-patel-422615228/"
                />

                <Card
                name="Khushi Bhatamrekar"
                title="VP of Membership"
                bio="Khushi Bhatamrekar is a senior studying Computer Science and Cognitive Science at UGA. She is a part of UGAHacks, GDG and enjoys dancing, running, and spending time with her friends"
                avatarSrc={images['khushi.jpeg'].default.src}
                fallbackInitials="KB"
                instagramUrl="https://www.instagram.com/khuxhix/"
                linkedinUrl="https://www.linkedin.com/in/khushibhat/"
                />

                <Card
                name="Gargee Jamadagni"
                title="VP of Operations"
                bio="empty"
                avatarSrc={images['gargee.jpeg'].default.src}
                fallbackInitials="GJ"
                instagramUrl="https://www.instagram.com/gargee.jam/"
                linkedinUrl="https://www.linkedin.com/in/gargeejamadagni/"
                />
                
              </div>
            </div>
          </div>
        </section>
        <section id="contact" className="bg-[#F0F0F0] py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6" data-aos="flip-up" data-aos-duration="300"> 
            <div className="space-y-6 text-center">
              <h2
                className="text-3xl font-bold tracking-tighter md:text-4xl font-['Source Sans Pro']">Contact</h2>
              <p className="text-[#6B6B6B] md:text-xl font-['Source Sans Pro']">
                Join us for our upcoming Spring Rush and become a part of the KTPhamily.
              </p>
              
              <div className=" container mx-auto flex justify-center text-center items-center space-x-2">
              <Link href="https://www.instagram.com/ugaktp/" className="text-lg font-large hover:text-blue-600 hover:animate-pulse transition-colors" prefetch={false} target="_Blank">
                      <InstagramIcon className="h-6 w-6" />
                    </Link>
                    <Link href="https://www.linkedin.com/company/kappa-theta-pi-uga/" target="_blank" className="text-lg font-large hover:text-blue-600 hover:animate-pulse transition-colors" prefetch={false}>
                      <LinkedinIcon className="h-6 w-6" />
                    </Link>
                    <Link className="text-lg font-large hover:text-blue-600 hover:animate-pulse transition-colors" href="https://groupme.com/join_group/105354211/NUNp5nWk" target="_blank">
                <GroupIcon className="h-6 w-6" />
              </Link>
              <Link className="text-lg font-large hover:text-blue-600 hover:animate-pulse transition-colors" href="mailto:uga.ktp@gmail.com;ryan.majd@uga.edu">
              <MailIcon className="h-6 w-6" />
              </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </div>)
  );
}


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

function GroupIcon(props) {
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
      <path d="M3 7V5c0-1.1.9-2 2-2h2" />
      <path d="M17 3h2c1.1 0 2 .9 2 2v2" />
      <path d="M21 17v2c0 1.1-.9 2-2 2h-2" />
      <path d="M7 21H5c-1.1 0-2-.9-2-2v-2" />
      <rect width="7" height="5" x="7" y="7" rx="1" />
      <rect width="7" height="5" x="10" y="12" rx="1" />
    </svg>
  )
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
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
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
