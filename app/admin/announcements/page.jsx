'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Send, X, CalendarPlus } from 'lucide-react';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  createEvent,
  getCommittees,
} from '@/lib/portal-api';
import { formatAudience, formatMessageTime } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import AudienceSelect from '@/components/portal/AudienceSelect';

const EMPTY_ANNOUNCEMENT_FORM = { title: '', body: '', audience: [] };
const EMPTY_EVENT_FORM = {
  title: '',
  description: '',
  location: '',
  start: '',
  end: '',
  audience: [],
  committeeId: '',
  calendlyUrl: '',
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [committees, setCommittees] = useState([]);

  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState(EMPTY_ANNOUNCEMENT_FORM);
  const [formError, setFormError] = useState(null);
  const [formSaving, setFormSaving] = useState(false);

  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [eventError, setEventError] = useState(null);
  const [eventSaving, setEventSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAnnouncements(), getCommittees()])
      .then(([announcementsData, committeesData]) => {
        setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
        setCommittees(Array.isArray(committeesData) ? committeesData : []);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setLoadError(err.message ?? 'Could not load announcements');
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  async function handleCreateAnnouncement() {
    setFormError(null);
    setFormSaving(true);
    try {
      const announcement = await createAnnouncement({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
      });
      setAnnouncements((prev) => [announcement, ...prev]);
      setForm(EMPTY_ANNOUNCEMENT_FORM);
      setIsCreating(false);
      showToast('Announcement published successfully!');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setFormError(err.message ?? 'Failed to create announcement');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      showToast('Announcement deleted');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete announcement');
    }
  }

  async function handleCreateEvent() {
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
      const result = await createEvent({
        title: eventForm.title.trim(),
        description: eventForm.description.trim() || null,
        location: eventForm.location.trim() || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        audience: eventForm.committeeId ? [] : eventForm.audience,
        committeeId: eventForm.committeeId || null,
        calendlyUrl: eventForm.calendlyUrl.trim() || null,
      });

      if (!result?.ok) {
        setEventError(result?.error ?? 'Failed to create event.');
        return;
      }

      setEventForm(EMPTY_EVENT_FORM);
      setIsCreatingEvent(false);
      showToast('Event created successfully.');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setEventError(err.message ?? 'Failed to create event.');
    } finally {
      setEventSaving(false);
    }
  }

  const untargetedCount = announcements.filter((a) => !a.audience || a.audience.length === 0).length;

  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-red-500 via-rose-400 to-orange-300 opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-orange-300 via-red-400 to-rose-500 opacity-10 blur-[110px]" />
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-red-900">Announcements</h1>
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
            <CalendarPlus className="mr-2 h-4 w-4" /> New Event
          </Button>
          <Button
            className="bg-red-900 hover:bg-red-800"
            onClick={() => {
              setIsCreating(true);
              setIsCreatingEvent(false);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Announcement
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
                <X className="h-5 w-5" />
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
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Calendly link (optional)</label>
              <Input
                placeholder="https://calendly.com/..."
                value={eventForm.calendlyUrl}
                onChange={(e) => setEventForm({ ...eventForm, calendlyUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Committee meeting (optional)</label>
              <select
                value={eventForm.committeeId}
                onChange={(e) => setEventForm({ ...eventForm, committeeId: e.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Not a committee meeting</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {eventForm.committeeId ? (
                <p className="text-xs text-slate-500">
                  Visible only to that committee&apos;s members — audience targeting below is disabled.
                </p>
              ) : null}
            </div>
            {!eventForm.committeeId && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Audience</label>
                <AudienceSelect
                  value={eventForm.audience}
                  onChange={(audience) => setEventForm({ ...eventForm, audience })}
                />
              </div>
            )}
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
                <CalendarPlus className="mr-2 h-4 w-4" />
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

      {isCreating && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New Announcement</CardTitle>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardDescription>Post an announcement to the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input
                placeholder="Announcement title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Message</label>
              <Textarea
                rows={4}
                placeholder="Write your announcement message..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Audience</label>
              <AudienceSelect
                value={form.audience}
                onChange={(audience) => setForm({ ...form, audience })}
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-red-900 hover:bg-red-800"
                onClick={handleCreateAnnouncement}
                disabled={!form.title.trim() || !form.body.trim() || formSaving}
              >
                <Send className="mr-2 h-4 w-4" /> {formSaving ? 'Publishing...' : 'Publish Now'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: 'Total', value: announcements.length },
          { label: 'All Members', value: untargetedCount },
          { label: 'Targeted', value: announcements.length - untargetedCount },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-3">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{loading ? '-' : value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {loadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{loadError}</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <p className="text-gray-600">No announcements yet.</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{a.title}</CardTitle>
                      <Badge variant="outline">{formatAudience(a.audience)}</Badge>
                    </div>
                    <CardDescription>{a.body}</CardDescription>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-gray-600">Posted {formatMessageTime(a.created_at)}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
