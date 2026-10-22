import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.jsx'
import store from './store/store'
import { StoreProvider } from './store/StoreContext'

import './styles/index.css'
import './styles/login.css'
import './styles/register.css'
import './styles/layout.css'
import './styles/boards.css'
import './styles/board-detail.css'
import './styles/board-toolbar.css'
import './styles/board-settings.css'
import './styles/calendar.css'
import './styles/stats.css'
import './styles/achievements.css'
import './styles/tasks-list.css'
import './styles/modal.css'
import './styles/projects.css'
import './styles/views.css'
import './styles/profile.css'
import './styles/info-page.css'
import './styles/hotkeys.css'
import './styles/search.css'
import './styles/shop.css'
import './styles/dashboard.css'
import './styles/recurrence.css'
import './styles/create-task.css'
import './styles/admin.css'
import './styles/group.css'
import './styles/leaderboard.css'
import './styles/user-groups.css'
import './styles/templates.css'
// Мобильная адаптация — один @media (max-width: 899px), поэтому
// подключается последней: её точечные правила должны перебивать
// десктопные при равной специфичности. На широких экранах файл молчит.
import './styles/mobile.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <StoreProvider>
                <App />
            </StoreProvider>
        </Provider>
    </React.StrictMode>,
)