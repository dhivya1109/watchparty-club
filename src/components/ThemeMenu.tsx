import { useState } from 'react'
import { applyTheme, loadTheme, THEMES, type ThemeId } from '../theme'
import { Portal } from './ui'

/** 🎨 Header button: pick one of the colour themes. */
export function ThemeMenu() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<ThemeId>(loadTheme)

  const choose = (id: ThemeId) => {
    applyTheme(id)
    setCurrent(id)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change theme"
        title="Change theme"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-base transition hover:border-gold"
      >
        🎨
      </button>

      {open && (
        <>
          <Portal>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          </Portal>
          <div className="animate-pop absolute right-0 z-30 mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-3xl border border-line bg-surface p-4 shadow-2xl shadow-black/40">
            <h3 className="text-lg font-bold">🎨 Choose your cinema</h3>
            <p className="text-xs text-muted">Saved on this device.</p>
            <div className="mt-3 flex flex-col gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => choose(t.id)}
                  aria-pressed={current === t.id}
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                    current === t.id ? 'border-gold bg-gold/10' : 'border-line hover:border-muted'
                  }`}
                >
                  {/* A tiny preview of the theme's colours */}
                  <span
                    className="relative flex h-10 w-14 shrink-0 items-end gap-0.5 overflow-hidden rounded-lg p-1 ring-1 ring-black/10"
                    style={{ background: t.swatch[0] }}
                  >
                    <span className="h-5 flex-1 rounded-sm" style={{ background: t.swatch[1] }} />
                    <span className="h-7 flex-1 rounded-sm" style={{ background: t.swatch[2] }} />
                    <span className="h-3 flex-1 rounded-sm" style={{ background: t.swatch[3] }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-bold">
                      {t.emoji} {t.name}
                    </span>
                    <span className="block text-xs text-muted">{t.description}</span>
                  </span>
                  {current === t.id && <span className="text-accent">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
