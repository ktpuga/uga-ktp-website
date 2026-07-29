'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, QrCode } from 'lucide-react';
import { getEvents, getAttendanceCode, getAttendanceList, setAttendanceStatus } from '@/lib/portal-api';
import { memberDisplayName, getEventStartDate, getEventEndDate, formatEventTimeRange } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const ACCENTS = {
  blue: 'text-blue-900 dark:text-blue-100',
  red: 'text-red-900 dark:text-red-100',
};

const STATUS_BADGE = {
  present: 'bg-green-100 text-green-800',
  excused: 'bg-amber-100 text-amber-800',
  absent: 'bg-slate-100 text-slate-800',
};

function AttendanceRow({ record, eventId, onStatusChange }) {
  const name = memberDisplayName({
    firstName: record.first_name,
    lastName: record.last_name,
    preferredName: record.preferred_name,
    username: record.username,
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-2.5 text-sm dark:border-slate-700">
      <span className="min-w-0 truncate font-medium text-gray-900 dark:text-slate-100">{name}</span>
      <div className="flex shrink-0 items-center gap-2">
        <Badge className={STATUS_BADGE[record.status] ?? STATUS_BADGE.present}>{record.status}</Badge>
        <select
          value={record.status}
          onChange={(e) => onStatusChange(eventId, record.user_id, e.target.value)}
          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="present">Present</option>
          <option value="excused">Excused</option>
          <option value="absent">Absent</option>
        </select>
      </div>
    </div>
  );
}

function EventAttendanceView({ event, onBack, accentClass }) {
  const [code, setCode] = useState(null);
  const [checkinUrl, setCheckinUrl] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAttendanceCode(event.id)
      .then((data) => {
        setCode(data);
        setCheckinUrl(`${window.location.origin}/checkin/${data.eventId}/${data.token}`);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load the check-in code');
      });
  }, [event.id]);

  async function loadList() {
    try {
      const data = await getAttendanceList(event.id);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load attendance');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
    // Polling, not a websocket — good enough for "live-ish" during a meeting
    // without adding real-time infrastructure for something this low-traffic.
    const interval = setInterval(loadList, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  async function handleStatusChange(eventId, userId, status) {
    try {
      await setAttendanceStatus(eventId, userId, status);
      loadList();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to update status');
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to events
      </Button>

      <div>
        <h1 className={`text-xl font-bold sm:text-2xl ${accentClass}`}>{event.title}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" /> Check-in code</CardTitle>
            <CardDescription>Display this for members to scan — only works while the event is happening</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {checkinUrl ? (
              <div className="rounded-xl bg-white p-6">
                <QRCodeSVG value={checkinUrl} size={240} />
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading code...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checked in ({records.length})</CardTitle>
            <CardDescription>Refreshes automatically every few seconds</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No one has checked in yet.</p>
            ) : (
              <div className="space-y-2">
                {records.map((record) => (
                  <AttendanceRow key={record.user_id} record={record} eventId={event.id} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AttendancePage({ accent = 'blue' }) {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const accentClass = ACCENTS[accent] ?? ACCENTS.blue;

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return <EventAttendanceView event={selected} onBack={() => setSelected(null)} accentClass={accentClass} />;
  }

  const isEboard = session?.user?.groups?.includes('eboard') ?? false;
  const myId = session?.user?.authentik_id;
  const manageable = events.filter((event) => event.requiresAttendance && (isEboard || event.createdBy === myId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold sm:text-3xl ${accentClass}`}>Attendance</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Events you manage with attendance tracking on — turn it on from an event&apos;s create/edit form.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading events...</p>
      ) : manageable.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No events with attendance tracking enabled yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manageable.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelected(event)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>{formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
