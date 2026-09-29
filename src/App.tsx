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
    { page: 'search', emoji: '🔍', label: 'Search' },
    { page: 'club', emoji: '📋', label: `My Club${clubCount ? ` (${clubCount})` : ''}` },
    { page: 'tonight', emoji: '🎡', label: 'Tonight' },
    { page: 'stats', emoji: '📊', label: 'Stats' },
  ]

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">
              🍿 WatchParty <span className="text-violet-400">Club</span>
            </h1>
            <p className="hidden sm:block text-sm text-slate-400">A shared shelf for everything your friends love.</p>
          </div>
          <div className="ml-auto sm:ml-0 sm:order-last">
            <MembersMenu />
          </div>
          {/* Phones: 4 equal buttons, icon above label. Bigger screens: a row of tabs. */}
          <nav className="grid w-full grid-cols-4 gap-1 sm:flex sm:w-auto sm:ml-auto">
            {tabs.map((t) => (
              <button
                key={t.page}
                onClick={() => setPage(t.page)}
                className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 rounded-lg px-1 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition ${
                  page === t.page ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-base sm:text-sm leading-none">{t.emoji}</span>
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Search stays mounted (just hidden) so your search is still there when you come back. */}
      <div hidden={page !== 'search'}>
        <SearchPage />
      </div>
      {page === 'club' && <ClubPage onGoSearch={() => setPage('search')} />}
      {page === 'tonight' && <PickerPage onGoSearch={() => setPage('search')} />}
      {page === 'stats' && <StatsPage onGoSearch={() => setPage('search')} />}

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 text-center text-xs text-slate-500">
        🧪 Test version — your club is saved on this device only. Shared clubs are coming soon!
      </footer>
    </div>
  )
}

export default App
