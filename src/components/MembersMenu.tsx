import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { Avatar } from './Avatar'

/** Header avatar button: you, your role in this club, and shortcuts to your profile and friends. */
export function MembersMenu({ onOpenProfile, onOpenFriends }: { onOpenProfile: (id: string) => void; onOpenFriends: () => void }) {
  const { me, activeClub } = useClub()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`You are ${me.name} — open your menu`}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-sm transition hover:border-gold sm:pr-3"
      >
        <Avatar member={me} size={28} />
        {/* On phones only the avatar shows, so the header stays on one row */}
        <span className="hidden max-w-28 truncate font-medium sm:inline">{me.name}</span>
        <span className="text-xs text-muted">▾</span>
      </button>

      {open && (
        <>
          {/* Clicking outside the panel closes it */}
          <div className="fixed inset-0 z-20" onClick={close} />
          <div className="animate-pop absolute right-0 z-30 mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-3xl border border-line bg-surface p-4 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3">
              <Avatar member={me} size={44} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{me.name}</p>
                <p className="truncate text-xs text-muted">
                  {me.role === 'host' ? '👑 Host of ' : '🙂 Member of '}
                  {activeClub?.name ?? 'your club'}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MenuButton onClick={() => { close(); onOpenProfile(me.id) }}>👤 My profile</MenuButton>
              <MenuButton onClick={() => { close(); onOpenFriends() }}>👥 Friends</MenuButton>
            </div>
            <p className="mt-3 text-[11px] text-muted">🔒 Your account lives in this browser — no password needed.</p>
          </div>
        </>
      )}
    </div>
  )
}

function MenuButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-line py-2 text-sm font-semibold transition hover:border-gold hover:text-accent">
      {children}
    </button>
  )
}
