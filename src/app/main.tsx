import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TimerApp } from './TimerApp'
import './design/global.css'
import { readSurface } from './lib/surface'
import { timerRuntime } from './runtime/runtime'

const container = document.getElementById('root')
if (!container) throw new Error('1-click timer: missing #root container')

createRoot(container).render(
    <StrictMode>
        <TimerApp surface={readSurface()} runtime={timerRuntime} />
    </StrictMode>,
)
