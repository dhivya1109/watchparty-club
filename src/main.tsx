import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClubProvider } from './store/ClubContext.tsx'
import { applyTheme, loadTheme } from './theme.ts'

// Apply the saved theme before the first paint, so the page never flashes the wrong colours.
applyTheme(loadTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClubProvider>
      <App />
    </ClubProvider>
  </StrictMode>,
)
