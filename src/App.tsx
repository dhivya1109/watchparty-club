import { SearchPage } from './components/SearchPage'

function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-2xl font-bold">
            🍿 WatchParty <span className="text-violet-400">Club</span>
          </h1>
          <p className="text-sm text-slate-400">A shared shelf for everything your friends love.</p>
        </div>
      </header>
      <SearchPage />
    </div>
  )
}

export default App
