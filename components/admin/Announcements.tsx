import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Megaphone, Plus, Edit, Trash2, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Spring Rush Applications Open',
      message: 'Applications for Spring 2026 rush are now open. Share with interested students!',
      audience: 'Members',
      priority: 'high',
      status: 'published',
      publishedDate: '2026-02-26',
      views: 156,
    },
    {
      id: 2,
      title: 'New Partnership with Google',
      message: 'Excited to announce our new partnership with Google for exclusive tech talks.',
      audience: 'All',
      priority: 'normal',
      status: 'published',
      publishedDate: '2026-02-23',
      views: 203,
    },
    {
      id: 3,
      title: 'Hackathon Team Formation',
      message: 'Looking to form teams for UGA\'s upcoming hackathon. DM leadership if interested!',
      audience: 'Members',
      priority: 'normal',
      status: 'published',
      publishedDate: '2026-02-21',
      views: 98,
    },
    {
      id: 4,
      title: 'Alumni Networking Event - March 15',
      message: 'Save the date for our upcoming alumni networking event at The Georgian Hotel.',
      audience: 'Alumni',
      priority: 'normal',
      status: 'scheduled',
      publishedDate: '2026-03-10',
      views: 0,
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    audience: 'Members',
    priority: 'normal',
  });

  const handleCreateAnnouncement = () => {
    const announcement = {
      id: announcements.length + 1,
      ...newAnnouncement,
      status: 'published',
      publishedDate: new Date().toISOString().split('T')[0],
      views: 0,
    };
    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({ title: '', message: '', audience: 'Members', priority: 'normal' });
    setIsCreating(false);
    toast.success('Announcement published successfully!');
  };

  const handleDelete = (id: number) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success('Announcement deleted');
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      draft: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const publishedAnnouncements = announcements.filter(a => a.status === 'published');
  const scheduledAnnouncements = announcements.filter(a => a.status === 'scheduled');

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
            <p className="text-gray-600">Create and manage chapter announcements</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-red-800 hover:bg-red-900">
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Send a message to members, alumni, or all users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Announcement title"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your announcement message..."
                    rows={5}
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Select
                      value={newAnnouncement.audience}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, audience: value })}
                    >
                      <SelectTrigger id="audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Members">Members Only</SelectItem>
                        <SelectItem value="Alumni">Alumni Only</SelectItem>
                        <SelectItem value="All">All Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newAnnouncement.priority}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1 bg-red-800 hover:bg-red-900"
                    onClick={handleCreateAnnouncement}
                    disabled={!newAnnouncement.title || !newAnnouncement.message}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Publish Now
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Announcements</CardDescription>
              <CardTitle className="text-2xl">{announcements.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-2xl">{publishedAnnouncements.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Scheduled</CardDescription>
              <CardTitle className="text-2xl">{scheduledAnnouncements.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-2xl">
                {announcements.reduce((sum, a) => sum + a.views, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Announcements List */}
        <Tabs defaultValue="published" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="published">Published ({publishedAnnouncements.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledAnnouncements.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="published" className="mt-6 space-y-4">
            {publishedAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        {announcement.priority === 'high' && (
                          <Badge className={getPriorityColor(announcement.priority)}>High Priority</Badge>
                        )}
                        <Badge variant="outline">{announcement.audience}</Badge>
                        <Badge className={getStatusColor(announcement.status)}>
                          {announcement.status}
                        </Badge>
                      </div>
                      <CardDescription>{announcement.message}</CardDescription>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>Published {announcement.publishedDate}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {announcement.views} views
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6 space-y-4">
            {scheduledAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        {announcement.priority === 'high' && (
                          <Badge className={getPriorityColor(announcement.priority)}>High Priority</Badge>
                        )}
                        <Badge variant="outline">{announcement.audience}</Badge>
                        <Badge className={getStatusColor(announcement.status)}>
                          Scheduled
                        </Badge>
                      </div>
                      <CardDescription>{announcement.message}</CardDescription>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    Scheduled for {announcement.publishedDate}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
