import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Calendar, Users, Megaphone, TrendingUp, ArrowRight, Bell } from 'lucide-react';
import { Link } from 'react-router';
export default function MemberDashboard() {
    const upcomingEvents = [
        {
            id: 1,
            title: 'General Body Meeting',
            date: 'March 3, 2026',
            time: '7:00 PM',
            location: 'Tate Student Center',
            type: 'Meeting',
        },
        {
            id: 2,
            title: 'Tech Talk: AI in Production',
            date: 'March 7, 2026',
            time: '6:30 PM',
            location: 'Boyd GSRC',
            type: 'Workshop',
        },
        {
            id: 3,
            title: 'Social: Game Night',
            date: 'March 10, 2026',
            time: '8:00 PM',
            location: 'Member\'s Apartment',
            type: 'Social',
        },
    ];
    const announcements = [
        {
            id: 1,
            title: 'Spring Rush Applications Open',
            message: 'Applications for Spring 2026 rush are now open. Share with interested students!',
            date: '2 days ago',
            priority: 'high',
        },
        {
            id: 2,
            title: 'New Partnership with Google',
            message: 'Excited to announce our new partnership with Google for exclusive tech talks.',
            date: '5 days ago',
            priority: 'normal',
        },
        {
            id: 3,
            title: 'Hackathon Team Formation',
            message: 'Looking to form teams for UGA\'s upcoming hackathon. DM leadership if interested!',
            date: '1 week ago',
            priority: 'normal',
        },
    ];
    const recentPhotos = [
        'https://images.unsplash.com/photo-1758598306835-2c030e203707?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB0ZWNobm9sb2d5JTIwdGVhbSUyMG5ldHdvcmtpbmd8ZW58MXx8fHwxNzcyMzIxMTE3fDA&ixlib=rb-4.1.0&q=80&w=400',
        'https://images.unsplash.com/photo-1758270705172-07b53627dfcb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBjb2xsYWJvcmF0aW9uJTIwY2FtcHVzfGVufDF8fHx8MTc3MjIxODI3Nnww&ixlib=rb-4.1.0&q=80&w=400',
        'https://images.unsplash.com/photo-1765366417030-16d9765d920a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2UlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcyMjg3NjI0fDA&ixlib=rb-4.1.0&q=80&w=400',
        'https://images.unsplash.com/photo-1758270702512-089c0da33998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwYWx1bW5pJTIwY2VsZWJyYXRpb258ZW58MXx8fHwxNzcyMzIxMTE4fDA&ixlib=rb-4.1.0&q=80&w=400',
    ];
    return (<div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Member!</h1>
        <p className="text-gray-600">Here's what's happening in KTP Georgia</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming Events</CardTitle>
              <Calendar className="w-4 h-4 text-red-800"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
              <Users className="w-4 h-4 text-red-800"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-gray-500 mt-1">+12 this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">New Announcements</CardTitle>
              <Megaphone className="w-4 h-4 text-red-800"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-500 mt-1">Unread</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Attendance Rate</CardTitle>
              <TrendingUp className="w-4 h-4 text-red-800"/>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-gray-500 mt-1">Above average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Don't miss these upcoming chapter events</CardDescription>
                </div>
                <Link to="/member/calendar">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 w-4 h-4"/>
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (<div key={event.id} className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50/50 transition-colors">
                    <div className="flex flex-col items-center justify-center bg-red-100 rounded-lg px-3 py-2 min-w-16">
                      <div className="text-xs text-red-800 font-medium">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-red-900">
                        {new Date(event.date).getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{event.time} • {event.location}</p>
                    </div>
                  </div>))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5"/>
                Announcements
              </CardTitle>
              <CardDescription>Latest updates from leadership</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (<div key={announcement.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">{announcement.title}</h4>
                      {announcement.priority === 'high' && (<Badge variant="destructive" className="text-xs">Important</Badge>)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                    <p className="text-xs text-gray-500">{announcement.date}</p>
                  </div>))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Photos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Photos</CardTitle>
              <CardDescription>Latest moments from chapter events</CardDescription>
            </div>
            <Link to="/member/files">
              <Button variant="outline" size="sm">
                View Gallery
                <ArrowRight className="ml-2 w-4 h-4"/>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentPhotos.map((photo, index) => (<div key={index} className="aspect-square rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                <ImageWithFallback src={photo} alt={`Recent photo ${index + 1}`} className="w-full h-full object-cover"/>
              </div>))}
          </div>
        </CardContent>
      </Card>
    </div>);
}
