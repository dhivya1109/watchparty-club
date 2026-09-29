import { useState } from 'react'
import { ClubPage } from './components/ClubPage'
import { MembersMenu } from './components/MembersMenu'
import { PickerPage } from './components/PickerPage'
import { SearchPage } from './components/SearchPage'
import { useClub } from './store/ClubContext'

type Page = 'search' | 'club' | 'tonight'

function App() {
  const [page, setPage] = useState<Page>('search')
  const clubCount = Object.keys(useClub().data.titles).length

  const tabs: { page: Page; label: string }[] = [
    { page: 'search', label: '🔍 Search' },
    { page: 'club', label: `📋 My Club${clubCount ? ` (${clubCount})` : ''}` },
    { page: 'tonight', label: '🎡 Tonight' },
  ]

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <h1 className="text-2xl font-bold">
              🍿 WatchParty <span className="text-violet-400">Club</span>
            </h1>
            <p className="text-sm text-slate-400">A shared shelf for everything your friends love.</p>
          </div>
          <div className="sm:order-last">
            <MembersMenu />
          </div>
          <nav className="flex gap-1 overflow-x-auto sm:ml-auto">
            {tabs.map((t) => (
              <button
                key={t.page}
                onClick={() => setPage(t.page)}
                className={`shrink-0 rounded-lg px-3 sm:px-4 py-2 text-sm font-medium transition ${
                  page === t.page ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
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
    </div>
  )
}

export default App
