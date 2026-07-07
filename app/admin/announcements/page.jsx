'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Send, Eye, X, CalendarPlus } from 'lucide-react';
import { createEvent } from '@/lib/portal-api';

const priorityColor = (p) => p === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
const statusColor = (s) => ({ published: 'bg-green-100 text-green-800', scheduled: 'bg-red-100 text-red-800', draft: 'bg-gray-100 text-gray-800' }[s] ?? 'bg-gray-100 text-gray-800');

const initial = [
  { id: 1, title: 'Spring Rush Applications Open', message: 'Applications for Spring 2026 rush are now open. Share with interested students!', audience: 'Members', priority: 'high', status: 'published', publishedDate: '2026-02-26', views: 156 },
  { id: 2, title: 'New Partnership with Google', message: 'Excited to announce our new partnership with Google for exclusive tech talks.', audience: 'All', priority: 'normal', status: 'published', publishedDate: '2026-02-23', views: 203 },
  { id: 3, title: "Hackathon Team Formation", message: "Looking to form teams for UGA's upcoming hackathon. DM leadership if interested!", audience: 'Members', priority: 'normal', status: 'published', publishedDate: '2026-02-21', views: 98 },
  { id: 4, title: 'Alumni Networking Event - March 15', message: 'Save the date for our upcoming alumni networking event at The Georgian Hotel.', audience: 'Alumni', priority: 'normal', status: 'scheduled', publishedDate: '2026-03-10', views: 0 },
];

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState(initial);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ title: '', message: '', audience: 'Members', priority: 'normal' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', start: '', end: '' });
  const [eventError, setEventError] = useState(null);
  const [eventSaving, setEventSaving] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreate = () => {
    setAnnouncements([
      { id: Date.now(), ...form, status: 'published', publishedDate: new Date().toISOString().split('T')[0], views: 0 },
      ...announcements,
    ]);
    setForm({ title: '', message: '', audience: 'Members', priority: 'normal' });
    setIsCreating(false);
    showToast('Announcement published successfully!');
  };

  const handleDelete = (id) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
    showToast('Announcement deleted');
  };

  const handleCreateEvent = async () => {
    setEventError(null);

    const startDate = new Date(eventForm.start);
    const endDate = new Date(eventForm.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setEventError('Enter a valid start and end time.');
      return;
    }

    if (endDate <= startDate) {
      setEventError('End time must be after start time.');
      return;
    }

    setEventSaving(true);

    try {
      await createEvent({
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || null,
        location: eventForm.location.trim() || 'Location TBD',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      setEventForm({ title: '', description: '', location: '', start: '', end: '' });
      setIsCreatingEvent(false);
      showToast('Event created successfully.');
    } catch (err) {
      setEventError(err.message ?? 'Failed to create event.');
    } finally {
      setEventSaving(false);
    }
  };

  const published = announcements.filter((a) => a.status === 'published');
  const scheduled = announcements.filter((a) => a.status === 'scheduled');

  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-red-500 via-rose-400 to-orange-300 opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-orange-300 via-red-400 to-rose-500 opacity-10 blur-[110px]" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-red-900 mb-2">Announcements</h1>
          <p className="text-gray-600">Create chapter announcements and calendar events</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              setIsCreatingEvent(true);
              setIsCreating(false);
            }}
          >
            <CalendarPlus className="w-4 h-4 mr-2" /> New Event
          </Button>
          <Button
            className="bg-red-900 hover:bg-red-800"
            onClick={() => {
              setIsCreating(true);
              setIsCreatingEvent(false);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> New Announcement
          </Button>
        </div>
      </div>

      {isCreatingEvent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Event</CardTitle>
              <button
                onClick={() => {
                  setIsCreatingEvent(false);
                  setEventError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CardDescription>Add an event to the chapter calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                rows={4}
                placeholder="Optional event details..."
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Location</label>
              <Input
                placeholder="Location TBD"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Start</label>
                <Input
                  type="datetime-local"
                  value={eventForm.start}
                  onChange={(e) => setEventForm({ ...eventForm, start: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">End</label>
                <Input
                  type="datetime-local"
                  value={eventForm.end}
                  onChange={(e) => setEventForm({ ...eventForm, end: e.target.value })}
                />
              </div>
            </div>
            {eventError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {eventError}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button
                className="flex-1 bg-red-900 hover:bg-red-800"
                onClick={handleCreateEvent}
                disabled={eventSaving || !eventForm.title.trim() || !eventForm.start || !eventForm.end}
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                {eventSaving ? 'Creating...' : 'Create Event'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingEvent(false);
                  setEventError(null);
                }}
                disabled={eventSaving}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create form (inline modal) */}
      {isCreating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Announcement</CardTitle>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <CardDescription>Send a message to members, alumni, or all users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input placeholder="Announcement title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <Textarea
                rows={4}
                placeholder="Write your announcement message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Members">Members Only</option>
                  <option value="Alumni">Alumni Only</option>
                  <option value="All">All Users</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-red-900 hover:bg-red-800"
                onClick={handleCreate}
                disabled={!form.title || !form.message}
              >
                <Send className="w-4 h-4 mr-2" /> Publish Now
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: announcements.length },
          { label: 'Published', value: published.length },
          { label: 'Scheduled', value: scheduled.length },
          { label: 'Total Views', value: announcements.reduce((s, a) => s + a.views, 0) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* List */}
      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
        </TabsList>

        {[{ key: 'published', items: published }, { key: 'scheduled', items: scheduled }].map(({ key, items }) => (
          <TabsContent key={key} value={key} className="mt-6 space-y-4">
            {items.map((a) => (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <CardTitle className="text-lg">{a.title}</CardTitle>
                        {a.priority === 'high' && <Badge className={priorityColor(a.priority)}>High Priority</Badge>}
                        <Badge variant="outline">{a.audience}</Badge>
                        <Badge className={statusColor(a.status)}>{a.status}</Badge>
                      </div>
                      <CardDescription>{a.message}</CardDescription>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>{key === 'scheduled' ? 'Scheduled for' : 'Published'} {a.publishedDate}</span>
                    {key === 'published' && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {a.views} views
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
