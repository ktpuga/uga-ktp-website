npm"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react";

const events = [
  {
    id: 1,
    title: "General Body Meeting",
    date: "2026-03-03",
    time: "7:00 PM - 8:30 PM",
    location: "Tate Student Center, Room 301",
    type: "Meeting",
    category: "chapter",
    attendees: 45,
    description:
      "Monthly general body meeting to discuss chapter updates and upcoming events.",
  },
  {
    id: 2,
    title: "Tech Talk: AI in Production",
    date: "2026-03-07",
    time: "6:30 PM - 8:00 PM",
    location: "Boyd Graduate Studies Research Center",
    type: "Workshop",
    category: "professional",
    attendees: 32,
    description:
      "Guest speaker from Google discussing real-world AI implementation.",
  },
  {
    id: 3,
    title: "Social: Game Night",
    date: "2026-03-10",
    time: "8:00 PM - 11:00 PM",
    location: "Member's Apartment",
    type: "Social",
    category: "social",
    attendees: 28,
    description: "Casual game night with board games, video games, and snacks.",
  },
  {
    id: 4,
    title: "Resume Workshop",
    date: "2026-03-12",
    time: "5:00 PM - 6:30 PM",
    location: "Zell B. Miller Learning Center",
    type: "Workshop",
    category: "professional",
    attendees: 38,
    description:
      "Professional development workshop focused on resume building and review.",
  },
  {
    id: 5,
    title: "Community Service: Food Bank",
    date: "2026-03-15",
    time: "9:00 AM - 12:00 PM",
    location: "Athens Community Council on Aging",
    type: "Service",
    category: "service",
    attendees: 22,
    description:
      "Volunteer at the local food bank as part of our community service initiative.",
  },
  {
    id: 6,
    title: "Hackathon Prep Session",
    date: "2026-03-18",
    time: "3:00 PM - 5:00 PM",
    location: "MLC Computer Lab",
    type: "Workshop",
    category: "professional",
    attendees: 25,
    description: "Team formation and project ideation for upcoming UGA Hacks.",
  },
  {
    id: 7,
    title: "Coffee Chat with Alumni",
    date: "2026-03-20",
    time: "4:00 PM - 5:30 PM",
    location: "1000 Faces Coffee",
    type: "Networking",
    category: "professional",
    attendees: 15,
    description: "Informal networking session with KTP alumni working in tech.",
  },
  {
    id: 8,
    title: "Spring Formal",
    date: "2026-03-25",
    time: "7:00 PM - 11:00 PM",
    location: "The Georgian Hotel",
    type: "Social",
    category: "social",
    attendees: 68,
    description: "Annual spring formal dinner and celebration.",
  },
];

const typeColors = {
  Meeting: "bg-blue-100 text-blue-800",
  Workshop: "bg-green-100 text-green-800",
  Social: "bg-purple-100 text-purple-800",
  Service: "bg-orange-100 text-orange-800",
  Networking: "bg-pink-100 text-pink-800",
};

function EventsList({ items }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No events in this category</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4">
      {items.map((event) => (
        <Card key={event.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <Badge
                    className={
                      typeColors[event.type] ?? "bg-gray-100 text-gray-800"
                    }
                  >
                    {event.type}
                  </Badge>
                </div>
                <CardDescription>{event.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                RSVP
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {event.attendees} attending
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm mt-3 pt-3 border-t border-gray-100">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <span className="text-gray-700">{event.location}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function MemberCalendar() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
        <p className="text-gray-600">View and manage chapter events</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="chapter">Chapter</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="service">Service</TabsTrigger>
        </TabsList>
        {["all", "chapter", "professional", "social", "service"].map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-6">
            <EventsList
              items={
                cat === "all"
                  ? events
                  : events.filter((e) => e.category === cat)
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
