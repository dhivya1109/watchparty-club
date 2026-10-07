import { ChevronDown, Crown, Pencil, ShieldCheck, Trash2, TriangleAlert, UserMinus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  adminClubMembers,
  adminClubs,
  adminDeleteClub,
  adminDeleteUser,
  adminRemoveMember,
  adminRenameClub,
  adminReset,
  adminSummary,
  adminUsers,
  type AdminClub,
  type AdminMember,
  type AdminSummary,
  type AdminUser,
} from '../lib/admin'
import { useClub } from '../store/ClubContext'
import { Avatar } from './Avatar'
import { useToast } from './Toast'
import { Panel } from './ui'

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

/**
 * 🛠️ Admin: every club and every account in the app, plus the reset buttons.
 * Only people in the "admins" table see the menu item — and the database refuses everyone else anyway.
 */
export function AdminPage() {
  const { refreshClubs, me } = useClub()
  const toast = useToast()
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [clubs, setClubs] = useState<AdminClub[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, c, u] = await Promise.all([adminSummary(), adminClubs(), adminUsers()])
      setSummary(s)
      setClubs(c)
      setUsers(u)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** Run an admin action, then refresh this page and my own club list. */
  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true)
    try {
      await action()
      toast({ title: done })
      await Promise.all([load(), refreshClubs()])
    } catch (err) {
      toast({ title: 'That didn’t work', text: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  const reset = async (deleteAccounts: boolean) => {
    const what = deleteAccounts
      ? 'EVERYTHING: every club, shelf, rating, review, profile AND every login account (except admins)'
      : 'every club, shelf, rating, review and profile (people keep their logins)'
    const typed = prompt(`This permanently deletes ${what}. There is no undo.\n\nType RESET to confirm.`)
    if (typed?.trim() !== 'RESET') return
    setBusy(true)
    try {
      await adminReset(deleteAccounts)
      // Everything the app had loaded is gone — start it fresh
      window.location.reload()
    } catch (err) {
      toast({ title: 'Reset failed', text: err instanceof Error ? err.message : String(err) })
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          <ShieldCheck size={14} aria-hidden="true" /> Admin
        </p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Control room</h2>
        <p className="mt-1 text-sm text-soft">Every club and account in the app. Only admins can open this page.</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error.includes('Could not find the function') ? 'The admin functions aren’t in the database yet — run supabase/003_admin.sql.' : error}
        </p>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ['People', summary.users],
              ['Clubs', summary.clubs],
              ['Titles on shelves', summary.titles],
              ['Ratings', summary.ratings],
              ['Reviews', summary.reviews],
            ] as const
          ).map(([label, value], i) => (
            <div key={label} className={`rounded-2xl border border-line bg-surface p-4 ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}>
              <div className="font-display text-3xl font-bold tabular-nums">{value}</div>
              <div className="text-sm text-soft">{label}</div>
            </div>
          ))}
        </div>
      )}

      <Panel title={`Clubs · ${clubs.length}`} note="Newest first. Deleting a club removes its shelf and member list; people keep their own ratings.">
        {clubs.length === 0 ? (
          <p className="text-sm text-muted">No clubs yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {clubs.map((c) => (
              <ClubRow
                key={c.id}
                club={c}
                busy={busy}
                onRename={() => {
                  const name = prompt('New name for this club:', c.name)?.trim()
                  if (name && name !== c.name) void run(() => adminRenameClub(c.id, name), `Renamed to ${name}`)
                }}
                onDelete={() => {
                  const typed = prompt(`Delete “${c.name}” for all ${c.members} members? Its shelf of ${c.titles} titles goes too.\n\nType the club’s name to confirm.`)
                  if (typed?.trim() === c.name) void run(() => adminDeleteClub(c.id), `Deleted ${c.name}`)
                }}
                onRemoveMember={(m) => {
                  if (confirm(`Remove ${m.name} from ${c.name}?`)) void run(() => adminRemoveMember(c.id, m.user_id), `${m.name} removed from ${c.name}`)
                }}
              />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`People · ${users.length}`} note="Most recently active first.">
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-xl border border-line bg-night/30 p-3">
              <Avatar member={{ id: u.id, name: u.name ?? '?', color: u.color ?? '#8b5cf6', emoji: u.emoji ?? undefined, role: 'member' }} size={36} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-semibold">
                  {u.name ?? <span className="text-muted">(no profile yet)</span>}
                  {u.is_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                      <ShieldCheck size={11} aria-hidden="true" /> Admin
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-soft">{u.email ?? 'Guest (no email)'}</p>
                <p className="text-xs text-muted">
                  Joined {day(u.created_at)} · Last active {day(u.last_sign_in_at)} · {u.clubs} {u.clubs === 1 ? 'club' : 'clubs'} · {u.entries} titles tracked
                </p>
              </div>
              {!u.is_admin && u.id !== me.id && (
                <button
                  disabled={busy}
                  onClick={() => {
                    const typed = prompt(
                      `Delete ${u.name ?? u.email ?? 'this account'} completely? Their profile, ratings, reviews and any clubs they created are deleted too.\n\nType DELETE to confirm.`,
                    )
                    if (typed?.trim() === 'DELETE') void run(() => adminDeleteUser(u.id), `Deleted ${u.name ?? u.email ?? 'account'}`)
                  }}
                  aria-label={`Delete ${u.name ?? u.email ?? 'account'}`}
                  className="shrink-0 rounded-full border border-coral/40 p-2 text-coral transition hover:bg-coral/10 disabled:opacity-40"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <section className="rounded-2xl border-2 border-coral/50 bg-coral/5 p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold text-coral">
          <TriangleAlert size={18} aria-hidden="true" /> Danger zone
        </h3>
        <p className="mt-1 text-sm text-soft">Start the app fresh. These can’t be undone — you’ll be asked to type RESET.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            disabled={busy}
            onClick={() => void reset(false)}
            className="rounded-xl border border-coral/50 p-4 text-left transition hover:bg-coral/10 disabled:opacity-40"
          >
            <span className="block font-semibold text-coral">Clear all content</span>
            <span className="mt-0.5 block text-xs text-soft">Every club, shelf, rating, review and profile. People keep their logins and start at “Who are you?”.</span>
          </button>
          <button
            disabled={busy}
            onClick={() => void reset(true)}
            className="rounded-xl border border-coral bg-coral/10 p-4 text-left transition hover:bg-coral/20 disabled:opacity-40"
          >
            <span className="block font-semibold text-coral">Clear everything, including accounts</span>
            <span className="mt-0.5 block text-xs text-soft">All of the above, plus every login except admins. Everyone signs up again with a code.</span>
          </button>
        </div>
      </section>
    </div>
  )
}

/** One club: details, and its members on demand. */
function ClubRow({
  club,
  busy,
  onRename,
  onDelete,
  onRemoveMember,
}: {
  club: AdminClub
  busy: boolean
  onRename: () => void
  onDelete: () => void
  onRemoveMember: (member: AdminMember) => void
}) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<AdminMember[] | null>(null)

  // Load the member list when opened, and again after changes (members count changes)
  useEffect(() => {
    if (open) void adminClubMembers(club.id).then(setMembers).catch(() => setMembers([]))
  }, [open, club.id, club.members])

  return (
    <li className="rounded-xl border border-line bg-night/30">
      <div className="flex items-center gap-2 p-3">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{club.name}</span>
            <span className="block text-xs text-muted">
              Host: {club.host_name ?? '—'} · {club.members} {club.members === 1 ? 'member' : 'members'} · {club.titles} titles · since {day(club.created_at)}
              {club.last_added ? ` · last added ${day(club.last_added)}` : ''}
            </span>
          </span>
        </button>
        <button disabled={busy} onClick={onRename} aria-label={`Rename ${club.name}`} className="shrink-0 rounded-full border border-line p-2 text-soft transition hover:border-muted hover:text-cream disabled:opacity-40">
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button disabled={busy} onClick={onDelete} aria-label={`Delete ${club.name}`} className="shrink-0 rounded-full border border-coral/40 p-2 text-coral transition hover:bg-coral/10 disabled:opacity-40">
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <ul className="flex flex-col gap-1 border-t border-line px-3 pb-3 pt-2">
          {members === null ? (
            <li className="text-xs text-muted">Loading members…</li>
          ) : members.length === 0 ? (
            <li className="text-xs text-muted">No members.</li>
          ) : (
            members.map((m) => (
              <li key={m.user_id} className="flex items-center gap-2 text-sm">
                <Avatar member={{ id: m.user_id, name: m.name, color: m.color, emoji: m.emoji ?? undefined, role: m.role }} size={24} />
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                {m.role === 'host' && <Crown size={13} aria-label="Host" className="text-accent" />}
                <button
                  disabled={busy}
                  onClick={() => onRemoveMember(m)}
                  aria-label={`Remove ${m.name}`}
                  className="rounded-full p-1.5 text-muted transition hover:bg-coral/10 hover:text-coral disabled:opacity-40"
                >
                  <UserMinus size={15} aria-hidden="true" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  )
}
