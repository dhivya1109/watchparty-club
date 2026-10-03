/**
 * The app's colour themes. Each one is a set of token values in index.css
 * (look for :root[data-theme="…"]); this file only lists them and remembers the choice.
 */

export type ThemeId = 'screening' | 'noir' | 'matinee' | 'script' | 'chat'

export const THEMES: { id: ThemeId; emoji: string; name: string; description: string; swatch: string[] }[] = [
  { id: 'noir', emoji: '🖤', name: 'Noir', description: 'Plain black, silver screen', swatch: ['#000000', '#171717', '#f2f2f2', '#ff3b3b'] },
  { id: 'screening', emoji: '🎦', name: 'Screening Room', description: 'Warm dark, like a cinema', swatch: ['#16130f', '#2a251f', '#b84c37', '#d9a55a'] },
  { id: 'matinee', emoji: '☀️', name: 'Matinee', description: 'Light mode, paper tickets', swatch: ['#f5eee2', '#fffaf2', '#e2b462', '#d9412f'] },
  { id: 'script', emoji: '📝', name: 'Script', description: 'Paper, ink & typewriter', swatch: ['#f3f1ec', '#fdfcf9', '#1b1a17', '#b0302a'] },
  { id: 'chat', emoji: '💬', name: 'Group Chat', description: 'Cool greys & blurple', swatch: ['#1e1f22', '#313338', '#5865f2', '#fee75c'] },
]

// Only a theme picked from the menu is stored. (New key: older visits saved the default automatically.)
const STORAGE_KEY = 'watchparty-club:theme-choice'

export function loadTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (THEMES.some((t) => t.id === saved)) return saved as ThemeId
  } catch {
    // Storage blocked — fall through to the default
  }
  return 'noir'
}

/** Switch the whole app to a theme; `remember` it on this device when the person picked it. */
export function applyTheme(id: ThemeId, remember = false) {
  document.documentElement.dataset.theme = id
  // The browser's own bars (e.g. on phones) follow the page background.
  const background = THEMES.find((t) => t.id === id)!.swatch[0]
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
  if (!remember) return
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // ignore
  }
}
