'use client';


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Users, Video } from 'lucide-react';

export default function AlumniEvents() {
  const upcomingEvents = [
    {
      id: 1,
      title: 'Alumni Networking Happy Hour',
      date: '2026-03-15',
      time: '6:00 PM - 9:00 PM',
      location: 'The Georgian Hotel, Athens',
      type: 'In-Person',
      category: 'Networking',
      attendees: 45,
      description: 'Join fellow KTP alumni for an evening of networking and reconnecting over drinks and appetizers.',
      virtual: false,
    },
    {
      id: 2,
      title: 'Virtual Career Panel: Tech Leadership',
      date: '2026-03-22',
      time: '7:00 PM - 8:30 PM',
      location: 'Zoom',
      type: 'Virtual',
      category: 'Professional',
      attendees: 78,
      description: 'Hear from KTP alumni who have advanced to leadership positions in tech companies.',
      virtual: true,
    },
    {
      id: 3,
      title: 'Atlanta Alumni Meetup',
      date: '2026-04-05',
      time: '12:00 PM - 2:00 PM',
      location: 'Ponce City Market, Atlanta',
      type: 'In-Person',
      category: 'Social',
      attendees: 32,
      description: 'Casual lunch meetup for KTP alumni living in the Atlanta area.',
      virtual: false,
    },
    {
      id: 4,
      title: 'Mentorship Program Kickoff',
      date: '2026-04-12',
      time: '5:00 PM - 6:30 PM',
      location: 'Hybrid (In-person & Virtual)',
      type: 'Hybrid',
      category: 'Mentorship',
      attendees: 56,
      description: 'Launch event for our new alumni-to-student mentorship program.',
      virtual: true,
    },
    {
      id: 5,
      title: 'Annual Alumni Reunion',
      date: '2026-05-10',
      time: '2:00 PM - 8:00 PM',
      location: 'Sanford Stadium Grounds, Athens',
      type: 'In-Person',
      category: 'Reunion',
      attendees: 156,
      description: 'Our biggest event of the year! Reconnect with brothers from all generations of KTP Georgia.',
      virtual: false,
    },
  ];

  const pastEvents = [
    {
      id: 1,
      title: 'Winter Alumni Dinner',
      date: '2026-02-14',
      attendees: 68,
      category: 'Social',
    },
    {
      id: 2,
      title: 'Resume Review Session',
      date: '2026-01-25',
      attendees: 42,
      category: 'Professional',
    },
    {
      id: 3,
      title: 'Virtual Coffee Chat',
      date: '2026-01-18',
      attendees: 31,
      category: 'Networking',
    },
  ];

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'In-Person': 'bg-green-100 text-green-800',
      Virtual: 'bg-blue-100 text-blue-800',
      Hybrid: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Networking: 'bg-amber-100 text-amber-800',
      Professional: 'bg-indigo-100 text-indigo-800',
      Social: 'bg-pink-100 text-pink-800',
      Mentorship: 'bg-teal-100 text-teal-800',
      Reunion: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alumni Events</h1>
        <p className="text-gray-600">Stay connected with upcoming alumni activities and events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming Events</CardDescription>
            <CardTitle className="text-2xl">5</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">3</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total RSVPs</CardDescription>
            <CardTitle className="text-2xl">367</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Past Events</CardDescription>
            <CardTitle className="text-2xl">48</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                      <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>
                    </div>
                    <CardDescription>{event.description}</CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button className="bg-red-800 hover:bg-red-900">RSVP</Button>
                    {event.virtual && (
                      <Button variant="outline">
                        <Video className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{event.attendees} attending</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm mt-3 pt-3 border-t border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{event.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-3">
          {pastEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {event.attendees} attended
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Photos
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <Card className="bg-gradient-to-br from-red-50 to-amber-50 border-red-200">
        <CardContent className="pt-6">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Want to Host an Event?</h3>
            <p className="text-gray-600 mb-4">
              We're always looking for alumni to organize regional meetups or virtual events.
              Share your ideas with the alumni relations team!
            </p>
            <Button className="bg-red-800 hover:bg-red-900">Contact Alumni Relations</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
