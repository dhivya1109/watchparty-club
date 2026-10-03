import { ChartColumn, FerrisWheel, Search, Ticket, Users, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AuthScreen } from './components/Account'
import { ClubPage } from './components/ClubPage'
import { ClubSwitcher, NoClubScreen } from './components/Clubs'
import { Poppy } from './components/home/Characters'
import { FriendsPage } from './components/FriendsPage'
import { MembersMenu } from './components/MembersMenu'
import { PickerPage } from './components/PickerPage'
import { SearchPage } from './components/SearchPage'
import { StatsPage } from './components/StatsPage'
import { ThemeMenu } from './components/ThemeMenu'
import { WelcomeDialog } from './components/WelcomeDialog'
import { CLUB_CATCH_EVENT } from './effects/flyToClub'
import { useClub } from './store/ClubContext'

export type Page = 'search' | 'club' | 'tonight' | 'friends' | 'stats'

function App() {
  const { data, status, error, joinedCount } = useClub()
  const [page, setPage] = useState<Page>('search')
  /** Whose profile is open on the Friends page (null = the list of everyone) */
  const [profileId, setProfileId] = useState<string | null>(null)
  /** Goes up each time a flying poster lands on the Club tab — replays its "catch" animation. */
  const [catches, setCatches] = useState(0)
  const clubCount = Object.keys(data.titles).length

  // Just joined a club from an invite? Go straight to its shelf.
  useEffect(() => {
    if (joinedCount > 0) {
      setPage('club')
      setProfileId(null)
      window.scrollTo({ top: 0 })
    }
  }, [joinedCount])

  useEffect(() => {
    const onCatch = () => setCatches((c) => c + 1)
    window.addEventListener(CLUB_CATCH_EVENT, onCatch)
    return () => window.removeEventListener(CLUB_CATCH_EVENT, onCatch)
  }, [])

  const go = (next: Page, profile: string | null = null) => {
    setPage(next)
    setProfileId(profile)
    window.scrollTo({ top: 0 })
  }

  // Before a club is open: loading → log in → your profile → pick your first club
  if (status === 'loading') return <Splash text="Getting the popcorn ready…" />
  if (status === 'error') return <Splash text={error ?? 'Something went wrong.'} />
  if (status === 'auth') return <AuthScreen />
  if (status === 'setup') return (
    <>
      <Splash text="" />
      <WelcomeDialog />
    </>
  )
  if (status === 'no-club') return (
    <div className="min-h-screen">
      <header className="border-b border-line/70 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-coral text-lg">🍿</span>
          <span className="font-display text-lg font-semibold tracking-tight">WatchParty Club</span>
          <span className="ml-auto">
            <ThemeMenu />
          </span>
        </div>
      </header>
      <NoClubScreen />
    </div>
  )

  const tabs: { page: Page; icon: LucideIcon; label: string; count?: number }[] = [
    { page: 'search', icon: Search, label: 'Discover' },
    { page: 'club', icon: Ticket, label: 'Club', count: clubCount },
    { page: 'tonight', icon: FerrisWheel, label: 'Tonight' },
    { page: 'friends', icon: Users, label: 'Friends' },
    { page: 'stats', icon: ChartColumn, label: 'Stats' },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-night/75 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-6">
          <div className="flex min-w-0 items-center gap-2.5 lg:order-1">
            <button
              onClick={() => go('search')}
              aria-label="Home"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-coral text-lg sm:h-10 sm:w-10 sm:text-xl"
            >
              🍿
            </button>
            <div className="min-w-0">
              <button onClick={() => go('search')} className="block whitespace-nowrap font-display text-[clamp(1.05rem,4.8vw,1.4rem)] font-semibold leading-none tracking-tight">
                WatchParty Club
              </button>
              {/* Which club is open — tap to switch, create or join another */}
              <div className="mt-1">
                <ClubSwitcher />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:order-3">
            <ThemeMenu />
            <MembersMenu onOpenProfile={(id) => go('friends', id)} onOpenFriends={() => go('friends')} />
          </div>

          {/* Phones & tablets: 5 equal buttons, icon above label. Wide screens: one pill-shaped bar. */}
          <nav className="col-span-2 grid grid-cols-5 gap-1 rounded-2xl border border-line bg-surface/80 p-1 lg:order-2 lg:col-span-1 lg:flex lg:justify-self-end lg:rounded-full">
            {tabs.map((t) => (
              <button
                // A new key for the Club tab after each catch restarts its wiggle-and-glow animation.
                key={t.page === 'club' ? `club-${catches}` : t.page}
                data-club-tab={t.page === 'club' ? '' : undefined}
                onClick={() => go(t.page)}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition lg:flex-row lg:gap-1.5 lg:rounded-full lg:px-3.5 lg:text-sm ${
                  page === t.page ? 'bg-gold text-on-gold' : 'text-soft hover:bg-raised hover:text-cream'
                } ${t.page === 'club' && catches > 0 ? 'animate-catch' : ''}`}
              >
                <t.icon size={18} strokeWidth={2} aria-hidden="true" className="lg:h-4 lg:w-4" />
                <span className="whitespace-nowrap">{t.label}</span>
                {/* The count "bumps" whenever something is added, so you can see where it went */}
                {t.count ? (
                  <span
                    key={t.count}
                    className={`animate-bump absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold lg:static lg:h-5 lg:min-w-5 ${
                      page === t.page ? 'bg-ink text-gold' : 'bg-coral text-white'
                    }`}
                  >
                    {t.count}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Search stays mounted (just hidden) so your search is still there when you come back. */}
      <div hidden={page !== 'search'}>
        <SearchPage onNavigate={(p) => go(p)} />
      </div>
      {page !== 'search' && (
        <main key={`${page}-${profileId}`} className="animate-pop">
          {page === 'club' && <ClubPage onGoSearch={() => go('search')} />}
          {page === 'tonight' && <PickerPage onGoSearch={() => go('search')} />}
          {page === 'friends' && (
            <FriendsPage profileId={profileId} onOpenProfile={(id) => go('friends', id)} onGoSearch={() => go('search')} />
          )}
          {page === 'stats' && <StatsPage onGoSearch={() => go('search')} />}
        </main>
      )}

      <footer className="mx-auto max-w-6xl px-4 pb-24 pt-6 text-center text-xs text-muted">
        Synced live with everyone in {data.name ?? 'your club'}.
      </footer>
    </div>
  )
}

/** A full-screen message: while loading, on errors, and behind the welcome screen. */
function Splash({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="h-28 w-24">
        <Poppy />
      </div>
      {text && <p className="max-w-md text-soft">{text}</p>}
    </div>
  )
}

export default App
