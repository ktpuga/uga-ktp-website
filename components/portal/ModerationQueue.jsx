'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, User as UserIcon, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { getReports, updateReportStatus } from '@/lib/portal-api';
import { formatMessageTime, memberDisplayName } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const CONTENT_ICON = {
  user: UserIcon,
  message: MessageSquare,
  group_message: MessageSquare,
  photo: ImageIcon,
};

const CONTENT_LABEL = {
  user: 'Member profile',
  message: 'Direct message',
  group_message: 'Group chat message',
  photo: 'Photo',
};

function ReportCard({ report, onResolve }) {
  const [response, setResponse] = useState(report.moderator_response ?? '');
  const [busy, setBusy] = useState(false);
  const Icon = CONTENT_ICON[report.content_type] ?? ShieldAlert;

  async function handleAction(status) {
    setBusy(true);
    try {
      await onResolve(report.id, { status, moderatorResponse: response });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
              {CONTENT_LABEL[report.content_type] ?? report.content_type}
            </span>
            <Badge variant="outline">{report.reason}</Badge>
          </div>
          <span className="text-xs text-gray-500 dark:text-slate-400">{formatMessageTime(report.created_at)}</span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <p className="text-gray-700 dark:text-slate-300">
            <span className="text-gray-500 dark:text-slate-400">Reported by:</span>{' '}
            {report.reporter ? memberDisplayName(report.reporter) : 'Unknown'}
          </p>
          <p className="text-gray-700 dark:text-slate-300">
            <span className="text-gray-500 dark:text-slate-400">Reported member:</span>{' '}
            {report.reported_user ? memberDisplayName(report.reported_user) : '—'}
          </p>
        </div>

        {report.explanation && (
          <p className="rounded-md bg-gray-50 p-2.5 text-sm text-gray-700 dark:bg-slate-800/50 dark:text-slate-300">
            {report.explanation}
          </p>
        )}

        {report.content_id && (
          <p className="text-xs text-gray-400 dark:text-slate-500">Content ID: {report.content_id}</p>
        )}

        {report.status === 'open' ? (
          <div className="space-y-2 pt-1">
            <Textarea
              placeholder="Optional note for the record..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <Button size="sm" className="bg-red-800 hover:bg-red-700" onClick={() => handleAction('resolved')} disabled={busy}>
                Resolve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleAction('dismissed')} disabled={busy}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge className={report.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
              {report.status === 'resolved' ? 'Resolved' : 'Dismissed'}
            </Badge>
            {report.moderator_response && (
              <span className="text-xs text-gray-500 dark:text-slate-400">"{report.moderator_response}"</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ModerationQueue() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    getReports()
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load reports');
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleResolve(id, { status, moderatorResponse }) {
    try {
      const updated = await updateReportStatus(id, { status, moderatorResponse });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to update report');
    }
  }

  const open = reports.filter((r) => r.status === 'open');
  const closed = reports.filter((r) => r.status !== 'open');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-red-900 dark:text-red-100 sm:text-3xl">Reports & Moderation</h1>
        <p className="text-sm text-gray-600 dark:text-slate-400 sm:text-base">
          Review reports submitted by members about users, messages, and photos.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">Loading reports...</p>
      ) : (
        <Tabs defaultValue="open" className="w-full min-w-0">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:w-auto sm:inline-grid">
            <TabsTrigger value="open" className="min-w-0 px-3 py-2 text-xs sm:text-sm">Open ({open.length})</TabsTrigger>
            <TabsTrigger value="history" className="min-w-0 px-3 py-2 text-xs sm:text-sm">History ({closed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-6 space-y-3">
            {open.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <ShieldAlert className="mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">No open reports.</p>
                </CardContent>
              </Card>
            ) : (
              open.map((report) => <ReportCard key={report.id} report={report} onResolve={handleResolve} />)
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-3">
            {closed.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <p className="text-sm text-gray-600 dark:text-slate-400">No resolved reports yet.</p>
                </CardContent>
              </Card>
            ) : (
              closed.map((report) => <ReportCard key={report.id} report={report} onResolve={handleResolve} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
