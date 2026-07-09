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
import {
  MessageSquare, Search, Send, ArrowLeft, Plus, Trash2, Users, UserPlus, X,
  Paperclip, SmilePlus, Download, FileText, Layers, Check, Sparkles, Camera,
} from 'lucide-react';
import {
  getConversations,
  getConversation,
  sendMessage,
  markConversationRead,
  getMemberDirectory,
  getMember,
  getGroupChats,
  createGroupChat,
  deleteGroupChat,
  updateGroupChatPhoto,
  getGroupChatMessages,
  sendGroupChatMessage,
  toggleGroupChatReaction,
  toggleMessageReaction,
  deleteMessage,
  deleteGroupChatMessage,
  markGroupChatRead,
  getGroupChatMembers,
  addGroupChatMember,
  removeGroupChatMember,
  getCommittees,
  getCommitteeMembers,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials, formatMemberGroup, formatMessageTime } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useUnreadCounts } from '@/lib/use-unread-counts';

const QUICK_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🙏', '🔥'];
const ROLE_GROUPS = [
  { value: 'active', label: 'Actives' },
  { value: 'chair', label: 'Chairs' },
  { value: 'eboard', label: 'Eboard' },
  { value: 'pledge', label: 'Pledges' },
  { value: 'alumni', label: 'Alumni' },
];

function lastMessagePreview(lastMessage, isMine) {
  if (!lastMessage) return '';
  const prefix = isMine ? 'You: ' : '';
  if (lastMessage.body) return `${prefix}${lastMessage.body}`;
  if (lastMessage.attachment_kind === 'image') return `${prefix}📷 Photo`;
  if (lastMessage.attachment_kind === 'file') return `${prefix}📎 File`;
  return '';
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

function ConversationListItem({ conversation, active, currentUserId, onSelect }) {
  const name = memberDisplayName(conversation);
  const lastMessage = conversation.last_message;
  const isMine = lastMessage?.sender_id === currentUserId;
  const preview = lastMessagePreview(lastMessage, isMine);

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

function AttachmentContent({ attachment, mediaUrl }) {
  if (attachment.kind === 'image') {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={attachment.filename ?? 'Attached image'}
          className="max-h-64 w-full max-w-xs rounded-lg object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-black/10 bg-white/10 px-3 py-2 text-xs hover:bg-white/20"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
      <span className="shrink-0 opacity-70">{formatFileSize(attachment.size)}</span>
      <Download className="h-3.5 w-3.5 shrink-0" />
    </a>
  );
}

function EmojiPickerPopover({ onPick, onClose, align = 'left' }) {
  return (
    <div
      className={`absolute bottom-full z-10 mb-1 flex gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
      onMouseLeave={onClose}
    >
      {QUICK_EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onPick(emoji);
            onClose();
          }}
          className="rounded-full p-1 text-base transition-transform hover:scale-125"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function ReactionBar({ reactions, onReact }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onReact(r.emoji)}
          className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
            r.reacted
              ? 'border-blue-400 bg-blue-100 dark:border-blue-600 dark:bg-blue-950'
              : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="text-gray-600 dark:text-slate-400">{r.count}</span>
        </button>
      ))}
    </>
  );
}

function MessageBubble({ message, isMine, attachmentUrl, onReact, canDelete, onDelete }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const attachment = message.attachment;

  return (
    <div className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`space-y-1.5 rounded-2xl px-4 py-2 text-sm ${
            isMine
              ? 'bg-blue-800 text-white'
              : 'bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100'
          }`}
        >
          {attachment && attachmentUrl && <AttachmentContent attachment={attachment} mediaUrl={attachmentUrl} />}
          {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
          <p className={`text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'}`}>
            {formatMessageTime(message.created_at)}
          </p>
        </div>

        {(onReact || canDelete) && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {onReact && <ReactionBar reactions={message.reactions} onReact={onReact} />}
            {onReact && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="rounded-full p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-gray-700 group-hover:opacity-100 dark:hover:text-slate-200"
                  aria-label="Add reaction"
                >
                  <SmilePlus className="h-3.5 w-3.5" />
                </button>
                {pickerOpen && (
                  <EmojiPickerPopover onPick={onReact} onClose={() => setPickerOpen(false)} align={isMine ? 'right' : 'left'} />
                )}
              </div>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-400"
                aria-label="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConversationThread({ conversation, currentUserId, isEboard, onBack }) {
  const confirm = useConfirm();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (!draft.trim() && !attachedFile) return;

    setSending(true);
    try {
      const message = await sendMessage(conversation.authentik_id, { body: draft.trim(), file: attachedFile });
      setMessages((prev) => [...prev, message]);
      setDraft('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleReact(messageId, emoji) {
    try {
      const reactions = await toggleMessageReaction(messageId, emoji);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to react');
    }
  }

  async function handleDeleteMessage(messageId) {
    if (!(await confirm('Delete this message? This cannot be undone.'))) return;
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete message');
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
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.sender_id === currentUserId}
              attachmentUrl={message.attachment ? `/api/messages/${message.id}/attachment` : null}
              onReact={(emoji) => handleReact(message.id, emoji)}
              canDelete={message.sender_id === currentUserId || isEboard}
              onDelete={() => handleDeleteMessage(message.id)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs dark:border-slate-700">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-slate-300">{attachedFile.name}</span>
          <button type="button" onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-slate-700">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 px-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" disabled={(!draft.trim() && !attachedFile) || sending} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

// Shows the chat's own photo if eboard has set one, otherwise the generic
// icon — shared by the chat list, thread header, and info modal so all
// three stay in sync automatically once a photo's uploaded.
function GroupChatAvatar({ chat, className = 'h-10 w-10' }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900 text-white ${className}`}>
      {chat.photo_asset_id ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/group-chats/${chat.id}/photo/media`}
          alt={chat.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <Users className="h-1/2 w-1/2" />
      )}
    </div>
  );
}

function GroupChatListItem({ chat, currentUserId, onSelect }) {
  const lastMessage = chat.last_message;
  const isMine = lastMessage?.sender_id === currentUserId;
  const preview = lastMessagePreview(lastMessage, isMine) || 'No messages yet';

  return (
    <button
      type="button"
      onClick={() => onSelect(chat)}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
    >
      <GroupChatAvatar chat={chat} />
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

// Lets eboard pull in a whole slice of the chapter at once — by Authentik
// role group (e.g. "everyone in Actives") or by committee — instead of
// adding people one at a time. Resolves against the already-loaded member
// directory / committee roster client-side, then hands the resolved id list
// to the caller in one batch.
function BulkAddByGroupOrCommittee({ excludeIds, onAddMany }) {
  const [members, setMembers] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
      });
    getCommittees()
      .then(setCommittees)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
      });
  }, []);

  function toggleGroup(value) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleAddGroups() {
    const matches = members.filter((m) => selectedGroups.has(m.memberGroup) && !excludeIds.includes(m.id));
    if (matches.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      await onAddMany(matches);
      setSelectedGroups(new Set());
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to add members');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCommittee(committeeId) {
    if (!committeeId) return;
    setBusy(true);
    setError(null);
    try {
      const committeeMembers = await getCommitteeMembers(committeeId);
      const matches = committeeMembers
        .filter((m) => !excludeIds.includes(m.authentik_id))
        .map((m) => ({ id: m.authentik_id, ...m }));
      await onAddMany(matches);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to add committee members');
    } finally {
      setBusy(false);
    }
  }

  const groupMatchCount = members.filter((m) => selectedGroups.has(m.memberGroup) && !excludeIds.includes(m.id)).length;

  return (
    <div className="space-y-2 rounded-md border border-dashed border-gray-300 p-2.5 dark:border-slate-700">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400">
        <Layers className="h-3.5 w-3.5" /> Add by group
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ROLE_GROUPS.map((g) => (
          <button
            key={g.value}
            type="button"
            onClick={() => toggleGroup(g.value)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              selectedGroups.has(g.value)
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      {selectedGroups.size > 0 && (
        <Button type="button" size="sm" variant="outline" disabled={busy || groupMatchCount === 0} onClick={handleAddGroups}>
          {busy ? 'Adding...' : `+ Add ${groupMatchCount} member${groupMatchCount === 1 ? '' : 's'}`}
        </Button>
      )}

      {committees.length > 0 && (
        <select
          value=""
          disabled={busy}
          onChange={(e) => handleAddCommittee(e.target.value)}
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">+ Add all members from a committee...</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
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

// A selectable member "card" for the grid picker below — click anywhere on
// it to toggle, rather than hunting for a tiny checkbox.
function MemberChip({ member, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(member.id)}
      className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-500 dark:border-blue-500 dark:bg-blue-950/40'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-slate-800'
      }`}
    >
      {selected && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      )}
      <Avatar className={`h-10 w-10 transition-transform ${selected ? 'scale-105' : 'group-hover:scale-105'}`}>
        {member.id && (
          <AvatarImage src={`/api/users/${member.id}/profile-picture/media`} alt={memberDisplayName(member)} />
        )}
        <AvatarFallback className="bg-blue-900 text-xs text-white">{memberInitials(member)}</AvatarFallback>
      </Avatar>
      <span className="line-clamp-2 w-full text-xs font-medium leading-tight text-gray-900 dark:text-slate-100">
        {memberDisplayName(member)}
      </span>
    </button>
  );
}

function CreateGroupChatForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [committees, setCommittees] = useState([]);
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
    getCommittees()
      .then(setCommittees)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
      });
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

  // Adds everyone currently in the given Authentik group to the selection —
  // on top of, not instead of, whoever's already picked.
  function handleImportGroup(groupValue) {
    if (!groupValue) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      members.filter((m) => m.memberGroup === groupValue).forEach((m) => next.add(m.id));
      return next;
    });
  }

  // Adds every current member of the chosen committee to the selection —
  // on top of, not instead of, whoever's already picked.
  async function handleImportCommittee(committeeId) {
    if (!committeeId) return;
    try {
      const committeeMembers = await getCommitteeMembers(committeeId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        committeeMembers.forEach((m) => next.add(m.authentik_id));
        return next;
      });
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to import committee members');
    }
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
    <Card className="overflow-hidden border-blue-100 dark:border-blue-950">
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent px-6 py-4 dark:border-blue-950 dark:from-blue-950/40 dark:via-blue-950/10">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">New Group Chat</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Name it, then pick who's in it</p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Group chat name" value={name} onChange={(e) => setName(e.target.value)} />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_GROUPS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => handleImportGroup(g.value)}
                  className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/40"
                >
                  + All {g.label}
                </button>
              ))}
            </div>
            {committees.length > 0 && (
              <select
                value=""
                onChange={(e) => handleImportCommittee(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">+ Add all members from a committee...</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">Members</p>
              {selectedIds.size > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <X className="h-3 w-3" /> Deselect all
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingMembers ? (
              <p className="py-6 text-center text-sm text-gray-500">Loading members...</p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 dark:border-slate-700 dark:bg-slate-950/30">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">No matches.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {filtered.map((member) => (
                      <MemberChip
                        key={member.id}
                        member={member}
                        selected={selectedIds.has(member.id)}
                        onToggle={toggleMember}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-slate-400">
              {selectedIds.size} member{selectedIds.size === 1 ? '' : 's'} selected
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
            <Button type="submit" disabled={!name.trim() || submitting} className="bg-blue-700 hover:bg-blue-800">
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

// Grid tile for the info modal's Attachments tab — distinct from
// AttachmentContent (which renders inline inside a chat bubble); this one
// is a compact square tile in a gallery grid.
function AttachmentTile({ message }) {
  const attachment = message.attachment;
  const mediaUrl = `/api/group-chats/${message.group_chat_id}/messages/${message.id}/attachment`;

  if (attachment.kind === 'image') {
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl} alt={attachment.filename ?? 'Attachment'} className="h-full w-full object-cover transition-transform hover:scale-105" />
      </a>
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2 text-center hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750"
    >
      <FileText className="h-6 w-6 text-gray-400" />
      <span className="line-clamp-2 w-full text-[10px] leading-tight text-gray-600 dark:text-slate-400">{attachment.filename}</span>
    </a>
  );
}

// Click the chat's name in the header to open this — everything about the
// chat in one place: who's in it (with eboard add/remove folded in here
// instead of a separate toggle), and every image/file anyone's shared.
function GroupChatInfoModal({ chat, members, messages, isEboard, onAddMember, onAddMany, onRemoveMember, onChatUpdated, onClose }) {
  const [adding, setAdding] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const photoInputRef = useRef(null);
  const attachments = useMemo(() => messages.filter((m) => m.attachment), [messages]);

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await updateGroupChatPhoto(chat.id, formData);
      if (result?.error) {
        setPhotoError(result.error);
        return;
      }
      onChatUpdated(result);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setPhotoError(err.message ?? 'Failed to update photo');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-slate-700">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <GroupChatAvatar chat={chat} />
              {isEboard && (
                <>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    aria-label="Change group photo"
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow ring-2 ring-white hover:bg-blue-700 disabled:opacity-60 dark:ring-slate-900"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900 dark:text-slate-100">{chat.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {members.length} member{members.length === 1 ? '' : 's'}
              </p>
              {photoError && <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Tabs defaultValue="members" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-5 mt-3 grid grid-cols-2">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="attachments">Attachments ({attachments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
            <div className="space-y-1">
              {members.map((member) => (
                <div key={member.authentik_id} className="flex items-center justify-between gap-2 rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-slate-800">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      {member.authentik_id && (
                        <AvatarImage src={`/api/users/${member.authentik_id}/profile-picture/media`} alt={memberDisplayName(member)} />
                      )}
                      <AvatarFallback className="bg-blue-900 text-xs text-white">{memberInitials(member)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm text-gray-900 dark:text-slate-100">{memberDisplayName(member)}</span>
                  </div>
                  {isEboard && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(member.authentik_id)}
                      className="h-7 w-7 shrink-0 p-0 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {members.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No members yet.</p>}
            </div>

            {isEboard && (
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-slate-800">
                <BulkAddByGroupOrCommittee excludeIds={members.map((m) => m.authentik_id)} onAddMany={onAddMany} />
                {adding ? (
                  <AddMemberPicker
                    excludeIds={members.map((m) => m.authentik_id)}
                    onAdd={(member) => {
                      onAddMember(member);
                      setAdding(false);
                    }}
                    onCancel={() => setAdding(false)}
                  />
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)} className="gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" /> Add individually
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
            {attachments.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">No photos or files shared yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((message) => (
                  <AttachmentTile key={message.id} message={message} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function GroupChatThread({ chat, currentUserId, isEboard, onBack, onDeleted, onChatUpdated }) {
  const confirm = useConfirm();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (!draft.trim() && !attachedFile) return;

    setSending(true);
    try {
      const message = await sendGroupChatMessage(chat.id, { body: draft.trim(), file: attachedFile });
      setMessages((prev) => [...prev, message]);
      setDraft('');
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function handleReact(messageId, emoji) {
    try {
      const reactions = await toggleGroupChatReaction(chat.id, messageId, emoji);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to react');
    }
  }

  async function handleDeleteMessage(messageId) {
    if (!(await confirm('Delete this message? This cannot be undone.'))) return;
    try {
      await deleteGroupChatMessage(chat.id, messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete message');
    }
  }

  async function handleDeleteChat() {
    if (!(await confirm(`Delete "${chat.name}"? This cannot be undone.`))) return;
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

  // Adds a whole batch of members (from a group/committee bulk-add) in
  // parallel, then updates state once with whichever ones actually succeeded
  // — chapter-size member counts make this fine without a dedicated bulk
  // endpoint.
  async function handleAddMany(newMembers) {
    const results = await Promise.allSettled(
      newMembers.map((member) => addGroupChatMember(chat.id, member.id))
    );
    const added = newMembers.filter((_, i) => results[i].status === 'fulfilled');
    setMembers((prev) => [...prev, ...added.map((member) => ({ authentik_id: member.id, ...member }))]);

    const failed = results.some((r) => r.status === 'rejected');
    if (failed) {
      const err = results.find((r) => r.status === 'rejected')?.reason;
      if (isRedirectError(err)) throw err;
      window.alert('Some members could not be added.');
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
          <GroupChatAvatar chat={chat} className="h-9 w-9" />
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="min-w-0 rounded-md text-left transition-opacity hover:opacity-70"
          >
            <p className="truncate font-medium text-gray-900 dark:text-slate-100">{chat.name}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {members.length} member{members.length === 1 ? '' : 's'} · tap for info
            </p>
          </button>
        </div>
        {isEboard && (
          <div className="flex shrink-0 gap-1">
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

      {infoOpen && (
        <GroupChatInfoModal
          chat={chat}
          members={members}
          messages={messages}
          isEboard={isEboard}
          onAddMember={handleAddMember}
          onAddMany={handleAddMany}
          onRemoveMember={handleRemoveMember}
          onChatUpdated={onChatUpdated}
          onClose={() => setInfoOpen(false)}
        />
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
              <MessageBubble
                message={message}
                isMine={message.sender_id === currentUserId}
                attachmentUrl={message.attachment ? `/api/group-chats/${chat.id}/messages/${message.id}/attachment` : null}
                onReact={(emoji) => handleReact(message.id, emoji)}
                canDelete={message.sender_id === currentUserId || isEboard}
                onDelete={() => handleDeleteMessage(message.id)}
              />
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {attachedFile && (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs dark:border-slate-700">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-slate-300">{attachedFile.name}</span>
          <button type="button" onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-200 pt-3 dark:border-slate-700">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setAttachedFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 px-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input placeholder="Type a message..." value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit" disabled={(!draft.trim() && !attachedFile) || sending} className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function GroupChatsTab({ currentUserId, isEboard, initialGroupChatId }) {
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

  // Deep link from a committee's "Group Chat" button (?groupChat=<id>) —
  // jump straight into that chat once its data has loaded.
  useEffect(() => {
    if (!initialGroupChatId) return;
    const match = chats.find((c) => c.id === initialGroupChatId);
    if (match) setSelected(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGroupChatId, chats]);

  function handleCreated(chat) {
    setChats((prev) => [chat, ...prev]);
  }

  function handleDeleted(chatId) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setSelected(null);
  }

  // A photo change comes back as the full updated chat object — refresh it
  // both in the open thread and in the list, so the new photo shows up
  // immediately instead of waiting for the next poll.
  function handleChatUpdated(updatedChat) {
    setSelected(updatedChat);
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  }

  if (selected) {
    return (
      <GroupChatThread
        chat={selected}
        currentUserId={currentUserId}
        isEboard={isEboard}
        onBack={() => setSelected(null)}
        onDeleted={handleDeleted}
        onChatUpdated={handleChatUpdated}
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

function MessagesTab({ currentUserId, isEboard, initialWithId }) {
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
        isEboard={isEboard}
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
  const groupChatId = searchParams.get('groupChat');
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;
  const { dmCount, groupChatCount } = useUnreadCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-slate-100">Messages</h1>
        <p className="text-sm text-gray-600 sm:text-base dark:text-slate-400">
          Direct messages and group chats
        </p>
      </div>

      <Tabs defaultValue={groupChatId ? 'groups' : 'messages'} className="w-full min-w-0">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
          <TabsTrigger value="messages" className="min-w-0 gap-1.5 px-2 py-2 text-xs sm:text-sm">
            Messages
            {dmCount > 0 && <Badge className="h-5 min-w-5 justify-center bg-red-600 px-1 text-white">{dmCount > 99 ? '99+' : dmCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="groups" className="min-w-0 gap-1.5 px-2 py-2 text-xs sm:text-sm">
            Group Chats
            {groupChatCount > 0 && <Badge className="h-5 min-w-5 justify-center bg-red-600 px-1 text-white">{groupChatCount > 99 ? '99+' : groupChatCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <MessagesTab currentUserId={currentUserId} isEboard={isEboard} initialWithId={withId} />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <GroupChatsTab currentUserId={currentUserId} isEboard={isEboard} initialGroupChatId={groupChatId} />
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
