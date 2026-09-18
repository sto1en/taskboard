import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import './styles/index.css'
import './styles/login.css'
import './styles/register.css'
import './styles/layout.css'
import './styles/boards.css'
import './styles/board-detail.css'
import './styles/calendar.css'
import './styles/stats.css'
import './styles/tasks-list.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)