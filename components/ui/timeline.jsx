import AOS from "aos";
import "aos/dist/aos.css";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { FaCalendarAlt, FaChevronRight, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import eFair from "../../public/engagementfair.jpeg";
import gameNight from "../../public/game_night.jpeg";
import infoSesh from "../../public/Info_Session.jpeg";
import alphaPC from "../../public/PCalpha.jpg";
import armWrestle from "../../public/power_dynamic.jpeg";
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
      title: "KTP Information Session I",
      date: "January 29, 2025",
      time: "6:30 PM - 7:30 PM",
      location: "Sanford Hall, RM 309",
      description: `Learn about our professional tech frat, our values. We'll cover the rush process, membership expectations, and answer any questions you have. Explore how KTP can help you grow both personally and professionally! (Info sessions are identical)`,
      image: infoSesh,
      url: undefined,
    },
    {
      id: 2.4,
      title: "KTP Information Session II",
      date: ["January 31, 2025"
      ],
      time: "6:30 PM - 7:30 PM",
      location: "Miller Learning Center, RM 213",
      description: `Learn about our professional tech frat, our values. We'll cover the rush process, membership expectations, and answer any questions you have. Explore how KTP can help you grow both personally and professionally! (Info sessions are identical)`,
      image: infoSesh,
      url: undefined,
    },
    {
      id: 2.5,
      title: "KTP Information Session III",
      date: "February 1, 2025",
      time: "2:00 PM - 3:00 PM",
      location: "Online",
      description: `Your last chance to learn about our professional tech frat, our values, and what we do. Last info session before events begin. (Info sessions share identical information)`,
      image: "",
      url: undefined,
    },
    {
      id: 3,
      title: "Speed Dating - Meet the Brothers",
      date: "February 4, 2025",
      time: "7:00 PM - 8:00 PM",
      location: "Miller Learning Center RM TBA",
      description: "Meet the brothers of Kappa Theta Pi through quick, meaningful conversations. Explore our values, experiences, and professional opportunities while expanding your network and discovering what makes our brotherhood unique!",
      image: alphaPC,
      url: undefined,
    },
    {
      id: 4,
      title: "Game Night",
      date: "February 5, 2025",
      time: "7:00 PM - 8:00 PM",
      location: "Miller Learning Center RM TBA",
      description: "Snacks, games, and good company. See you there!",
      image: gameNight,
      url: "",
    },
    {
      id: 4.5,
      title: "Rush Interviews",
      date: "February 5-12, 2025",
      time: "15 Minutes",
      location: "In-Person",
      description: "Rush interviews are required for all potential new members. Sign up for a time slot to meet with actives so we can get to know you better! 😊",
      image: armWrestle,
      url: "",
    },
    // {
    //     id: 5,
    //     title: "Bid Day Celebration",
    //     date: "TBD",
    //     time: "TBD",
    //     location: "TBA",
    //     description: "The culmination of Rush Week! Join us for the formal bid ceremony and celebration with new members. 🥷",
    //     image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
    //     url: "",
    //   }
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
             <div className="absolute w-4 h-4 bg-pink-500 rounded-full transform transition-all duration-3000 hover:scale-2"></div>
              </div>

              {/* Event content */}
              <div className={`w-1/2 ${index % 2 === 0 ? "pl-6" : "pr-6"}` }>
                <div className="bg-card p-6 rounded-lg shadow-xs hover:shadow-lg transition-shadow duration-300">
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
                    <span className="text-sm"> {Array.isArray(event.date) ? event.date.join(", ") : event.date}</span>
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
                    <Link href={event.url ? event.url : "" } target={event.url ? '_blank' : ''} className="flex items-center text-pink-500 hover:text-ring transition-colors duration-300">
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