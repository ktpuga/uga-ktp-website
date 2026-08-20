'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  X, ChevronLeft, Send, Paperclip, Search, Plus, Smile, Trash2, Users,
  ImageIcon, FileIcon, Download, Check, MessageSquare, ChevronDown, Info,
  UserMinus, AlertCircle, Loader2, Camera, Layers, Eye, Pencil,
} from 'lucide-react';
import {
  getConversations, getConversation, sendMessage, markConversationRead, getMember,
  getGroupChats, createGroupChat, deleteGroupChat, updateGroupChatPhoto, setGroupChatAudience,
  getGroupChatMessages, sendGroupChatMessage, toggleGroupChatReaction, toggleMessageReaction,
  deleteMessage, deleteGroupChatMessage, markGroupChatRead, getGroupChatMembers,
  addGroupChatMember, removeGroupChatMember, getCommittees, getCommitteeMembers,
  getMessageableMembers, getAllGroupChats, createMemberGroupChat, leaveGroupChat,
  renameGroupChat,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials, formatMemberGroup, formatMessageTime, groupMatches, MEMBER_GROUP_ORDER } from '@/lib/portal-format';
import { profilePictureSrc, avatarAssetId } from '@/lib/avatar';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useUnreadCounts } from '@/lib/use-unread-counts';
import ReportButton from './ReportButton';
import AudienceSelect from './AudienceSelect';
import BlockButton from './BlockButton';
import ProfileActionsMenu from './ProfileActionsMenu';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { PALETTES } from '@/components/portal/PortalAccentContext';

// Palette comes from PortalAccentContext, the single source of truth. Each of
// these files used to carry its own ACCENT_THEMES copy; they had already
// drifted (MemberDirectory was missing 'red' entirely, and every copy still
// had a real teal that nothing rendered — pledge passes 'blue').

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

// ─── Who may do what to a chat ───
//
// Both of these mirror the API deliberately, and neither is the authority: the
// server re-checks every one of these calls. They exist so the UI doesn't offer
// a button that is guaranteed to 403.

// Mirrors canAdminister in groupChatsController. An official chat is eboard's;
// a member-created one belongs to whoever made it, and eboard is deliberately
// NOT its administrator — they cannot even read one without an open report, so
// letting them delete or repopulate it would be the larger power.
function canAdministerChat(chat, { isEboard, currentUserId }) {
  if (!chat) return false;
  if (chat.is_member_created) return chat.created_by === currentUserId;
  return isEboard;
}

// Mirrors requireGroup on POST /group-chats/member. A POSITIVE list, never
// "not rush": an accepted rushee keeps the rush group in Authentik until
// somebody removes it (see the API's constants/roleGroups.js), so an exclusion
// test would lock real pledges and actives out for as long as that stale group
// lingers. Matching on ANY of these is what makes ['rush','pledge'] a pledge.
const CHAT_CREATOR_GROUPS = ['eboard', 'chair', 'active', 'alumni', 'pledge'];

// ⇢ TEMPORARILY DISABLED for everyone except eboard. Flip to true to re-enable.
// Must be flipped together with MEMBER_CHAT_CREATION_ENABLED in ktp-api's
// routes/groupChats.js — this only hides the button, that one closes the route.
// Eboard keeps the button because theirs creates OFFICIAL chapter chats, which
// is a different endpoint (POST /group-chats) and is not being turned off.
const MEMBER_CHAT_CREATION_ENABLED = false;

function canCreateChats(groups) {
  const list = groups ?? [];
  if (!MEMBER_CHAT_CREATION_ENABLED) return list.includes('eboard');
  return list.some((g) => CHAT_CREATOR_GROUPS.includes(g));
}

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
  const [err, setErr] = useState(false);
  const userId = member?.id ?? member?.authentik_id;
  return (
    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
      {userId && !err ? (
        <img
          src={profilePictureSrc(userId, avatarAssetId(member))}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div
          className="flex h-full w-full select-none items-center justify-center font-semibold text-white"
          style={{ background: accent.gradient, fontSize: size * 0.37 }}
        >
          {member ? memberInitials(member) : '?'}
        </div>
      )}
    </div>
  );
}

function GroupChatAvatar({ chat, size = 36, accent }) {
  // Keyed by asset id, not a boolean: otherwise a photo that failed to load
  // once would keep showing the fallback icon even after a new one is uploaded.
  const [erroredAssetId, setErroredAssetId] = useState(null);
  const failed = erroredAssetId != null && erroredAssetId === chat.photo_asset_id;

  if (chat.photo_asset_id && !failed) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // `?v=` is NOT cosmetic. Uploading a new photo creates a brand new
          // Immich asset, but this route's URL was previously identical before
          // and after, and the media proxy forwards no Cache-Control — so the
          // browser served the cached OLD image and the avatar appeared not to
          // change at all. Keying on the asset id means the URL changes exactly
          // when the picture does, for every viewer and not just the uploader.
          // ProfileForm solves the same problem the same way.
          src={`/api/group-chats/${chat.id}/photo/media?v=${chat.photo_asset_id}`}
          alt={chat.name}
          // Explicit dimensions match MemberAvatar and stop the image briefly
          // rendering at its natural size before CSS lands.
          width={size}
          height={size}
          className="h-full w-full object-cover"
          // Falls back to the icon below rather than a broken-image glyph —
          // the same onError pattern every other avatar here uses.
          onError={() => setErroredAssetId(chat.photo_asset_id)}
        />
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
            {/* Report and block sit side by side so blocking is reachable from
                any message, not just from the DM header or the directory. */}
            {!isMine && (
              <>
                <ReportButton
                  contentType={reportContentType}
                  contentId={message.id}
                  reportedUserId={message.sender_id}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive"
                />
                <BlockButton
                  userId={message.sender_id}
                  iconOnly
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-destructive"
                />
              </>
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
            maxLength={TEXT_LIMITS.MESSAGE}
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
    getMessageableMembers()
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

function GroupChatList({ chats, currentUserId, accent, canCreate, onSelect, onNewChat }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
        <p className="text-sm font-semibold text-foreground">Group Chats</p>
        {canCreate && onNewChat && (
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

// Edits which groups and committees a chat follows, after it was created.
//
// Saving takes effect for everyone immediately: membership is derived at read
// time, so nobody needs backfilling and anyone who no longer matches drops out
// on their next request. Individually-added members are untouched — narrowing
// an audience must not evict a guest who was deliberately invited.
function ChatAudienceEditor({ chat, accent, onChatUpdated }) {
  const [committees, setCommittees] = useState([]);
  const [audience, setAudience] = useState(chat.audience ?? []);
  const [committeeIds, setCommitteeIds] = useState((chat.committee_ids ?? []).map(String));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCommittees().then(setCommittees).catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  const dirty =
    JSON.stringify([...audience].sort()) !== JSON.stringify([...(chat.audience ?? [])].sort())
    || JSON.stringify([...committeeIds].sort()) !== JSON.stringify([...(chat.committee_ids ?? []).map(String)].sort());

  // setGroupChatAudience returns { chat } / { error } rather than throwing, so
  // the API's own sentence survives production. The 4xx messages on this route
  // are all ones a person has to read to act on ("Chats you create are limited
  // to the people you add", "The Eboard chat follows the eboard group
  // automatically"), and every one of them used to arrive as React #441.
  //
  // The try/catch stays as a backstop for the redirect a 401 throws, which must
  // propagate rather than be reported as a save failure.
  async function save() {
    setSaving(true);
    setError(null);
    try {
      const result = await setGroupChatAudience(chat.id, { audience, committeeIds });
      if (result?.error) {
        setError(result.error);
        return;
      }
      onChatUpdated?.(result.chat);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not update who is in this chat.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Groups &amp; committees</p>
      <AudienceSelect value={audience} onChange={setAudience} />

      {committees.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-3">
          {committees.map((c) => {
            const selected = committeeIds.includes(String(c.id));
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCommitteeIds((prev) => (
                  prev.includes(String(c.id)) ? prev.filter((x) => x !== String(c.id)) : [...prev, String(c.id)]
                ))}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  selected
                    ? 'border-transparent text-white'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
                style={selected ? { background: accent.gradient } : undefined}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="text-[11px] text-destructive">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={!dirty || saving}
        className="w-full rounded-lg py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ background: accent.gradient }}
      >
        {saving ? 'Saving…' : saved ? 'Saved' : dirty ? 'Save membership' : 'No changes'}
      </button>
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
    getMessageableMembers().then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; });
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
    getMessageableMembers().then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; }).finally(() => setLoading(false));
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

// `isEboard` decides whether the OFFICIAL/PERSONAL choice appears at all.
// Everyone else only ever makes a personal chat, so they are shown no choice
// rather than a disabled control explaining a power they don't have.
function NewGroupChatModal({ accent, isEboard, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [committees, setCommittees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [audience, setAudience] = useState([]);
  const [committeeIds, setCommitteeIds] = useState([]);
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // Eboard defaults to official — that is what the button meant before this
  // existed, and defaulting the other way would quietly turn chapter chats into
  // private ones that oversight can't see.
  const [official, setOfficial] = useState(isEboard);

  useEffect(() => {
    getMessageableMembers().then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; }).finally(() => setLoadingMembers(false));
    getCommittees().then(setCommittees).catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q)).slice(0, 40);
  }, [members, query]);

  function toggleMember(id) {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleCommittee(id) {
    setCommitteeIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // A personal chat sends neither list. Passing empty arrays rather than
      // whatever happens to be in state matters: switching to Personal after
      // ticking a group would otherwise silently create a chapter-wide chat.
      const message = official
        ? await onCreate(name.trim(), [...selectedIds], audience, committeeIds, true)
        : await onCreate(name.trim(), [...selectedIds], [], [], false);
      if (message) {
        setError(message);
        setSubmitting(false);
      }
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

  // Mirrors the backend's 400: a chat with no groups, no committees and no
  // individuals would have exactly one member (the creator, auto-added).
  // A personal chat has only the individual list to satisfy it.
  const hasTarget = official
    ? selectedIds.size > 0 || audience.length > 0 || committeeIds.length > 0
    : selectedIds.size > 0;
  const canCreate = name.trim().length > 0 && hasTarget && !submitting;

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
          {/* Hidden while creation is off, or eboard would still be offered
              "Personal chat" and get a 403 from the now-closed route. With it
              hidden, `official` stays at its eboard default of true. */}
          {isEboard && MEMBER_CHAT_CREATION_ENABLED && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kind of chat</p>
              <div className="flex gap-2">
                {[
                  { value: true, label: 'Chapter chat' },
                  { value: false, label: 'Personal chat' },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => setOfficial(option.value)}
                    aria-pressed={official === option.value}
                    className={cn(
                      'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-150',
                      official === option.value
                        ? 'border-transparent text-white'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                    style={official === option.value ? { background: accent.gradient } : undefined}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {official
                  ? 'An official chapter space. Other eboard members can see it in chapter oversight.'
                  : 'Private to the people you add. Eboard cannot read it unless someone reports a message in it.'}
              </p>
            </div>
          )}

          {/* Eboard gets this as the caption under their Chapter/Personal
              choice. Everyone else has no choice to caption, so the privacy
              rule is stated on its own. It is the whole point of the feature,
              and it is not guessable: a member has no reason to assume eboard
              can't read their chat, or that reporting a message changes that. */}
          {!isEboard && (
            <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
              This chat is private to the people you add. Eboard can&apos;t read it unless
              someone reports a message in it.
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chat Name</label>
            <input
              autoFocus
              type="text"
              maxLength={TEXT_LIMITS.NAME}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fall 2026 Pledges"
              className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
            />
          </div>

          {/* Groups and committees are LIVE membership, not a one-time import.
              These used to expand into a fixed list of user ids, which meant a
              pledge promoted to active silently stayed in the pledge chat and
              never appeared in the actives chat. Stored as the chat's audience
              instead, so membership follows the person's current role. */}
          {official && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Groups</p>
              <AudienceSelect value={audience} onChange={setAudience} />
            </div>
          )}

          {official && committees.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Committees</p>
              <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-3">
                {committees.map((c) => {
                  const selected = committeeIds.includes(String(c.id));
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCommittee(String(c.id))}
                      aria-pressed={selected}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                        selected
                          ? 'border-transparent text-white'
                          : 'border-border bg-card text-muted-foreground hover:border-transparent hover:text-foreground',
                      )}
                      style={selected ? { background: accent.gradient } : undefined}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Anyone who joins the committee later is added to this chat automatically.
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {official ? 'Add Individually' : 'Who is in it'}
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

// `canAdminister` is per-chat (see canAdministerChat); `isEboard` survives only
// for the audience editor, which is an official-chat concept a member-created
// chat must never show — the API 409s it even for the creator.
function GroupChatInfoModal({ chat, members, messages, isEboard, canAdminister, currentUserId, readOnly, accent, onAddMember, onAddMany, onRemoveMember, onChatUpdated, onLeave, onClose }) {
  const [tab, setTab] = useState('members');
  const [adding, setAdding] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(chat.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);
  const photoRef = useRef(null);
  const attachments = useMemo(() => messages.filter((m) => m.attachment), [messages]);

  // Every condition here mirrors a refusal in leaveGroupChat, so the button
  // only appears when it will actually work:
  //
  //   readOnly           you're viewing this through eboard oversight, not in it
  //   my own row missing you belong via the audience, so there is no row to
  //                      delete and leaving would silently do nothing
  //   creator            nobody else could administer the chat afterwards
  //
  // The auto-managed Eboard chat used to be a fourth condition here. It is
  // gone: that chat is now an ordinary group chat, so it is left, renamed and
  // deleted like any other. See migration 1788800000000.
  const myRow = members.find((m) => m.authentik_id === currentUserId);
  const isCreatorOfOwnChat = chat.is_member_created && chat.created_by === currentUserId;
  const canLeave = !readOnly && Boolean(myRow) && !myRow?.is_auto && !isCreatorOfOwnChat;

  async function handleLeave() {
    setLeaving(true);
    setLeaveError(null);
    const result = await onLeave();
    // Only reached when it failed; a success unmounts this modal.
    if (result?.error) {
      setLeaveError(result.error);
      setLeaving(false);
    }
  }

  async function handleRename() {
    const next = draftName.trim();
    if (!next || next === chat.name) {
      setRenaming(false);
      setDraftName(chat.name);
      return;
    }
    setSavingName(true);
    setNameError(null);
    const result = await renameGroupChat(chat.id, next);
    if (result?.error) {
      setNameError(result.error);
      setSavingName(false);
      return;
    }
    // Lifts the new name to the thread header and the chat list, which both
    // render from the chat object rather than refetching.
    onChatUpdated(result.chat);
    setSavingName(false);
    setRenaming(false);
  }

  // Members arrive in whatever order the SQL returned, which put eboard,
  // pledges and alumni next to each other with no structure. Grouped by member
  // group in the same order and with the same section styling as the directory,
  // so the two lists read the same way. Empty groups are dropped rather than
  // rendering a heading with nothing under it.
  const groupedMembers = useMemo(() => {
    const buckets = new Map(MEMBER_GROUP_ORDER.map((g) => [g, []]));
    for (const m of members) {
      const raw = m.memberGroup ?? m.member_group;
      // Unknown groups fall back to 'active' rather than vanishing — the same
      // trade-off the directory makes, and for the same reason: a mislabelled
      // member is easier to notice and fix than a missing one.
      buckets.get(MEMBER_GROUP_ORDER.includes(raw) ? raw : 'active').push(m);
    }
    for (const rows of buckets.values()) {
      rows.sort((a, b) => memberDisplayName(a).localeCompare(memberDisplayName(b)));
    }
    return [...buckets.entries()]
      .filter(([, rows]) => rows.length > 0)
      .map(([group, rows]) => ({ group, rows }));
  }, [members]);

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
            {canAdminister && (
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
          {renaming ? (
            <div className="w-full space-y-2">
              <input
                autoFocus
                type="text"
                maxLength={TEXT_LIMITS.NAME}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  // Escape restores the stored name rather than leaving the
                  // edited draft on screen, which would read as saved.
                  if (e.key === 'Escape') { setRenaming(false); setDraftName(chat.name); setNameError(null); }
                }}
                aria-label="Chat name"
                className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-center text-sm font-semibold text-foreground focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': tint(accent.base, 0.3) }}
              />
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => { setRenaming(false); setDraftName(chat.name); setNameError(null); }}
                  className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={savingName || !draftName.trim()}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ background: accent.gradient }}
                >
                  {savingName ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h2 className="text-center text-lg font-bold tracking-tight text-foreground">{chat.name}</h2>
              {canAdminister && (
                <button
                  type="button"
                  onClick={() => { setDraftName(chat.name); setRenaming(true); }}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Rename chat"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
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
              {groupedMembers.map(({ group, rows }) => (
                <div key={group}>
                  {/* Same section treatment as the directory: coloured dot,
                      uppercase label, count. The per-row GroupBadge is gone —
                      with a heading above them it just repeated itself on
                      every line. */}
                  <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROUP_COLOR[group] ?? 'var(--color-muted-foreground)' }} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: GROUP_COLOR[group] ?? 'var(--color-muted-foreground)' }}>
                      {formatMemberGroup(group)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{rows.length}</span>
                  </div>
                  {rows.map((m) => (
                <div key={m.authentik_id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                  <ProfileActionsMenu userId={m.authentik_id}>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <MemberAvatar member={{ id: m.authentik_id, ...m }} size={30} accent={accent} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{memberDisplayName(m)}</p>
                      </div>
                    </div>
                  </ProfileActionsMenu>
                  {/* No remove button for is_auto members, and deliberately no
                      badge either. They're in the chat through its groups or
                      committees, so removing them deletes no row and they stay
                      put — the way to drop them is to change the chat's
                      audience. Don't "fix" this by adding a button here; it
                      would look like it worked and change nothing. */}
                  {canAdminister && !m.is_auto && m.authentik_id !== currentUserId && (
                    <button type="button" onClick={() => onRemoveMember(m.authentik_id)} className="ml-1 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${memberDisplayName(m)}`}>
                      <UserMinus size={12} />
                    </button>
                  )}
                </div>
                  ))}
                </div>
              ))}
              {members.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No members yet.</p>}

              {canAdminister && (
                <div className="space-y-4 border-t border-border p-4">
                  {/* Editing the audience replaced a "quick add by group"
                      control that expanded a group into individual rows. That
                      was a snapshot: it captured who was in the group at that
                      moment and never updated, which is the exact problem
                      audiences exist to solve. Groups and committees belong
                      here as live membership; individuals stay separate.

                      Official chats only. A member-created chat is exactly the
                      people its creator picked, and the API refuses an audience
                      on one even from the creator, so rendering this here would
                      be a control whose only outcome is a 409. */}
                  {isEboard && !chat.is_member_created && (
                    <ChatAudienceEditor chat={chat} accent={accent} onChatUpdated={onChatUpdated} />
                  )}

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Individual members</p>
                    {adding ? (
                      <AddMemberPicker excludeIds={members.map((m) => m.authentik_id)} accent={accent} onAdd={(m) => { onAddMember(m); setAdding(false); }} />
                    ) : (
                      <button type="button" onClick={() => setAdding(true)} className="w-full rounded-lg border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted">
                        + Add individually
                      </button>
                    )}
                  </div>
                </div>
              )}

              {canLeave && (
                <div className="border-t border-border p-4">
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={leaving}
                    className="w-full rounded-lg border border-destructive/30 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                  >
                    {leaving ? 'Leaving…' : 'Leave this chat'}
                  </button>
                  {leaveError && <p className="mt-2 text-xs text-destructive">{leaveError}</p>}
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

function GroupChatThread({ chat, currentUserId, isEboard, accent, onBack, onDeleted, onLeft, onChatUpdated, readOnly = false }) {
  const confirm = useConfirm();
  const canAdminister = canAdministerChat(chat, { isEboard, currentUserId });
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
    // Skipped for oversight: marking a chat read that you aren't in is
    // meaningless, and the endpoint still requires real membership, so this
    // would be a 403 on every open.
    if (!readOnly) {
      markGroupChatRead(chat.id).catch((err) => { if (isRedirectError(err)) throw err; });
    }
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [chat.id, readOnly]);

  // Membership is DERIVED from the audience, so the roster has to refetch when
  // the audience changes, not only when the chat changes. Keying on chat.id
  // alone left the member list showing the old roster until you closed and
  // reopened the chat — which reads as "saving didn't work".
  const membershipKey = `${(chat.audience ?? []).join(',')}|${(chat.committee_ids ?? []).join(',')}`;
  useEffect(() => {
    getGroupChatMembers(chat.id).then(setMembers).catch((err) => { if (isRedirectError(err)) throw err; });
  }, [chat.id, membershipKey]);

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

  // Returns the failure to the modal rather than alerting, because these are
  // 409s whose message is the whole explanation. On success the chat leaves the
  // list and the thread unmounts, so there is nothing to report.
  async function handleLeave() {
    const result = await leaveGroupChat(chat.id);
    if (result?.ok) {
      onLeft(chat.id);
      return null;
    }
    return result;
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
          {canAdminister && (
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
          canAdminister={canAdminister}
          currentUserId={currentUserId}
          readOnly={readOnly}
          accent={accent}
          onAddMember={handleAddMember}
          onAddMany={handleAddMany}
          onRemoveMember={handleRemoveMember}
          onChatUpdated={onChatUpdated}
          onLeave={handleLeave}
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

      {/* Oversight chats are read-only: eboard can see an official chat they
          aren't in, but posting into it would be a message from someone the
          members never added. The API refuses it too — sendMessage still
          requires real membership. */}
      {readOnly ? (
        <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <Eye size={13} className="shrink-0" />
          <span>Viewing as eboard. Join this chat to post in it.</span>
        </div>
      ) : (
        <Composer onSend={handleSend} accent={accent} />
      )}
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

function GroupChatsTab({ currentUserId, isEboard, canCreate, accent, initialGroupChatId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNewGC, setShowNewGC] = useState(false);
  // Eboard only. Off by default — oversight is something you go looking for,
  // not something that reshapes your Messages tab every time you open it.
  const [showAll, setShowAll] = useState(false);
  const [allChats, setAllChats] = useState([]);

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

  // Fetched only while the oversight view is open. A failure here must not
  // touch the normal list, so it sets its own error and nothing else.
  useEffect(() => {
    if (!showAll || !isEboard) return undefined;
    let cancelled = false;
    getAllGroupChats()
      .then((data) => { if (!cancelled) setAllChats(data); })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (!cancelled) setError(err.message ?? 'Could not load all group chats');
      });
    return () => { cancelled = true; };
  }, [showAll, isEboard]);

  // Which of the oversight chats this person is actually in. Anything else
  // opens read-only, because they aren't a participant in it.
  const myChatIds = useMemo(() => new Set(chats.map((c) => c.id)), [chats]);
  const visibleChats = showAll ? allChats : chats;

  useEffect(() => {
    if (!initialGroupChatId) return;
    const match = chats.find((c) => c.id === initialGroupChatId);
    if (match) setSelected(match);
  }, [initialGroupChatId, chats]);

  function handleDeleted(chatId) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setSelected(null);
  }

  function handleChatUpdated(updatedChat) {
    setSelected(updatedChat);
    setChats((prev) => prev.map((c) => (c.id === updatedChat.id ? updatedChat : c)));
  }

  function handleLeft(chatId) {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setSelected(null);
  }

  // Returns an error STRING for the modal to display, or null on success.
  //
  // BOTH paths return { chat } / { error } now. The official one used to throw
  // "because it is eboard-only", which was not a reason: a thrown Server Action
  // becomes React #441 in production regardless of who triggered it, and eboard
  // creating an eboard-only chat got the digest instead of the API's message.
  async function handleCreate(name, memberIds, audience, committeeIds, official) {
    const result = official
      ? await createGroupChat({ name, memberIds, audience, committeeIds })
      : await createMemberGroupChat({ name, memberIds });

    if (result?.error) return result.error;
    setChats((prev) => [result.chat, ...prev]);
    setShowNewGC(false);
    return null;
  }

  return (
    <>
      {selected ? (
        <GroupChatThread
          chat={selected}
          currentUserId={currentUserId}
          isEboard={isEboard}
          accent={accent}
          onBack={() => setSelected(null)}
          onDeleted={handleDeleted}
          onLeft={handleLeft}
          onChatUpdated={handleChatUpdated}
          readOnly={!myChatIds.has(selected.id)}
        />
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
        <div className="flex h-full flex-col">
          {isEboard && (
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-2">
              {[
                { id: false, label: 'My chats' },
                { id: true, label: 'All chapter chats' },
              ].map((mode) => (
                <button
                  key={String(mode.id)}
                  type="button"
                  onClick={() => setShowAll(mode.id)}
                  aria-pressed={showAll === mode.id}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                    showAll === mode.id ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                  style={showAll === mode.id ? { background: accent.gradient } : undefined}
                >
                  {mode.label}
                </button>
              ))}
              {showAll && (
                <span className="ml-auto flex items-center gap-1 pr-1 text-[10px] text-muted-foreground">
                  <Eye size={10} /> Read-only unless you&apos;re a member
                </span>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1">
            <GroupChatList
              chats={visibleChats}
              currentUserId={currentUserId}
              accent={accent}
              canCreate={canCreate}
              onSelect={setSelected}
              // Creating from the oversight list would be confusing — it isn't
              // your list of chats, it's every chat.
              onNewChat={showAll ? null : () => setShowNewGC(true)}
            />
          </div>
        </div>
      )}

      {showNewGC && <NewGroupChatModal accent={accent} isEboard={isEboard} onClose={() => setShowNewGC(false)} onCreate={handleCreate} />}
    </>
  );
}

// ─── Main revamped page ───

function RevampedMessagesContent({ accentKey }) {
  const accent = PALETTES[accentKey] ?? PALETTES.blue;
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const withId = searchParams.get('with');
  const groupChatId = searchParams.get('groupChat');
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;
  // Rushees reach this same component through /rushee/messages, so the create
  // button has to be gated on a real group check rather than on "not eboard".
  const canCreate = canCreateChats(session?.user?.groups);
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
          <GroupChatsTab currentUserId={currentUserId} isEboard={isEboard} canCreate={canCreate} accent={accent} initialGroupChatId={groupChatId} />
        )}
      </div>
    </div>
  );
}

// Every portal passes blue, amber or red, so the pre-revamp variant this used
// to fall back to was unreachable and has been deleted. An unrecognised accent
// now renders the revamped UI with the blue palette (see the PALETTES
// lookup above), which is a better failure than a second copy of the whole UI
// that nobody maintains — two copies is what let the CircleCheck/BlockButton
// fix keep disappearing from one of them.
export default function MessagesPage({ accent }) {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>}>
      <RevampedMessagesContent accentKey={accent} />
    </Suspense>
  );
}
