import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClubProvider } from './store/ClubContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClubProvider>
      <App />
    </ClubProvider>
  </StrictMode>,
)
