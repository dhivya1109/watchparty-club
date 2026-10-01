/**
 * The app's colour themes. Each one is a set of token values in index.css
 * (look for :root[data-theme="…"]); this file only lists them and remembers the choice.
 */

export type ThemeId = 'premiere' | 'noir' | 'matinee' | 'drivein'

export const THEMES: { id: ThemeId; emoji: string; name: string; description: string; swatch: string[] }[] = [
  { id: 'premiere', emoji: '🎬', name: 'Premiere', description: 'Midnight blue & red carpet', swatch: ['#0b1120', '#1b2540', '#d22a46', '#ffd23f'] },
  { id: 'noir', emoji: '🖤', name: 'Noir', description: 'Plain black, silver screen', swatch: ['#000000', '#171717', '#f2f2f2', '#ff3b3b'] },
  { id: 'matinee', emoji: '☀️', name: 'Matinee', description: 'Light mode, paper tickets', swatch: ['#f5eee2', '#fffaf2', '#f0a500', '#d9412f'] },
  { id: 'drivein', emoji: '🌃', name: 'Drive-in', description: 'Neon signs, teal night', swatch: ['#071416', '#152c30', '#2ee6c5', '#ff4f8b'] },
]

const STORAGE_KEY = 'watchparty-club:theme'

export function loadTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (THEMES.some((t) => t.id === saved)) return saved as ThemeId
  } catch {
    // Storage blocked — fall through to the default
  }
  return 'premiere'
}

/** Switch the whole app to a theme, and remember it on this device. */
export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id
  // The browser's own bars (e.g. on phones) follow the page background.
  const background = THEMES.find((t) => t.id === id)!.swatch[0]
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // ignore
  }
}
