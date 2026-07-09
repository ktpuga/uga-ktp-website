'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Send, X, CalendarPlus, Clock, MapPin, CalendarDays } from 'lucide-react';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCommittees,
} from '@/lib/portal-api';
import {
  formatAudience,
  formatMessageTime,
  formatEventTimeRange,
  getEventStartDate,
  getEventEndDate,
} from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import AudienceSelect from '@/components/portal/AudienceSelect';

const EMPTY_ANNOUNCEMENT_FORM = { title: '', body: '', audience: [], committeeId: '' };
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

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AnnouncementsSection() {
  const confirm = useConfirm();
  const [announcements, setAnnouncements] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ANNOUNCEMENT_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

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

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_ANNOUNCEMENT_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(announcement) {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience ?? [],
      committeeId: announcement.committee_id ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    setFormError(null);
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAnnouncement(editingId, form);
        setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await createAnnouncement(form);
        setAnnouncements((prev) => [created, ...prev]);
      }
      setFormOpen(false);
      setForm(EMPTY_ANNOUNCEMENT_FORM);
      setEditingId(null);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setFormError(err.message ?? 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!(await confirm('Delete this announcement?'))) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete announcement');
    }
  }

  function announcementBadgeLabel(announcement) {
    if (announcement.committee_id) {
      const committee = committees.find((c) => c.id === announcement.committee_id);
      return committee ? `Committee: ${committee.name}` : 'Committee';
    }
    return formatAudience(announcement.audience);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-red-900 hover:bg-red-800" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Announcement
        </Button>
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</CardTitle>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
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
              <label className="text-sm font-medium text-slate-700">Committee announcement (optional)</label>
              <select
                value={form.committeeId}
                onChange={(e) => setForm({ ...form, committeeId: e.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Not a committee announcement</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {form.committeeId ? (
                <p className="text-xs text-slate-500">
                  Visible only to that committee&apos;s members — audience targeting below is disabled.
                </p>
              ) : null}
            </div>
            {!form.committeeId && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Audience</label>
                <AudienceSelect
                  value={form.audience}
                  onChange={(audience) => setForm({ ...form, audience })}
                />
              </div>
            )}
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-red-900 hover:bg-red-800"
                onClick={handleSubmit}
                disabled={!form.title.trim() || !form.body.trim() || saving}
              >
                <Send className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Now'}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                      <Badge variant="outline">{announcementBadgeLabel(a)}</Badge>
                    </div>
                    <CardDescription>{a.body}</CardDescription>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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

function EventsSection() {
  const confirm = useConfirm();
  const [events, setEvents] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_EVENT_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getEvents(), getCommittees()])
      .then(([eventsData, committeesData]) => {
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setCommittees(Array.isArray(committeesData) ? committeesData : []);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setLoadError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_EVENT_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(event) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      start: toDatetimeLocal(getEventStartDate(event)),
      end: toDatetimeLocal(getEventEndDate(event)),
      audience: event.audience ?? [],
      committeeId: event.committeeId ?? '',
      calendlyUrl: event.calendlyUrl ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    setFormError(null);

    const startDate = new Date(form.start);
    const endDate = new Date(form.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setFormError('Enter a valid start and end time.');
      return;
    }

    if (endDate <= startDate) {
      setFormError('End time must be after start time.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        audience: form.committeeId ? [] : form.audience,
        committeeId: form.committeeId || null,
        calendlyUrl: form.calendlyUrl.trim() || null,
      };

      const result = editingId ? await updateEvent(editingId, payload) : await createEvent(payload);

      if (!result?.ok) {
        setFormError(result?.error ?? 'Failed to save event.');
        return;
      }

      setEvents((prev) =>
        editingId ? prev.map((e) => (e.id === editingId ? result.event : e)) : [...prev, result.event]
      );
      setFormOpen(false);
      setForm(EMPTY_EVENT_FORM);
      setEditingId(null);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setFormError(err.message ?? 'Failed to save event.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!(await confirm('Delete this event? This cannot be undone.'))) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete event');
    }
  }

  function eventBadgeLabel(event) {
    if (event.committeeId) {
      const committee = committees.find((c) => c.id === event.committeeId);
      return committee ? `Committee: ${committee.name}` : 'Committee meeting';
    }
    return formatAudience(event.audience);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-red-900 hover:bg-red-800" onClick={openCreate}>
          <CalendarPlus className="mr-2 h-4 w-4" /> New Event
        </Button>
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Edit Event' : 'Create New Event'}</CardTitle>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <Textarea
                rows={4}
                placeholder="Optional event details..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Location</label>
              <Input
                placeholder="Location TBD"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Start</label>
                <Input
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">End</label>
                <Input
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Calendly link (optional)</label>
              <Input
                placeholder="https://calendly.com/..."
                value={form.calendlyUrl}
                onChange={(e) => setForm({ ...form, calendlyUrl: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Committee meeting (optional)</label>
              <select
                value={form.committeeId}
                onChange={(e) => setForm({ ...form, committeeId: e.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Not a committee meeting</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {form.committeeId ? (
                <p className="text-xs text-slate-500">
                  Visible only to that committee&apos;s members — audience targeting below is disabled.
                </p>
              ) : null}
            </div>
            {!form.committeeId && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Audience</label>
                <AudienceSelect
                  value={form.audience}
                  onChange={(audience) => setForm({ ...form, audience })}
                />
              </div>
            )}
            {formError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button
                className="flex-1 bg-red-900 hover:bg-red-800"
                onClick={handleSubmit}
                disabled={saving || !form.title.trim() || !form.start || !form.end}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Event'}
              </Button>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{loadError}</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <p className="text-gray-600">No events yet.</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge variant="outline">{eventBadgeLabel(event)}</Badge>
                    </div>
                    {event.description && <CardDescription>{event.description}</CardDescription>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(event)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="h-4 w-4 shrink-0 text-gray-500" />
                  {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
                  {event.location || 'Location TBD'}
                </div>
                {event.calendlyUrl && (
                  <a
                    href={event.calendlyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                  >
                    <CalendarDays className="h-4 w-4" /> Schedule / RSVP
                  </a>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminAnnouncements() {
  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-red-500 via-rose-400 to-orange-300 opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-orange-300 via-red-400 to-rose-500 opacity-10 blur-[110px]" />
      </div>

      <div>
        <h1 className="mb-2 text-3xl font-bold text-red-900">Announcements & Events</h1>
        <p className="text-gray-600">Manage what the chapter sees on the dashboard and calendar</p>
      </div>

      <Tabs defaultValue="announcements" className="w-full min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
          <TabsTrigger value="announcements" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Announcements</TabsTrigger>
          <TabsTrigger value="events" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-6">
          <AnnouncementsSection />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
