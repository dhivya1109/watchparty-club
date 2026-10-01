import { useState } from 'react'
import { recommendations, shelfOf, STATUSES, type ClubTitle, type Entry, type Member, type Status } from '../lib/club'
import { genreTaste } from '../lib/picker'
import { personStats, tasteMatches } from '../lib/stats'
import { inviteLink } from '../lib/cloud'
import { useClub } from '../store/ClubContext'
import { LENGTH_UNIT } from '../types'
import { Avatar } from './Avatar'
import { TitleSheet } from './ClubPage'
import { ProfileForm } from './ProfileForm'
import { useToast } from './Toast'
import { EmptyState, Panel, Poster } from './ui'

/**
 * 👥 Friends: everyone in the club, and each person's profile.
 * The host (👑) invites and removes people; everyone can see each other's shelves and reviews.
 */
export function FriendsPage({
  profileId,
  onOpenProfile,
  onGoSearch,
}: {
  profileId: string | null
  onOpenProfile: (id: string | null) => void
  onGoSearch: () => void
}) {
  const { data } = useClub()
  const member = profileId ? data.members.find((m) => m.id === profileId) : undefined
  if (member) return <Profile member={member} onBack={() => onOpenProfile(null)} onGoSearch={onGoSearch} />
  return <Everyone onOpenProfile={onOpenProfile} />
}

// ---------- The list of everyone ----------

function Everyone({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const { data, me, amHost, removeMember, renameClub, leaveClub } = useClub()
  const host = data.members.find((m) => m.role === 'host')
  const matches = tasteMatches(data)
  const [editingName, setEditingName] = useState(false)
  const [clubName, setClubName] = useState(data.name ?? '')

  const matchWithMe = (id: string) =>
    matches.find((m) => (m.a.id === me.id && m.b.id === id) || (m.b.id === me.id && m.a.id === id))?.match ?? null


  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">The crew</p>
      {editingName ? (
        <form
          className="mt-1 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            renameClub(clubName)
            setEditingName(false)
          }}
        >
          <input
            autoFocus
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            maxLength={40}
            placeholder="e.g. Goa Gang"
            className="rounded-xl border border-line bg-surface px-3 py-2 font-display text-2xl font-extrabold outline-none focus:border-gold"
          />
          <button className="rounded-full bg-gold px-4 py-2 text-sm font-bold text-on-gold">Save</button>
        </form>
      ) : (
        <h2 className="mt-1 flex flex-wrap items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {data.name || 'Our club'}
          {amHost && (
            <button onClick={() => setEditingName(true)} className="rounded-full border border-line px-3 py-1 font-sans text-xs font-semibold text-soft hover:border-gold hover:text-accent">
              ✏️ Rename
            </button>
          )}
        </h2>
      )}
      <p className="mt-1 text-sm text-soft">
        {data.members.length} {data.members.length === 1 ? 'member' : 'members'}
        {host && ` · 👑 Host: ${host.name}`}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.members.map((m) => {
          const s = personStats(data, m)
          const match = m.id === me.id ? null : matchWithMe(m.id)
          return (
            <article key={m.id} className="animate-pop flex flex-col rounded-3xl border border-line bg-surface p-4 transition hover:border-muted">
              <div className="flex items-start gap-3">
                <Avatar member={m} size={56} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-extrabold">{m.name}</h3>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    <RoleBadge member={m} />
                    {m.id === me.id && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-accent">You</span>}
                  </div>
                </div>
                {match !== null && (
                  <div className="text-right" title={`Your ratings agree ${match}% of the time`}>
                    <div className="font-display text-2xl font-extrabold text-accent">{match}%</div>
                    <div className="text-[10px] text-muted">taste match</div>
                  </div>
                )}
              </div>
              {m.bio && <p className="mt-3 text-sm italic text-soft">“{m.bio}”</p>}
              <p className="mt-3 text-xs text-muted">
                ✅ {s.completed} finished · ⭐ {s.ratingsGiven} rated
                {s.averageGiven !== null && ` · avg ${s.averageGiven}`}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => onOpenProfile(m.id)}
                  className="flex-1 rounded-xl border border-line py-2 text-sm font-bold transition hover:border-gold hover:text-accent"
                >
                  View profile →
                </button>
                {amHost && m.id !== me.id && (
                  <button
                    onClick={() =>
                      confirm(`Remove ${m.name} from ${data.name ?? 'the club'}? They’ll lose access to this club.`) && removeMember(m.id)
                    }
                    className="rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-coral/10 hover:text-coral"
                  >
                    Remove
                  </button>
                )}
              </div>
            </article>
          )
        })}

        <InviteCard />
      </div>

      <Panel title="ℹ️ How roles work" className="mt-6">
        <ul className="grid grid-cols-1 gap-3 text-sm text-soft sm:grid-cols-2">
          <li>
            <b className="text-cream">👑 Host</b> — started the club. Shares the invite link, removes people, renames the club.
          </li>
          <li>
            <b className="text-cream">🙂 Member</b> — adds titles, tracks progress, rates, reviews and spins the wheel.
          </li>
        </ul>
      </Panel>

      {!amHost && (
        <p className="mt-6 text-center text-sm text-muted">
          Want out?{' '}
          <button
            onClick={() => confirm(`Leave ${data.name ?? 'this club'}? You can rejoin later with an invite link.`) && void leaveClub()}
            className="font-semibold text-coral hover:underline"
          >
            Leave this club
          </button>
        </p>
      )}
    </div>
  )
}

/** ➕ The club's invite link — the host shares it; friends open it on their own phones. */
function InviteCard() {
  const { data, amHost, activeClub } = useClub()
  const toast = useToast()
  const host = data.members.find((m) => m.role === 'host')
  const link = activeClub ? inviteLink(activeClub.inviteCode) : ''
  const canShare = typeof navigator.share === 'function'

  return (
    <article className="flex flex-col rounded-3xl border-2 border-dashed border-gold/50 bg-gold/5 p-4">
      <div className="text-3xl">➕</div>
      <h3 className="mt-2 text-lg font-extrabold">Invite friends</h3>
      {amHost ? (
        <>
          <p className="mt-1 text-sm text-soft">Send this link. Friends open it on their own phone and join straight away.</p>
          <code className="mt-3 block truncate rounded-xl border border-line bg-night/60 px-3 py-2 text-xs text-soft">{link}</code>
          <div className="mt-3 flex gap-2">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link)
                  toast({ title: 'Invite link copied 📋', text: 'Paste it in WhatsApp, Instagram, anywhere.', emoji: '🔗' })
                } catch {
                  toast({ title: 'Couldn’t copy', text: 'Select the link above and copy it by hand.', emoji: '⚠️' })
                }
              }}
              className="flex-1 rounded-xl bg-gold py-2 text-sm font-bold text-on-gold transition hover:brightness-110"
            >
              📋 Copy link
            </button>
            {canShare && (
              <button
                onClick={() => void navigator.share({ title: `Join ${data.name ?? 'my club'} on WatchParty Club`, text: 'Come track what we watch together 🍿', url: link }).catch(() => {})}
                className="flex-1 rounded-xl border border-gold py-2 text-sm font-bold text-accent transition hover:bg-gold/10"
              >
                📤 Share
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="mt-1 text-sm text-soft">Only the host{host ? ` (${host.name})` : ''} can invite people. Ask them for the link!</p>
      )}
    </article>
  )
}

function RoleBadge({ member }: { member: Member }) {
  return member.role === 'host' ? (
    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-accent">👑 Host</span>
  ) : (
    <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-semibold text-soft">🙂 Member</span>
  )
}

// ---------- One person's profile ----------

const SHELF_ORDER: Status[] = ['watching', 'want', 'completed', 'dropped']
const SHELF_HEADINGS: Record<Status, string> = {
  watching: '▶️ Watching now',
  want: '📌 Wants to watch',
  completed: '✅ Finished',
  dropped: '💤 Dropped',
}

function Profile({ member, onBack, onGoSearch }: { member: Member; onBack: () => void; onGoSearch: () => void }) {
  const { data, me, updateProfile } = useClub()
  const [editing, setEditing] = useState(false)
  /** The title whose details are open (tap a poster) */
  const [openId, setOpenId] = useState<string | null>(null)
  const isMe = member.id === me.id
  const shelf = shelfOf(data, member.id)
  const stats = personStats(data, member)
  const reviews = SHELF_ORDER.flatMap((s) => shelf[s]).filter((i) => i.entry.review)
  const loves = [...genreTaste(data, member.id)]
    .filter(([, v]) => v > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([g]) => g)
  const match = isMe
    ? null
    : tasteMatches(data).find((m) => (m.a.id === me.id && m.b.id === member.id) || (m.b.id === me.id && m.a.id === member.id))
  const recs = isMe ? [] : recommendations(data, member.id, me.id)
  const firstName = member.name.split(' ')[0]
  const nothingYet = SHELF_ORDER.every((s) => shelf[s].length === 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <button onClick={onBack} className="text-sm font-semibold text-soft hover:text-accent">
        ← Everyone in the club
      </button>

      {/* Profile header */}
      <section className="mt-4 overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-surface to-raised/60">
        <div className="h-20 sm:h-24" style={{ background: `linear-gradient(120deg, ${member.color}, transparent)` }} />
        <div className="-mt-10 px-5 pb-5 sm:px-8">
          {editing ? (
            <div className="rounded-3xl border border-line bg-surface p-5">
              <ProfileForm
                initial={member}
                submitLabel="Save profile"
                onSubmit={(change) => {
                  void updateProfile(change).then(() => setEditing(false))
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <div className="rounded-full ring-4 ring-surface">
                <Avatar member={member} size={88} />
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <h2 className="text-3xl font-extrabold tracking-tight">{member.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <RoleBadge member={member} />
                  {member.joinedAt && <span>· joined {new Date(member.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>}
                </div>
                {member.bio && <p className="mt-2 text-sm italic text-soft">“{member.bio}”</p>}
              </div>
              {isMe ? (
                <button onClick={() => setEditing(true)} className="rounded-full border border-line px-4 py-2 text-sm font-bold hover:border-gold hover:text-accent">
                  ✏️ Edit profile
                </button>
              ) : (
                match?.match != null && (
                  <div className="text-right">
                    <div className="font-display text-4xl font-extrabold text-accent">{match.match}%</div>
                    <div className="text-xs text-muted">taste match with you · {match.shared} shared</div>
                  </div>
                )
              )}
            </div>
          )}

          {!editing && (
            <>
              {loves.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-soft">❤️ Loves</span>
                  {loves.map((g) => (
                    <span key={g} className="rounded-full bg-coral/15 px-2.5 py-0.5 text-xs font-semibold text-coral">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <MiniStat value={shelf.watching.length} label="Watching" />
                <MiniStat value={stats.completed} label="Finished" />
                <MiniStat value={stats.averageGiven ?? '—'} label="Avg rating" />
                <MiniStat value={reviews.length} label="Reviews" />
              </div>
            </>
          )}
        </div>
      </section>

      {nothingYet ? (
        <EmptyState
          emoji="🎟️"
          title={isMe ? 'Your list is empty' : `${firstName} hasn’t added anything yet`}
          text={isMe ? 'Add something you’ve watched or want to watch.' : 'Once they track, rate or review something, it shows up here.'}
          action="🔍 Discover titles"
          onAction={onGoSearch}
        />
      ) : (
        <>
          {recs.length > 0 && (
            <Panel title={`⭐ ${firstName} recommends to you`} note={`Things ${firstName} rated 8+ that you haven’t watched yet`} className="mt-6">
              <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {recs.map(({ title, entry }) => (
                  <button key={title.id} onClick={() => setOpenId(title.id)} className="group w-32 shrink-0 text-left">
                    <Poster src={title.image} type={title.type} className="aspect-[2/3] rounded-2xl shadow-lg transition duration-300 group-hover:-translate-y-1" />
                    <p className="mt-2 line-clamp-2 text-sm font-bold leading-tight">{title.title}</p>
                    <p className="text-xs font-bold text-star">★ {entry.rating}/10</p>
                    {entry.review && <p className="mt-0.5 line-clamp-2 text-xs italic text-muted">“{entry.review}”</p>}
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {SHELF_ORDER.filter((s) => shelf[s].length > 0).map((s) => (
            <section key={s} className="mt-8">
              <h3 className="text-xl font-extrabold">
                {SHELF_HEADINGS[s]} <span className="text-sm font-medium text-muted">· {shelf[s].length}</span>
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
                {shelf[s].map(({ title, entry }) => (
                  <ShelfItem key={title.id} title={title} entry={entry} onOpen={() => setOpenId(title.id)} />
                ))}
              </div>
            </section>
          ))}

          {reviews.length > 0 && (
            <section className="mt-8">
              <h3 className="text-xl font-extrabold">
                ✍️ {isMe ? 'Your reviews' : `${firstName}’s reviews`} <span className="text-sm font-medium text-muted">· {reviews.length}</span>
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {reviews.map(({ title, entry }) => (
                  <figure key={title.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-3">
                    <Poster src={title.image} type={title.type} className="aspect-[2/3] w-14 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <figcaption className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold">{title.title}</span>
                        {entry.rating !== null && <RatingText rating={entry.rating} />}
                      </figcaption>
                      <blockquote className="mt-1 whitespace-pre-line break-words text-sm text-soft">“{entry.review}”</blockquote>
                    </div>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {openId && <TitleSheet titleId={openId} person={member} onClose={() => setOpenId(null)} />}
    </div>
  )
}

/** A poster with its status underneath — tap for the full details. */
function ShelfItem({ title, entry, onOpen }: { title: ClubTitle; entry: Entry; onOpen: () => void }) {
  const status = STATUSES.find((s) => s.value === entry.status)!
  const progress = title.length && entry.status === 'watching' ? Math.round((entry.progress / title.length) * 100) : null
  const steps = title.type !== 'movie' && entry.progress > 0 ? `${entry.progress}${title.length ? `/${title.length}` : ''} ${LENGTH_UNIT[title.type]}` : null
  return (
    <button onClick={onOpen} className="group block w-full text-left" aria-label={`${title.title} — ${status.label}. Open details`}>
      <div className="relative">
        <Poster src={title.image} type={title.type} className="aspect-[2/3] rounded-xl shadow-md transition duration-300 group-hover:-translate-y-1" />
        {entry.rating !== null && (
          <span className="absolute right-1 top-1 rounded-full bg-night/85 px-1.5 py-0.5 text-[10px] font-bold text-star backdrop-blur">
            ★ {entry.rating}
          </span>
        )}
        {progress !== null && (
          <div className="absolute inset-x-1.5 bottom-1.5 h-1.5 overflow-hidden rounded-full bg-night/70">
            <div className="h-full rounded-full bg-gradient-to-r from-gold to-coral" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight">{title.title}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted">
        {status.emoji} {steps ?? status.label}
      </p>
    </button>
  )
}

function RatingText({ rating }: { rating: number }) {
  return (
    <span className={`font-display text-sm font-bold ${rating >= 8 ? 'text-accent' : rating <= 4 ? 'text-coral' : 'text-soft'}`}>
      ★ {rating}/10
    </span>
  )
}

function MiniStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-night/40 px-3 py-2.5">
      <div className="font-display text-2xl font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
