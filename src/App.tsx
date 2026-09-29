import { useState } from 'react'
import { ClubPage } from './components/ClubPage'
import { FriendsPage } from './components/FriendsPage'
import { MembersMenu } from './components/MembersMenu'
import { PickerPage } from './components/PickerPage'
import { SearchPage } from './components/SearchPage'
import { StatsPage } from './components/StatsPage'
import { ThemeMenu } from './components/ThemeMenu'
import { WelcomeDialog } from './components/WelcomeDialog'
import { useClub } from './store/ClubContext'

export type Page = 'search' | 'club' | 'tonight' | 'friends' | 'stats'

function App() {
  const { data, welcomed } = useClub()
  const [page, setPage] = useState<Page>('search')
  /** Whose profile is open on the Friends page (null = the list of everyone) */
  const [profileId, setProfileId] = useState<string | null>(null)
  const clubCount = Object.keys(data.titles).length

  const go = (next: Page, profile: string | null = null) => {
    setPage(next)
    setProfileId(profile)
    window.scrollTo({ top: 0 })
  }

  const tabs: { page: Page; emoji: string; label: string; count?: number }[] = [
    { page: 'search', emoji: '🔍', label: 'Discover' },
    { page: 'club', emoji: '🎟️', label: 'My Club', count: clubCount },
    { page: 'tonight', emoji: '🎡', label: 'Tonight' },
    { page: 'friends', emoji: '👥', label: 'Friends' },
    { page: 'stats', emoji: '📊', label: 'Stats' },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-night/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3 sm:gap-x-6">
          <button onClick={() => go('search')} className="flex min-w-0 items-center gap-2.5 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-coral text-lg shadow-lg shadow-gold/20 sm:h-10 sm:w-10 sm:text-xl">
              🍿
            </span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap font-display text-lg font-extrabold leading-none tracking-tight sm:text-2xl">
                WatchParty <span className="text-marquee">Club</span>
              </span>
              <span className="hidden text-xs text-muted sm:block">{data.name || 'A shared shelf for everything your friends love'}</span>
            </span>
          </button>

          <div className="ml-auto flex items-center gap-2 lg:order-last lg:ml-0">
            <ThemeMenu />
            <MembersMenu onOpenProfile={(id) => go('friends', id)} onOpenFriends={() => go('friends')} />
          </div>

          {/* Phones & tablets: 5 equal buttons, icon above label. Wide screens: one pill-shaped bar. */}
          <nav className="grid w-full grid-cols-5 gap-1 rounded-2xl border border-line bg-surface/80 p-1 lg:ml-auto lg:flex lg:w-auto lg:rounded-full">
            {tabs.map((t) => (
              <button
                key={t.page}
                onClick={() => go(t.page)}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition lg:flex-row lg:gap-1.5 lg:rounded-full lg:px-3.5 lg:text-sm ${
                  page === t.page ? 'bg-gold text-ink shadow-md shadow-gold/25' : 'text-soft hover:bg-raised hover:text-cream'
                }`}
              >
                <span className="text-base leading-none lg:text-sm">{t.emoji}</span>
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
        {/* Marquee light bulbs along the bottom of the header */}
        <div className="marquee-lights opacity-70" />
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
        🧪 Test version — your club is saved on this device only. Shared clubs are coming soon!
      </footer>

      {!welcomed && <WelcomeDialog />}
    </div>
  )
}

export default App
