import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { AccountDialog } from './Account'
import { Avatar } from './Avatar'
import { ClubsSheet } from './Clubs'
import { Portal } from './ui'

/** Header avatar button: you, your role in this club, and shortcuts to your profile and friends. */
export function MembersMenu({ onOpenProfile, onOpenFriends }: { onOpenProfile: (id: string) => void; onOpenFriends: () => void }) {
  const { me, activeClub, account, signOut, clubs } = useClub()
  const [open, setOpen] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [clubsOpen, setClubsOpen] = useState(false)
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
          <Portal>
            <div className="fixed inset-0 z-10" onClick={close} />
          </Portal>
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
            <button
              onClick={() => {
                close()
                setClubsOpen(true)
              }}
              className="mt-2 flex w-full items-center justify-between rounded-xl border border-line px-3 py-2 text-sm font-semibold transition hover:border-gold hover:text-accent"
            >
              <span className="whitespace-nowrap">🎬 Your clubs</span>
              <span className="whitespace-nowrap text-xs text-muted">
                {clubs.length} {clubs.length === 1 ? 'club' : 'clubs'} →
              </span>
            </button>
            {account.isGuest ? (
              <button
                onClick={() => {
                  close()
                  setDialog(true)
                }}
                className="mt-3 w-full rounded-2xl border-2 border-gold/60 bg-gold/10 p-3 text-left transition hover:bg-gold/20"
              >
                <span className="block font-display font-bold">💾 Save my account</span>
                <span className="block text-xs text-soft">Right now it only lives in this browser. Add your email to use it on any device.</span>
              </button>
            ) : (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-night/40 px-3 py-2 text-xs">
                <span className="min-w-0 truncate text-soft">✉️ {account.email}</span>
                <button
                  onClick={() => {
                    if (confirm('Sign out on this device? Sign back in any time with your email.')) {
                      close()
                      void signOut()
                    }
                  }}
                  className="shrink-0 font-semibold text-muted hover:text-coral"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </>
      )}
      {dialog && <AccountDialog onClose={() => setDialog(false)} />}
      {clubsOpen && <ClubsSheet onClose={() => setClubsOpen(false)} />}
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
