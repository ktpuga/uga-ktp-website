'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Megaphone, MessageSquare, Search, Send, ArrowLeft, Plus, Trash2, Users, UserPlus, X } from 'lucide-react';
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getConversations,
  getConversation,
  sendMessage,
  markConversationRead,
  getMemberDirectory,
  getMember,
  getGroupChats,
  createGroupChat,
  deleteGroupChat,
  getGroupChatMessages,
  sendGroupChatMessage,
  markGroupChatRead,
  getGroupChatMembers,
  addGroupChatMember,
  removeGroupChatMember,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials, formatMemberGroup, formatMessageTime } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const AUDIENCE_OPTIONS = [
  { value: '', label: 'All Members' },
  { value: 'active', label: 'Active' },
  { value: 'chair', label: 'Chair' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'eboard', label: 'Eboard' },
  { value: 'pledge', label: 'Pledge' },
];

function EmptyState({ icon: Icon, message }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
        <Icon className="mb-4 h-12 w-12 text-gray-400" />
        <p className="max-w-sm text-sm text-gray-600 dark:text-slate-400">{message}</p>
      </CardContent>
    </Card>
  );
}

function CreateAnnouncementForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const announcement = await createAnnouncement({ title: title.trim(), body: body.trim(), audience });
      onCreated(announcement);
      setTitle('');
      setBody('');
      setAudience('');
      setOpen(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> New Announcement
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="Announcement text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[80px]"
          />
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950"
          >
            {AUDIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={!title.trim() || !body.trim() || submitting}>
              {submitting ? 'Posting...' : 'Post announcement'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AnnouncementCard({ announcement, isEboard, onDelete }) {
  const audienceLabel = AUDIENCE_OPTIONS.find((opt) => opt.value === (announcement.audience ?? ''))?.label;

  return (
    <Card>
      <CardContent className="space-y-2 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">{announcement.title}</h3>
          <div className="flex shrink-0 items-center gap-2">
            {announcement.audience && (
              <Badge className="bg-blue-100 text-blue-800">{audienceLabel}</Badge>
            )}
            {isEboard && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(announcement.id)}
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{announcement.body}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">{formatMessageTime(announcement.created_at)}</p>
      </CardContent>
    </Card>
  );
}

function AnnouncementsTab({ isEboard }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnnouncements()
      .then(setAnnouncements)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load announcements');
      })
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(announcement) {
    setAnnouncements((prev) => [announcement, ...prev]);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete announcement');
    }
  }

  return (
    <div className="space-y-4">
      {isEboard && <CreateAnnouncementForm onCreated={handleCreated} />}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} message="No announcements yet." />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} isEboard={isEboard} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationListItem({ conversation, active, currentUserId, onSelect }) {
  const name = memberDisplayName(conversation);
  const lastMessage = conversation.last_message;
  const isMine = lastMessage?.sender_id === currentUserId;
  const preview = lastMessage?.body ? `${isMine ? 'You: ' : ''}${lastMessage.body}` : '';

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 ${
        active ? 'bg-gray-100 dark:bg-slate-800' : ''
      }`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        {conversation.authentik_id && (
          <AvatarImage src={`/api/users/${conversation.authentik_id}/profile-picture/media`} alt={name} />
        )}
        <AvatarFallback className="bg-blue-900 text-white">{memberInitials(conversation)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{name}</p>
          {lastMessage?.created_at && (
            <span className="shrink-0 text-xs text-gray-500 dark:text-slate-400">
              {formatMessageTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-500 dark:text-slate-400">{preview}</p>
      </div>
      {conversation.unread_count > 0 && (
        <Badge className="shrink-0 bg-red-600 text-white">{conversation.unread_count}</Badge>
      )}
    </button>
  );
}

function NewMessagePicker({ onSelect, onCancel }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load members');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q));
  }, [members, query]);

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="-ml-2 gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">Loading members...</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member)}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <Avatar className="h-9 w-9 shrink-0">
                {member.id && (
                  <AvatarImage src={`/api/users/${member.id}/profile-picture/media`} alt={memberDisplayName(member)} />
                )}
                <AvatarFallback className="bg-blue-900 text-white">{memberInitials(member)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                  {memberDisplayName(member)}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-slate-400">
                  {formatMemberGroup(member.memberGroup)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, isMine }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isMine
            ? 'bg-blue-800 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>
        <p className={`mt-1 text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'}`}>
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function ConversationThread({ conversation, currentUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      getConversation(conversation.authentik_id)
        .then((data) => {
          if (!cancelled) setMessages(data);
        })
        .catch((err) => {
          if (isRedirectError(err)) throw err;
          if (!cancelled) setError(err.message ?? 'Could not load messages');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    markConversationRead(conversation.authentik_id).catch((err) => {
      if (isRedirectError(err)) throw err;
    });

    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversation.authentik_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    try {
      const message = await sendMessage(conversation.authentik_id, draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-3 dark:border-slate-700">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 shrink-0">
          {conversation.authentik_id && (
            <AvatarImage src={`/api/users/${conversation.authentik_id}/profile-picture/media`} alt={memberDisplayName(conversation)} />
          )}
          <AvatarFallback className="bg-blue-900 text-white">{memberInitials(conversation)}</AvatarFallback>
        </Avatar>
        <p className="font-medium text-gray-900 dark:text-slate-100">{memberDisplayName(conversation)}</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No messages yet — say hi!</p>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} isMine={message.sender_id === currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-slate-700">
        <Input
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" disabled={!draft.trim() || sending} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function GroupChatListItem({ chat, currentUserId, onSelect }) {
  const lastMessage = chat.last_message;
  const isMine = lastMessage?.sender_id === currentUserId;
  const preview = lastMessage?.body ? `${isMine ? 'You: ' : ''}${lastMessage.body}` : 'No messages yet';

  return (
    <button
      type="button"
      onClick={() => onSelect(chat)}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white">
        <Users className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">{chat.name}</p>
          {lastMessage?.created_at && (
            <span className="shrink-0 text-xs text-gray-500 dark:text-slate-400">
              {formatMessageTime(lastMessage.created_at)}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-gray-500 dark:text-slate-400">{preview}</p>
      </div>
      {chat.unread_count > 0 && (
        <Badge className="shrink-0 bg-red-600 text-white">{chat.unread_count}</Badge>
      )}
    </button>
  );
}

function AddMemberPicker({ excludeIds, onAdd, onCancel }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load members');
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => !excludeIds.includes(m.id))
      .filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q));
  }, [members, query, excludeIds]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Search members..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {filtered.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onAdd(member)}
              className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <Avatar className="h-6 w-6 shrink-0">
                {member.id && (
                  <AvatarImage src={`/api/users/${member.id}/profile-picture/media`} alt={memberDisplayName(member)} />
                )}
                <AvatarFallback className="bg-blue-900 text-xs text-white">{memberInitials(member)}</AvatarFallback>
              </Avatar>
              <span className="truncate text-gray-900 dark:text-slate-100">{memberDisplayName(member)}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-500">No matches.</p>}
        </div>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

function ManageMembersPanel({ members, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="my-3 space-y-3 rounded-lg border border-gray-200 p-3 dark:border-slate-700">
      <div className="space-y-1">
        {members.map((member) => (
          <div key={member.authentik_id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-700 dark:text-slate-300">{memberDisplayName(member)}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(member.authentik_id)}
              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {members.length === 0 && <p className="text-sm text-gray-500">No members yet.</p>}
      </div>
      {adding ? (
        <AddMemberPicker
          excludeIds={members.map((m) => m.authentik_id)}
          onAdd={(member) => {
            onAdd(member);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Add member
        </Button>
      )}
    </div>
  );
}

function CreateGroupChatForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load members');
      })
      .finally(() => setLoadingMembers(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q));
  }, [members, query]);

  function toggleMember(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const chat = await createGroupChat({ name: name.trim(), memberIds: [...selectedIds] });
      onCreated(chat);
      setName('');
      setSelectedIds(new Set());
      setOpen(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create group chat');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" /> New Group Chat
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Group chat name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search members to add..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {loadingMembers ? (
            <p className="text-sm text-gray-500">Loading members...</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2 dark:border-slate-700">
              {filtered.map((member) => (
                <label
                  key={member.id}
                  className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-gray-900 dark:text-slate-100">{memberDisplayName(member)}</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {selectedIds.size} member{selectedIds.size === 1 ? '' : 's'} selected
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={!name.trim() || submitting}>
              {submitting ? 'Creating...' : 'Create group chat'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function GroupChatThread({ chat, currentUserId, isEboard, onBack, onDeleted }) {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [managingMembers, setManagingMembers] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      getGroupChatMessages(chat.id)
        .then((data) => {
          if (!cancelled) setMessages(data);
        })
        .catch((err) => {
          if (isRedirectError(err)) throw err;
          if (!cancelled) setError(err.message ?? 'Could not load messages');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    markGroupChatRead(chat.id).catch((err) => {
      if (isRedirectError(err)) throw err;
    });

    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chat.id]);

  useEffect(() => {
    getGroupChatMembers(chat.id)
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
      });
  }, [chat.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  function senderName(senderId) {
    if (senderId === currentUserId) return 'You';
    const member = members.find((m) => m.authentik_id === senderId);
    return member ? memberDisplayName(member) : 'Member';
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    try {
      const message = await sendGroupChatMessage(chat.id, draft.trim());
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteChat() {
    if (!window.confirm(`Delete "${chat.name}"? This cannot be undone.`)) return;
    try {
      await deleteGroupChat(chat.id);
      onDeleted(chat.id);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete group chat');
    }
  }

  async function handleAddMember(member) {
    try {
      await addGroupChatMember(chat.id, member.id);
      setMembers((prev) => [...prev, { authentik_id: member.id, ...member }]);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to add member');
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await removeGroupChatMember(chat.id, userId);
      setMembers((prev) => prev.filter((m) => m.authentik_id !== userId));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to remove member');
    }
  }

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-slate-100">{chat.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {members.length} member{members.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        {isEboard && (
          <div className="flex shrink-0 gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setManagingMembers((v) => !v)}>
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDeleteChat}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {managingMembers && isEboard && (
        <ManageMembersPanel members={members} onAdd={handleAddMember} onRemove={handleRemoveMember} />
      )}

      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No messages yet — say hi!</p>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              {message.sender_id !== currentUserId && (
                <p className="mb-0.5 ml-1 text-xs text-gray-500 dark:text-slate-400">{senderName(message.sender_id)}</p>
              )}
              <MessageBubble message={message} isMine={message.sender_id === currentUserId} />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-slate-700">
        <Input placeholder="Type a message..." value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit" disabled={!draft.trim() || sending} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function GroupChatsTab({ currentUserId, isEboard }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;

    function load() {
      getGroupChats()
        .then((data) => {
          if (!cancelled) setChats(data);
        })
        .catch((err) => {
          if (isRedirectError(err)) throw err;
          if (!cancelled) setError(err.message ?? 'Could not load group chats');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    const interval = setInterval(load, 7000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function handleCreated(chat) {
    setChats((prev) => [chat, ...prev]);
  }

  function handleDeleted(chatId) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setSelected(null);
  }

  if (selected) {
    return (
      <GroupChatThread
        chat={selected}
        currentUserId={currentUserId}
        isEboard={isEboard}
        onBack={() => setSelected(null)}
        onDeleted={handleDeleted}
      />
    );
  }

  return (
    <div className="space-y-4">
      {isEboard && <CreateGroupChatForm onCreated={handleCreated} />}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading group chats...</p>
      ) : chats.length === 0 ? (
        <EmptyState icon={Users} message="No group chats yet." />
      ) : (
        <div className="space-y-1">
          {chats.map((chat) => (
            <GroupChatListItem key={chat.id} chat={chat} currentUserId={currentUserId} onSelect={setSelected} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab({ currentUserId, initialWithId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function load() {
      getConversations()
        .then((data) => {
          if (!cancelled) setConversations(data);
        })
        .catch((err) => {
          if (isRedirectError(err)) throw err;
          if (!cancelled) setError(err.message ?? 'Could not load conversations');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    const interval = setInterval(load, 7000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Deep link from the Directory's "Message" button (?with=<authentik_id>)
  // — jump straight into that conversation once, on mount.
  useEffect(() => {
    if (!initialWithId) return;
    getMember(initialWithId)
      .then((member) => setSelected({ authentik_id: initialWithId, ...member }))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWithId]);

  function handlePickMember(member) {
    setComposing(false);
    setSelected({ authentik_id: member.id, ...member });
  }

  if (selected) {
    return (
      <ConversationThread
        conversation={selected}
        currentUserId={currentUserId}
        onBack={() => setSelected(null)}
      />
    );
  }

  if (composing) {
    return (
      <NewMessagePicker
        onSelect={handlePickMember}
        onCancel={() => setComposing(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" onClick={() => setComposing(true)} className="gap-2">
        <Plus className="h-4 w-4" /> New Message
      </Button>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading conversations...</p>
      ) : conversations.length === 0 ? (
        <EmptyState icon={MessageSquare} message="No conversations yet. Start one with the New Message button above." />
      ) : (
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.authentik_id}
              conversation={conversation}
              active={false}
              currentUserId={currentUserId}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const withId = searchParams.get('with');
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-slate-100">Messages</h1>
        <p className="text-sm text-gray-600 sm:text-base dark:text-slate-400">
          Chapter announcements and direct messages
        </p>
      </div>

      <Tabs defaultValue={withId ? 'messages' : 'announcements'} className="w-full min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
          <TabsTrigger value="announcements" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Announcements</TabsTrigger>
          <TabsTrigger value="messages" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Messages</TabsTrigger>
          <TabsTrigger value="groups" className="min-w-0 px-2 py-2 text-xs sm:text-sm">Group Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements" className="mt-6">
          <AnnouncementsTab isEboard={isEboard} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <MessagesTab currentUserId={currentUserId} initialWithId={withId} />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <GroupChatsTab currentUserId={currentUserId} isEboard={isEboard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-gray-500">Loading...</p>}>
      <MessagesPageContent />
    </Suspense>
  );
}
