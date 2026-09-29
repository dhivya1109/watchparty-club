import { useState } from 'react'
import { ClubPage } from './components/ClubPage'
import { MembersMenu } from './components/MembersMenu'
import { PickerPage } from './components/PickerPage'
import { SearchPage } from './components/SearchPage'
import { StatsPage } from './components/StatsPage'
import { useClub } from './store/ClubContext'

type Page = 'search' | 'club' | 'tonight' | 'stats'

function App() {
  const [page, setPage] = useState<Page>('search')
  const clubCount = Object.keys(useClub().data.titles).length

  const tabs: { page: Page; emoji: string; label: string }[] = [
    { page: 'search', emoji: '🔍', label: 'Discover' },
    { page: 'club', emoji: '🎟️', label: `My Club${clubCount ? ` · ${clubCount}` : ''}` },
    { page: 'tonight', emoji: '🎡', label: 'Tonight' },
    { page: 'stats', emoji: '📊', label: 'Stats' },
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-night/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <button onClick={() => setPage('search')} className="flex min-w-0 items-center gap-2.5 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-coral text-lg shadow-lg shadow-gold/20 sm:h-10 sm:w-10 sm:text-xl">
              🍿
            </span>
            <span className="min-w-0">
              <span className="block whitespace-nowrap font-display text-lg font-extrabold leading-none tracking-tight sm:text-2xl">
                WatchParty <span className="text-marquee">Club</span>
              </span>
              <span className="hidden text-xs text-muted sm:block">A shared shelf for everything your friends love</span>
            </span>
          </button>

          <div className="ml-auto sm:order-last sm:ml-0">
            <MembersMenu />
          </div>

          {/* Phones: 4 equal buttons, icon above label. Bigger screens: one pill-shaped bar. */}
          <nav className="grid w-full grid-cols-4 gap-1 rounded-2xl border border-line bg-surface/80 p-1 sm:ml-auto sm:flex sm:w-auto sm:rounded-full">
            {tabs.map((t) => (
              <button
                key={t.page}
                onClick={() => setPage(t.page)}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-4 sm:py-1.5 sm:text-sm ${
                  page === t.page
                    ? 'bg-gold text-night shadow-md shadow-gold/25'
                    : 'text-soft hover:bg-raised hover:text-cream'
                }`}
              >
                <span className="text-base leading-none sm:text-sm">{t.emoji}</span>
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
        {/* Marquee light bulbs along the bottom of the header */}
        <div className="marquee-lights opacity-70" />
      </header>

      {/* Search stays mounted (just hidden) so your search is still there when you come back. */}
      <div hidden={page !== 'search'}>
        <SearchPage />
      </div>
      {page !== 'search' && (
        <main key={page} className="animate-pop">
          {page === 'club' && <ClubPage onGoSearch={() => setPage('search')} />}
          {page === 'tonight' && <PickerPage onGoSearch={() => setPage('search')} />}
          {page === 'stats' && <StatsPage onGoSearch={() => setPage('search')} />}
        </main>
      )}

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-center text-xs text-muted">
        🧪 Test version — your club is saved on this device only. Shared clubs are coming soon!
      </footer>
    </div>
  )
}

export default App
