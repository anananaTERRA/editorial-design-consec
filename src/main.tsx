import publication from '../content/document.json'
import { App } from './App'
import { resolveProfile } from './engine/profile'
import '@fontsource/instrument-sans/latin-400.css'
import '@fontsource/instrument-sans/latin-500.css'
import '@fontsource/instrument-sans/latin-600.css'
import '@fontsource/instrument-sans/latin-700.css'
import './styles/index.css'
import '@editorial-profile-css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const profile = resolveProfile(import.meta.env.MODE)
document.documentElement.dataset.profile = profile
document.documentElement.lang = publication.language
document.title = publication.title

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root is missing')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
