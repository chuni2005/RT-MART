import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/styles/_reset.scss'
import './shared/styles/_common.scss'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
