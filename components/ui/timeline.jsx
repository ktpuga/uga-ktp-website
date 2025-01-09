import AOS from "aos";
import "aos/dist/aos.css";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { FaCalendarAlt, FaChevronRight, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import eFair from "../../public/engagementfair.jpeg";
import alphaPC from "../../public/PCalpha.jpg";

export const AOSInit = () => {
    useEffect(() => {
      AOS.init({
        easing: "ease-in-out",
        duration: 300,
        once: false,
      });
    }, []);
  
    return null;
  };

const TimelineComponent = () => {
  const events = [
    {
      id: 1,
      title: "UGA Engagement Fair - Spring 2025",
      date: "January 28, 2025",
      time: "7:00 PM - 10:00 PM",
      location: "Tate Student Center",
      description: "Come see us at the Engagement Fair! Hear from current brothers and learn about our fraternity's values and opportunities.",
      image: eFair,
      url: "https://uga.campuslabs.com/engage/event/10741611",
    },
    {
      id: 2,
      title: "KTP Information Sessions",
      date: "TBD",
      time: "TBD",
      location: "TBA",
      description: `Learn about our professional tech frat, our values. We'll cover the rush process, membership expectations, and answer any questions you have. Explore how KTP can help you grow both personally and professionally.`,
      image: "",
      url: undefined,
    },
    {
      id: 3,
      title: "Speed Dating - Meet the Brothers",
      date: "TBD",
      time: "TBD",
      location: "TBA",
      description: "",
      image: alphaPC,
      url: undefined,
    },
    {
      id: 4,
      title: "Rush Interviews",
      date: "TBD",
      time: "TBD",
      location: "TBA",
      description: "",
      image: "",
      url: "",
    },
    {
        id: 5,
        title: "Bid Day Celebration",
        date: "TBD",
        time: "TBD",
        location: "TBA",
        description: "The culmination of Rush Week! Join us for the formal bid ceremony and celebration with new members. 🥷",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
        url: "",
      }
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
         <AOSInit />
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border"></div>
          {events.map((event, index) => (
            <div key={event.id} data-aos="fade-up" className={`mb-8 flex ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
              <div className="w-1/2" />          
              {/* Timeline dot */}
              <div 
                className="relative flex items-center justify-center"
                data-aos="slide-down"
              >
             <div className="absolute w-4 h-4 bg-primary rounded-full transform transition-all duration-3000 hover:scale-[2] hover:bg-ring"></div>
              </div>

              {/* Event content */}
              <div className={`w-1/2 ${index % 2 === 0 ? "pl-6" : "pr-6"}` }>
                <div className="bg-card p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <Image 
                  unoptimized
                    src={event.image} 
                    alt={event.title}
                    width="100"
                    height="100"
                    className="w-full h-48 object-cover object-top rounded-md mb-4"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
                    }}
                  />
                  <h3 className="text-lg font-heading text-foreground mb-2">{event.title}</h3>
                  
                  <div className="flex items-center text-accent mb-2">
                    <FaCalendarAlt className="mr-2" />
                    <span className="text-sm">{event.date}</span>
                  </div>
                  
                  <div className="flex items-center text-accent mb-2">
                    <FaClock className="mr-2" />
                    <span className="text-sm">{event.time}</span>
                  </div>
                  
                  <div className="flex items-center text-accent mb-4">
                    <FaMapMarkerAlt className="mr-2" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                  
                  <p className="text-body text-accent mb-2">{event.description}</p>
                  
                  {event.url && (
                    <Link href={event.url ? event.url : "" } target={event.url ? '_blank' : ''} className="flex items-center text-primary hover:text-ring transition-colors duration-300">
                    Learn More
                    <FaChevronRight className="ml-2" />
                  </Link> 
                  )}
                        
                  
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineComponent;