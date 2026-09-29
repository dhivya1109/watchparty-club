const types = [
  { emoji: '🎬', label: 'Movies' },
  { emoji: '📺', label: 'Series' },
  { emoji: '🍥', label: 'Anime' },
  { emoji: '📚', label: 'Books' },
]

function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold">
        🍿 WatchParty <span className="text-violet-400">Club</span>
      </h1>
      <p className="max-w-md text-slate-400">
        A shared shelf for everything your friends love.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {types.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl bg-slate-900 border border-slate-800 px-6 py-5 hover:border-violet-500 transition"
          >
            <div className="text-3xl">{t.emoji}</div>
            <div className="mt-2 font-medium">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">Setup complete ✅ — search coming next.</p>
    </main>
  )
}

export default App
