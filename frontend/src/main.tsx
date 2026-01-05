import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/styles/_reset.scss'
import './shared/styles/_common.scss'
import './shared/components/Header/i18n' // 導入 i18n 配置
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
