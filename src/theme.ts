/**
 * The app's colour themes. Each one is a set of token values in index.css
 * (look for :root[data-theme="…"]); this file only lists them and remembers the choice.
 */

export type ThemeId = 'marquee' | 'noir' | 'matinee' | 'festival'

export const THEMES: { id: ThemeId; emoji: string; name: string; description: string; swatch: string[] }[] = [
  { id: 'marquee', emoji: '🎭', name: 'Marquee', description: 'Soft velvet & warm gold', swatch: ['#1c1624', '#33293f', '#f6c56b', '#ff6b57'] },
  { id: 'noir', emoji: '🖤', name: 'Noir', description: 'Plain black, silver screen', swatch: ['#000000', '#171717', '#f2f2f2', '#ff3b3b'] },
  { id: 'matinee', emoji: '☀️', name: 'Matinee', description: 'Light mode, paper tickets', swatch: ['#f5eee2', '#fffaf2', '#f0a500', '#d9412f'] },
  { id: 'festival', emoji: '🌏', name: 'Festival', description: 'International filmy colours', swatch: ['#13061c', '#2c123d', '#ffa41b', '#ff2e88'] },
]

const STORAGE_KEY = 'watchparty-club:theme'

export function loadTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (THEMES.some((t) => t.id === saved)) return saved as ThemeId
  } catch {
    // Storage blocked — fall through to the default
  }
  return 'marquee'
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
