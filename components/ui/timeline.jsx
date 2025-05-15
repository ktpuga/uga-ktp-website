// components/ui/timeline.jsx
import eFair from '@/public/engagementfair.jpeg'
import gameNight from '@/public/game_night.jpeg'
import infoSesh from '@/public/Info_Session.jpeg'
import alphaPC from '@/public/PCalpha.jpg'
import armWrestle from '@/public/power_dynamic.jpeg'
import AOS from 'aos'
import 'aos/dist/aos.css'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { FaCalendarAlt, FaChevronRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa'

export const AOSInit = () => {
  useEffect(() => {
    AOS.init({ easing: 'ease-in-out', duration: 300, once: false })
  }, [])
  return null
}

let teams = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/800px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png';
const events = [
  {
    id: 1,
    title: 'UGA Engagement Fair - Spring 2025',
    date: 'January 28, 2025',
    time: '7:00 PM - 10:00 PM',
    location: 'Tate Student Center',
    description: 'Come see us at the Engagement Fair! Hear from current brothers and learn about our fraternity\'s values and opportunities.',
    image: eFair,
    url: 'https://uga.campuslabs.com/engage/event/10741611'
  },
  {
    id: 2,
    title: 'KTP Information Session I',
    date: 'January 29, 2025',
    time: '6:30 PM - 7:30 PM',
    location: 'Sanford Hall, RM 309',
    description: `Learn about our professional tech frat, our values. We'll cover the rush process, membership expectations, and answer any questions you have. Explore how KTP can help you grow both personally and professionally! (Info sessions are identical)`,
    image: infoSesh
  },
  {
    id: 2.4,
    title: 'KTP Information Session II',
    date: 'January 31, 2025',
    time: '6:30 PM - 7:30 PM',
    location: 'Miller Learning Center, RM 213',
    description: `Learn about our professional tech frat, our values. We'll cover the rush process, membership expectations, and answer any questions you have. Explore how KTP can help you grow both personally and professionally! (Info sessions are identical)`,
    image: infoSesh
  },
  {
    id: 2.5,
    title: 'KTP Information Session III',
    date: 'February 1, 2025',
    time: '2:00 PM - 3:00 PM',
    location: 'Online',
    description: `Your last chance to learn about our professional tech frat, our values, and what we do. Last info session before events begin. (Info sessions share identical information)`,
    image: teams,
    url: 'https://us04web.zoom.us/j/76776366156?pwd=Y6TbFeCp7AqmV9ObOIDoDMDR4I6gSe.1'
  },
  {
    id: 3,
    title: 'Speed Dating - Meet the Brothers',
    date: 'February 4, 2025',
    time: '7:00 PM - 8:00 PM',
    location: 'Miller Learning Center RM TBA',
    description: 'Meet the brothers of Kappa Theta Pi through quick, meaningful conversations.',
    image: alphaPC
  },
  {
    id: 4,
    title: 'Game Night',
    date: 'February 5, 2025',
    time: '7:00 PM - 8:00 PM',
    location: 'Miller Learning Center RM TBA',
    description: 'Snacks, games, and good company. See you there!',
    image: gameNight
  },
  {
    id: 4.5,
    title: 'Rush Interviews',
    date: 'February 5-12, 2025',
    time: '15 Minutes',
    location: 'Boyd Graduate Research Center, RM 204',
    description: 'Rush interviews are required for all potential new members. Sign up for a time slot to meet with actives so we can get to know you better! 😊',
    image: armWrestle,
    url: 'https://www.signupgenius.com/go/10C0C44ACAB29A3FCC16-54745399-ktprush#/'
  }
]

const TimelineComponent = () => (
  <div className='min-h-screen py-12 px-4 sm:px-6 lg:px-8'>
    <AOSInit />
    <div className='mx-auto max-w-3xl'>
      <div className='relative'>
        <div className='absolute left-1/2 h-full w-0.5 -translate-x-1/2 transform bg-border' />
        {events.map((event, index) => (
          <div key={event.id} data-aos='fade-up' className={`mb-8 flex ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className='w-1/2' />
            <div className='relative flex items-center justify-center'>
              <div className='absolute h-4 w-4 transform rounded-full bg-pink-500 transition-all duration-300 hover:scale-150' />
            </div>
            <div className={`w-1/2 ${index % 2 === 0 ? 'pl-6' : 'pr-6'}`}>
              <div className='rounded-lg bg-card p-6 shadow-xs transition-shadow duration-300 hover:shadow-lg'>
                {event.image && (
                  <Image
                    src={event.image}
                    alt={event.title}
                    width="100"
                    height="100"
                    unoptimized
                    className='mb-4 h-48 w-full rounded-md object-cover object-top'
                  />
                )}
                <h3 className='mb-2 text-lg font-heading text-foreground'>{event.title}</h3>
                <div className='mb-2 flex items-center text-accent'>
                  <FaCalendarAlt className='mr-2' />
                  <span className='text-sm'>{Array.isArray(event.date) ? event.date.join(', ') : event.date}</span>
                </div>
                <div className='mb-2 flex items-center text-accent'>
                  <FaClock className='mr-2' />
                  <span className='text-sm'>{event.time}</span>
                </div>
                <div className='mb-4 flex items-center text-accent'>
                  <FaMapMarkerAlt className='mr-2' />
                  <span className='text-sm'>{event.location}</span>
                </div>
                <p className='mb-2 text-accent text-body'>{event.description}</p>
                {event.url && (
                  <Link href={event.url} target='_blank' className='flex items-center text-pink-500 transition-colors duration-300 hover:text-ring'>
                    Learn More <FaChevronRight className='ml-2' />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default TimelineComponent
