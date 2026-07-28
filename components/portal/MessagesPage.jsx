'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  X, ChevronLeft, Send, Paperclip, Search, Plus, Smile, Trash2, Users,
  ImageIcon, FileIcon, Download, Check, MessageSquare, ChevronDown, Info,
  UserMinus, AlertCircle, Loader2, Camera, Layers,
} from 'lucide-react';
import {
  getConversations, getConversation, sendMessage, markConversationRead, getMember,
  getGroupChats, createGroupChat, deleteGroupChat, updateGroupChatPhoto,
  getGroupChatMessages, sendGroupChatMessage, toggleGroupChatReaction, toggleMessageReaction,
  deleteMessage, deleteGroupChatMessage, markGroupChatRead, getGroupChatMembers,
  addGroupChatMember, removeGroupChatMember, getCommittees, getCommitteeMembers,
  getMemberDirectory,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials, formatMemberGroup, formatMessageTime, groupMatches } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useUnreadCounts } from '@/lib/use-unread-counts';
import ReportButton from './ReportButton';
import BlockButton from './BlockButton';
import ProfileActionsMenu from './ProfileActionsMenu';
import LegacyMessagesPage from './LegacyMessagesPage';

const ACCENT_THEMES = {
  blue: { base: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', light: '#1d4ed8', muted: 'rgba(30,58,138,0.10)' },
  red: { base: '#7f1d1d', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', light: '#991b1b', muted: 'rgba(127,29,29,0.10)' },
};

const QUICK_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🙏', '🔥'];
const ROLE_GROUPS = [
  { value: 'eboard', label: 'E-Board' },
  { value: 'chair', label: 'Chairs' },
  { value: 'active', label: 'Members' },
  { value: 'pledge', label: 'Pledges' },
  { value: 'alumni', label: 'Alumni' },
];

const GROUP_COLOR = { eboard: '#7f1d1d', chair: '#7e22ce', active: '#1d4ed8', pledge: '#15803d', alumni: '#b45309' };
const GROUP_BG = {
  eboard: 'rgba(127,29,29,0.10)', chair: 'rgba(126,34,206,0.10)', active: 'rgba(29,78,216,0.10)',
  pledge: 'rgba(21,128,61,0.10)', alumni: 'rgba(180,83,9,0.10)',
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

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

// ─── Shared atoms ───

function MemberAvatar({ member, size = 36, accent }) {
  const px = `${size}px`;
  const userId = member?.id ?? member?.authentik_id;
  return (
    <Avatar style={{ width: px, height: px }} className="shrink-0">
      {userId && <AvatarImage src={`/api/users/${userId}/profile-picture/media`} alt="" />}
      <AvatarFallback className="font-semibold text-white" style={{ background: accent.gradient, fontSize: size * 0.37 }}>
        {member ? memberInitials(member) : '?'}
      </AvatarFallback>
    </Avatar>
  );
}

function GroupChatAvatar({ chat, size = 36, accent }) {
  if (chat.photo_asset_id) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/group-chats/${chat.id}/photo/media`} alt={chat.name} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: tint(accent.base, 0.12) }}
    >
      <Users size={size * 0.44} style={{ color: accent.light }} />
    </div>
  );
}

function GroupBadge({ group }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: GROUP_BG[group] ?? 'var(--color-muted)', color: GROUP_COLOR[group] ?? 'var(--color-muted-foreground)' }}
    >
      {formatMemberGroup(group)}
    </span>
  );
}

function UnreadBadge({ count }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function AttachmentDisplay({ attachment, mediaUrl }) {
  if (attachment.kind === 'image') {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl} alt={attachment.filename ?? 'Attachment'} className="max-h-52 max-w-[240px] object-cover" />
      </a>
    );
  }
  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <FileIcon size={16} className="shrink-0 text-muted-foreground" />
      <span className="min-w-0">
        <p className="truncate font-medium text-foreground">{attachment.filename}</p>
        {attachment.size != null && <p className="text-[11px] text-muted-foreground">{formatFileSize(attachment.size)}</p>}
      </span>
      <Download size={13} className="ml-1 shrink-0 text-muted-foreground" />
    </a>
  );
}

function StagedAttachmentChip({ file, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 py-1.5 text-xs">
      {file.type.startsWith('image/') ? <ImageIcon size={12} className="shrink-0 text-muted-foreground" /> : <FileIcon size={12} className="shrink-0 text-muted-foreground" />}
      <span className="max-w-[140px] truncate text-foreground">{file.name}</span>
      <button type="button" onClick={onRemove} className="ml-0.5 text-muted-foreground hover:text-foreground" aria-label="Remove attachment">
        <X size={11} />
      </button>
    </div>
  );
}

function ReactionRow({ reactions, onToggle, accent }) {
  if (!reactions || reactions.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={cn(
            'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-all',
            r.reacted ? 'border-transparent font-semibold text-white' : 'border-border bg-card text-foreground hover:bg-muted',
          )}
          style={r.reacted ? { background: accent.gradient } : undefined}
          aria-pressed={r.reacted}
        >
          {r.emoji} <span>{r.count}</span>
        </button>
      ))}
    </div>
  );
}

function EmojiPickerPopover({ onPick, onClose, side }) {
  const ref = useRef(null);
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn('absolute bottom-full z-30 mb-1 flex gap-1 rounded-xl border border-border bg-card p-1.5 shadow-lg', side === 'right' ? 'right-0' : 'left-0')}
      role="dialog"
      aria-label="Pick reaction"
    >
      {QUICK_EMOJI.map((e) => (
        <button key={e} type="button" onClick={() => { onPick(e); onClose(); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-base transition-colors hover:bg-muted" aria-label={e}>
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Message bubble ───

function MessageBubble({ message, isMine, isEboard, accent, attachmentUrl, onReact, onDelete, reportContentType }) {
  const [hovered, setHovered] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const attachment = message.attachment;
  const canDelete = isMine || isEboard;

  return (
    <div
      className={cn('group my-1 flex flex-col', isMine ? 'items-end' : 'items-start')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmoji(false); }}
    >
      <div className={cn('relative flex max-w-[80%] items-end gap-1.5', isMine ? 'flex-row-reverse' : 'flex-row')}>
        <div
          className={cn('relative space-y-1.5 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm', isMine ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-muted text-foreground')}
          style={isMine ? { background: accent.gradient } : undefined}
        >
          {attachment && attachmentUrl && <AttachmentDisplay attachment={attachment} mediaUrl={attachmentUrl} />}
          {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
          <p className={cn('text-right text-[10px]', isMine ? 'text-white/70' : 'text-muted-foreground')}>
            {formatMessageTime(message.created_at)}
          </p>
        </div>

        {hovered && (
          <div className={cn('relative flex shrink-0 items-center gap-0.5', isMine ? 'flex-row-reverse' : 'flex-row')}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmoji((s) => !s)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                aria-label="Add reaction"
              >
                <Smile size={12} />
              </button>
              {showEmoji && <EmojiPickerPopover onPick={onReact} onClose={() => setShowEmoji(false)} side={isMine ? 'right' : 'left'} />}
            </div>
            {!isMine && (
              <ReportButton
                contentType={reportContentType}
                contentId={message.id}
                reportedUserId={message.sender_id}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive"
              />
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive"
                aria-label="Delete message"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className={cn('ml-1 mr-1', isMine ? 'flex justify-end' : '')}>
        <ReactionRow reactions={message.reactions} onToggle={onReact} accent={accent} />
      </div>
    </div>
  );
}

// ─── Composer ───

function Composer({ onSend, accent, disabled }) {
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  const canSend = (body.trim().length > 0 || !!file) && !disabled;

  function submit() {
    if (!canSend) return;
    onSend(body.trim(), file);
    setBody('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
    textRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      {file && (
        <div className="mb-2">
          <StagedAttachmentChip file={file} onRemove={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} />
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-0.5 shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Attach file"
          disabled={disabled}
        >
          <Paperclip size={16} />
        </button>
        <input ref={fileRef} type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} aria-hidden="true" />

        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textRef}
            rows={1}
            value={body}
            onChange={(e) => { setBody(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            className="max-h-[120px] w-full resize-none rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
            onFocus={(e) => { e.currentTarget.style.borderColor = tint(accent.base, 0.4); }}
            onBlur={(e) => { e.currentTarget.style.borderColor = ''; }}
            disabled={disabled}
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          className="mb-0.5 shrink-0 rounded-xl p-2 text-white transition-opacity disabled:opacity-30"
          style={{ background: accent.gradient }}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── New DM member picker ───

function MemberPickerModal({ accent, onSelect, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => { if (isRedirectError(err)) throw err; })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q) || m.username?.toLowerCase().includes(q));
  }, [members, query]);

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="New message">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent.gradient }}>
              <MessageSquare size={14} strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-foreground">New Message</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="w-full rounded-lg border border-border bg-muted/40 py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">Loading members…</p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">No members found</p>
          ) : (
            filtered.map((m) => (
              <button key={m.id} type="button" onClick={() => onSelect(m)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60">
                <MemberAvatar member={m} size={32} accent={accent} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{memberDisplayName(m)}</p>
                  {m.username && <p className="text-[11px] text-muted-foreground">@{m.username}</p>}
                </div>
                <GroupBadge group={m.memberGroup} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DM list + thread ───

function ConversationList({ conversations, currentUserId, accent, onSelect, onNewMessage }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
        <p className="text-sm font-semibold text-foreground">Direct Messages</p>
        <button type="button" onClick={onNewMessage} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80" style={{ background: accent.gradient }}>
          <Plus size={12} /> New Message
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <MessageSquare size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No conversations yet</p>
          <button type="button" onClick={onNewMessage} className="mt-1 text-xs font-semibold transition-opacity hover:opacity-75" style={{ color: accent.light }}>
            Start one
          </button>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto" role="list">
          {conversations.map((c) => {
            const lastMessage = c.last_message;
            const isMine = lastMessage?.sender_id === currentUserId;
            const preview = lastMessagePreview(lastMessage, isMine);
            return (
              <li key={c.authentik_id}>
                <button type="button" onClick={() => onSelect(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50" aria-label={`Conversation with ${memberDisplayName(c)}`}>
                  <MemberAvatar member={c} size={40} accent={accent} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate text-sm', c.unread_count > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground')}>{memberDisplayName(c)}</p>
                      {lastMessage?.created_at && <span className="shrink-0 text-[11px] text-muted-foreground">{formatMessageTime(lastMessage.created_at)}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className={cn('min-w-0 flex-1 truncate text-xs', c.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                        {preview || <span className="italic">No messages yet</span>}
                      </p>
                      <UnreadBadge count={c.unread_count} />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DMThread({ conversation, currentUserId, isEboard, accent, onBack }) {
  const confirm = useConfirm();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getConversation(conversation.authentik_id)
        .then((data) => { if (!cancelled) setMessages(data); })
        .catch((err) => { if (isRedirectError(err)) throw err; if (!cancelled) setError(err.message ?? 'Could not load messages'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    load();
    markConversationRead(conversation.authentik_id).catch((err) => { if (isRedirectError(err)) throw err; });
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [conversation.authentik_id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  async function handleSend(body, file) {
    try {
      const message = await sendMessage(conversation.authentik_id, { body, file });
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to send message');
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

  async function handleDelete(messageId) {
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3" style={{ background: tint(accent.base, 0.03) }}>
        <button type="button" onClick={onBack} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Back to conversations">
          <ChevronLeft size={16} />
        </button>
        <MemberAvatar member={conversation} size={32} accent={accent} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{memberDisplayName(conversation)}</p>
          {conversation.username && <p className="text-[11px] text-muted-foreground">@{conversation.username}</p>}
        </div>
        <BlockButton userId={conversation.authentik_id} size="sm" onStatusChange={setIsBlocked} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: tint(accent.base, 0.10) }}>
              <MessageSquare size={18} style={{ color: accent.light }} />
            </div>
            <p className="text-sm text-muted-foreground">Start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isMine={message.sender_id === currentUserId}
              isEboard={isEboard}
              accent={accent}
              attachmentUrl={message.attachment ? `/api/messages/${message.id}/attachment` : null}
              onReact={(emoji) => handleReact(message.id, emoji)}
              onDelete={() => handleDelete(message.id)}
              reportContentType="message"
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {isBlocked ? (
        <div className="border-t border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
          You've blocked this member. Unblock them above to send messages.
        </div>
      ) : (
        <Composer onSend={handleSend} accent={accent} />
      )}
    </div>
  );
}

// ─── Group chat list + thread ───

function GroupChatList({ chats, currentUserId, accent, isEboard, onSelect, onNewChat }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
        <p className="text-sm font-semibold text-foreground">Group Chats</p>
        {isEboard && (
          <button type="button" onClick={onNewChat} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80" style={{ background: accent.gradient }}>
            <Plus size={12} /> New Group Chat
          </button>
        )}
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <Users size={28} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No group chats yet</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto" role="list">
          {chats.map((c) => {
            const lastMessage = c.last_message;
            const isMine = lastMessage?.sender_id === currentUserId;
            const preview = lastMessagePreview(lastMessage, isMine);
            return (
              <li key={c.id}>
                <button type="button" onClick={() => onSelect(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50" aria-label={`Group chat: ${c.name}`}>
                  <GroupChatAvatar chat={c} size={40} accent={accent} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate text-sm', c.unread_count > 0 ? 'font-semibold' : 'font-medium', 'text-foreground')}>{c.name}</p>
                      {lastMessage?.created_at && <span className="shrink-0 text-[11px] text-muted-foreground">{formatMessageTime(lastMessage.created_at)}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className={cn('min-w-0 flex-1 truncate text-xs', c.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                        {preview || <span className="italic">No messages yet</span>}
                      </p>
                      <UnreadBadge count={c.unread_count} />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Lets eboard pull in a whole slice of the chapter at once — by Authentik
// role group or by committee — instead of adding people one at a time.
function BulkAddByGroupOrCommittee({ excludeIds, accent, onAddMany }) {
  const [members, setMembers] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMemberDirectory().then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; });
    getCommittees().then(setCommittees).catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  function toggleGroup(value) {
    setSelectedGroups((prev) => { const next = new Set(prev); next.has(value) ? next.delete(value) : next.add(value); return next; });
  }

  const groupMatches_ = members.filter((m) => [...selectedGroups].some((g) => groupMatches(m.memberGroup, g)) && !excludeIds.includes(m.id));

  async function handleAddGroups() {
    if (groupMatches_.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await onAddMany(groupMatches_);
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
      const matches = committeeMembers.filter((m) => !excludeIds.includes(m.authentik_id)).map((m) => ({ id: m.authentik_id, ...m }));
      await onAddMany(matches);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to add committee members');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Layers size={13} /> Add by group
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ROLE_GROUPS.map((g) => {
          const active = selectedGroups.has(g.value);
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => toggleGroup(g.value)}
              className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all', active ? 'border-transparent text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground')}
              style={active ? { background: accent.gradient } : undefined}
            >
              {g.label}
            </button>
          );
        })}
      </div>
      {selectedGroups.size > 0 && (
        <button type="button" disabled={busy || groupMatches_.length === 0} onClick={handleAddGroups} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50">
          {busy ? 'Adding…' : `+ Add ${groupMatches_.length} member${groupMatches_.length === 1 ? '' : 's'}`}
        </button>
      )}
      {committees.length > 0 && (
        <div className="relative">
          <select
            value=""
            disabled={busy}
            onChange={(e) => handleAddCommittee(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-xs text-muted-foreground focus:outline-none"
          >
            <option value="">+ Add all members from a committee…</option>
            {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function AddMemberPicker({ excludeIds, accent, onAdd }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getMemberDirectory().then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => !excludeIds.includes(m.id)).filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q)).slice(0, 30);
  }, [members, query, excludeIds]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-lg border border-border bg-muted/40 py-1.5 pl-7 pr-3 text-xs focus:outline-none"
        />
      </div>
      {loading ? (
        <p className="py-4 text-center text-xs text-muted-foreground">Loading…</p>
      ) : (
        <div className="max-h-36 overflow-y-auto rounded-xl border border-border">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No matches.</p>
          ) : (
            filtered.map((m) => (
              <button key={m.id} type="button" onClick={() => onAdd(m)} className="flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/40">
                <MemberAvatar member={m} size={24} accent={accent} />
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{memberDisplayName(m)}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MemberChip({ member, selected, accent, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(member.id)}
      className={cn(
        'flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 transition-colors',
        selected ? 'bg-muted/60' : 'hover:bg-muted/40',
      )}
    >
      <div className="relative">
        <MemberAvatar member={member} size={28} accent={accent} />
        {selected && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white" style={{ background: accent.base }}>
            <Check size={8} strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{memberDisplayName(member)}</p>
      </div>
      <GroupBadge group={member.memberGroup} />
    </button>
  );
}

function NewGroupChatModal({ accent, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [committees, setCommittees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMemberDirectory().then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; }).finally(() => setLoadingMembers(false));
    getCommittees().then(setCommittees).catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q)).slice(0, 40);
  }, [members, query]);

  function toggleMember(id) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function handleImportGroup(groupValue) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      members.filter((m) => groupMatches(m.memberGroup, groupValue)).forEach((m) => next.add(m.id));
      return next;
    });
  }

  async function handleImportCommittee(committeeId) {
    if (!committeeId) return;
    try {
      const committeeMembers = await getCommitteeMembers(committeeId);
      setSelectedIds((prev) => { const next = new Set(prev); committeeMembers.forEach((m) => next.add(m.authentik_id)); return next; });
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to import committee members');
    }
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(name.trim(), [...selectedIds]);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create group chat');
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const canCreate = name.trim().length > 0 && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="New group chat">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent.gradient }}>
              <Users size={14} strokeWidth={1.75} />
            </div>
            <p className="text-sm font-semibold text-foreground">New Group Chat</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chat Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fall 2026 Pledges"
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Add by Role</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_GROUPS.map((g) => (
                <button key={g.value} type="button" onClick={() => handleImportGroup(g.value)} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:text-foreground">
                  + {g.label}
                </button>
              ))}
            </div>
          </div>

          {committees.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add by Committee</p>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-muted-foreground focus:outline-none"
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) handleImportCommittee(e.target.value); }}
                >
                  <option value="" disabled>Select a committee…</option>
                  {committees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add Individually
              {selectedIds.size > 0 && (
                <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: accent.base }}>{selectedIds.size}</span>
              )}
            </p>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-border bg-muted/40 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
              />
            </div>
            {loadingMembers ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading members…</p>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No matches.</p>
                ) : (
                  filtered.map((m) => (
                    <MemberChip key={m.id} member={m} selected={selectedIds.has(m.id)} accent={accent} onToggle={toggleMember} />
                  ))
                )}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">{selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={!canCreate} className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40" style={{ background: accent.gradient }}>
              {submitting ? 'Creating…' : 'Create Chat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttachmentTile({ message, chatId }) {
  const attachment = message.attachment;
  const mediaUrl = `/api/group-chats/${chatId}/messages/${message.id}/attachment`;

  if (attachment.kind === 'image') {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl} alt={attachment.filename ?? 'Attachment'} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      </a>
    );
  }
  return (
    <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 p-3 text-center transition-colors hover:bg-muted">
      <FileIcon size={20} className="text-muted-foreground" />
      <p className="line-clamp-2 text-[10px] font-medium text-foreground">{attachment.filename}</p>
      <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
    </a>
  );
}

function GroupChatInfoModal({ chat, members, messages, isEboard, accent, onAddMember, onAddMany, onRemoveMember, onChatUpdated, onClose }) {
  const [tab, setTab] = useState('members');
  const [adding, setAdding] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const photoRef = useRef(null);
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
      if (result?.error) { setPhotoError(result.error); return; }
      onChatUpdated(result);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setPhotoError(err.message ?? 'Failed to update photo');
    } finally {
      setUploadingPhoto(false);
      if (photoRef.current) photoRef.current.value = '';
    }
  }

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Group chat info">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="h-16 w-full" style={{ background: accent.gradient }} aria-hidden="true" />
        <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30" aria-label="Close">
          <X size={13} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center px-5 pb-4">
          <div className="relative -mt-8 mb-2">
            <GroupChatAvatar chat={chat} size={64} accent={accent} />
            {isEboard && (
              <>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                  aria-label="Change group photo"
                >
                  <Camera size={18} className="text-white" />
                </button>
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoSelected} />
              </>
            )}
          </div>
          <h2 className="text-center text-lg font-bold tracking-tight text-foreground">{chat.name}</h2>
          <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          {photoError && <p className="text-xs text-destructive">{photoError}</p>}
        </div>

        <div className="flex border-b border-border px-5">
          {['members', 'attachments'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn('relative flex-1 pb-3 pt-1 text-xs font-semibold capitalize transition-colors', tab === t ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
              role="tab"
              aria-selected={tab === t}
            >
              {t === 'attachments' ? `Attachments (${attachments.length})` : t}
              {tab === t && <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-0.5 rounded-full" style={{ background: accent.base }} />}
            </button>
          ))}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {tab === 'members' && (
            <div>
              {members.map((m) => (
                <div key={m.authentik_id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                  <ProfileActionsMenu userId={m.authentik_id}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <MemberAvatar member={{ id: m.authentik_id, ...m }} size={30} accent={accent} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{memberDisplayName(m)}</p>
                      </div>
                    </div>
                  </ProfileActionsMenu>
                  <GroupBadge group={m.memberGroup ?? m.member_group} />
                  {isEboard && (
                    <button type="button" onClick={() => onRemoveMember(m.authentik_id)} className="ml-1 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${memberDisplayName(m)}`}>
                      <UserMinus size={12} />
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No members yet.</p>}

              {isEboard && (
                <div className="space-y-3 border-t border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Members</p>
                  <BulkAddByGroupOrCommittee excludeIds={members.map((m) => m.authentik_id)} accent={accent} onAddMany={onAddMany} />
                  {adding ? (
                    <AddMemberPicker excludeIds={members.map((m) => m.authentik_id)} accent={accent} onAdd={(m) => { onAddMember(m); setAdding(false); }} />
                  ) : (
                    <button type="button" onClick={() => setAdding(true)} className="w-full rounded-lg border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted">
                      + Add individually
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'attachments' && (
            <div className="p-4">
              {attachments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No photos or files shared yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {attachments.map((m) => <AttachmentTile key={m.id} message={m} chatId={chat.id} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupChatThread({ chat, currentUserId, isEboard, accent, onBack, onDeleted, onChatUpdated }) {
  const confirm = useConfirm();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getGroupChatMessages(chat.id)
        .then((data) => { if (!cancelled) setMessages(data); })
        .catch((err) => { if (isRedirectError(err)) throw err; if (!cancelled) setError(err.message ?? 'Could not load messages'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    load();
    markGroupChatRead(chat.id).catch((err) => { if (isRedirectError(err)) throw err; });
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [chat.id]);

  useEffect(() => {
    getGroupChatMembers(chat.id).then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; });
  }, [chat.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  function senderName(senderId) {
    if (senderId === currentUserId) return 'You';
    const member = members.find((m) => m.authentik_id === senderId);
    return member ? memberDisplayName(member) : 'Member';
  }

  async function handleSend(body, file) {
    try {
      const message = await sendGroupChatMessage(chat.id, { body, file });
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to send message');
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

  async function handleDelete(messageId) {
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

  async function handleAddMany(newMembers) {
    const results = await Promise.allSettled(newMembers.map((member) => addGroupChatMember(chat.id, member.id)));
    const added = newMembers.filter((_, i) => results[i].status === 'fulfilled');
    setMembers((prev) => [...prev, ...added.map((member) => ({ authentik_id: member.id, ...member }))]);
    if (results.some((r) => r.status === 'rejected')) {
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3" style={{ background: tint(accent.base, 0.03) }}>
        <button type="button" onClick={onBack} className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Back">
          <ChevronLeft size={16} />
        </button>
        <GroupChatAvatar chat={chat} size={32} accent={accent} />
        <button type="button" onClick={() => setInfoOpen(true)} className="min-w-0 flex-1 text-left" aria-label="Chat info">
          <p className="truncate text-sm font-semibold text-foreground hover:underline">{chat.name}</p>
          <p className="text-[11px] text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''} · tap for info</p>
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setInfoOpen(true)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Chat info">
            <Info size={15} />
          </button>
          {isEboard && (
            <button type="button" onClick={handleDeleteChat} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Delete chat">
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {infoOpen && (
        <GroupChatInfoModal
          chat={chat}
          members={members}
          messages={messages}
          isEboard={isEboard}
          accent={accent}
          onAddMember={handleAddMember}
          onAddMany={handleAddMany}
          onRemoveMember={handleRemoveMember}
          onChatUpdated={onChatUpdated}
          onClose={() => setInfoOpen(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: tint(accent.base, 0.10) }}>
              <Users size={18} style={{ color: accent.light }} />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === currentUserId;
            return (
              <div key={message.id}>
                {!isMine && (
                  <ProfileActionsMenu userId={message.sender_id}>
                    <p className="mb-0.5 ml-1 text-[11px] font-semibold hover:underline" style={{ color: accent.light }}>{senderName(message.sender_id)}</p>
                  </ProfileActionsMenu>
                )}
                <MessageBubble
                  message={message}
                  isMine={isMine}
                  isEboard={isEboard}
                  accent={accent}
                  attachmentUrl={message.attachment ? `/api/group-chats/${chat.id}/messages/${message.id}/attachment` : null}
                  onReact={(emoji) => handleReact(message.id, emoji)}
                  onDelete={() => handleDelete(message.id)}
                  reportContentType="group_message"
                />
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={handleSend} accent={accent} />
    </div>
  );
}

// ─── Tabs shells (own their data + polling, matching the rest of the app) ───

function MessagesTab({ currentUserId, isEboard, accent, initialWithId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getConversations()
        .then((data) => { if (!cancelled) setConversations(data); })
        .catch((err) => { if (isRedirectError(err)) throw err; if (!cancelled) setError(err.message ?? 'Could not load conversations'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    load();
    const interval = setInterval(load, 7000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!initialWithId) return;
    getMember(initialWithId)
      .then((member) => setSelected({ authentik_id: initialWithId, ...member }))
      .catch((err) => { if (isRedirectError(err)) throw err; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWithId]);

  function handleNewDM(member) {
    setShowNewMessage(false);
    setSelected({ authentik_id: member.id, ...member });
  }

  return (
    <>
      {selected ? (
        <DMThread conversation={selected} currentUserId={currentUserId} isEboard={isEboard} accent={accent} onBack={() => setSelected(null)} />
      ) : loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 size={22} className="animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <AlertCircle size={22} className="text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <ConversationList conversations={conversations} currentUserId={currentUserId} accent={accent} onSelect={setSelected} onNewMessage={() => setShowNewMessage(true)} />
      )}

      {showNewMessage && <MemberPickerModal accent={accent} onSelect={handleNewDM} onClose={() => setShowNewMessage(false)} />}
    </>
  );
}

function GroupChatsTab({ currentUserId, isEboard, accent, initialGroupChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNewGC, setShowNewGC] = useState(false);

  useEffect(() => {
    let cancelled = false;
    function load() {
      getGroupChats()
        .then((data) => { if (!cancelled) setChats(data); })
        .catch((err) => { if (isRedirectError(err)) throw err; if (!cancelled) setError(err.message ?? 'Could not load group chats'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    load();
    const interval = setInterval(load, 7000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!initialGroupChatId) return;
    const match = chats.find((c) => c.id === initialGroupChatId);
    if (match) setSelected(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialGroupChatId, chats]);

  function handleDeleted(chatId) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setSelected(null);
  }

  function handleChatUpdated(updatedChat) {
    setSelected(updatedChat);
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  }

  async function handleCreate(name, memberIds) {
    const chat = await createGroupChat({ name, memberIds });
    setChats((prev) => [chat, ...prev]);
    setShowNewGC(false);
  }

  return (
    <>
      {selected ? (
        <GroupChatThread chat={selected} currentUserId={currentUserId} isEboard={isEboard} accent={accent} onBack={() => setSelected(null)} onDeleted={handleDeleted} onChatUpdated={handleChatUpdated} />
      ) : loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 size={22} className="animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <AlertCircle size={22} className="text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : (
        <GroupChatList chats={chats} currentUserId={currentUserId} accent={accent} isEboard={isEboard} onSelect={setSelected} onNewChat={() => setShowNewGC(true)} />
      )}

      {showNewGC && <NewGroupChatModal accent={accent} onClose={() => setShowNewGC(false)} onCreate={handleCreate} />}
    </>
  );
}

// ─── Main revamped page ───

function RevampedMessagesContent({ accentKey }) {
  const accent = ACCENT_THEMES[accentKey] ?? ACCENT_THEMES.blue;
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const withId = searchParams.get('with');
  const groupChatId = searchParams.get('groupChat');
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;
  const { dmCount, groupChatCount } = useUnreadCounts();

  const [activeTab, setActiveTab] = useState(groupChatId ? 'groups' : 'messages');

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Chapter Overview</p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Messages</h1>
        <p className="text-sm text-muted-foreground">Direct messages and group chats</p>
      </div>

      <div className="relative flex items-center gap-1 border-b border-border">
        {[
          { id: 'messages', label: 'Messages', unread: dmCount },
          { id: 'groups', label: 'Group Chats', unread: groupChatCount },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn('relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
              role="tab"
              aria-selected={isActive}
            >
              {tab.label}
              {tab.unread > 0 && <UnreadBadge count={tab.unread} />}
              {isActive && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: accent.base }} />}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" style={{ height: 600 }}>
        {activeTab === 'messages' && (
          <MessagesTab currentUserId={currentUserId} isEboard={isEboard} accent={accent} initialWithId={withId} />
        )}
        {activeTab === 'groups' && (
          <GroupChatsTab currentUserId={currentUserId} isEboard={isEboard} accent={accent} initialGroupChatId={groupChatId} />
        )}
      </div>
    </div>
  );
}

export default function MessagesPage({ accent }) {
  if (accent !== 'blue' && accent !== 'red') {
    return <LegacyMessagesPage />;
  }
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>}>
      <RevampedMessagesContent accentKey={accent} />
    </Suspense>
  );
}
