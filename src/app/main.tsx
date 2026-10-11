import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './design/global.css'

const container = document.getElementById('root')
if (!container) throw new Error('1-click timer: missing #root container')

createRoot(container).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
