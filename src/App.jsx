import { useEffect, useState } from 'react'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Billing from './pages/Billing'
import History from './pages/History'
import Parties from './pages/Parties'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { ROLES } from './auth'

const ICONS = {
  dashboard: 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z',
  products: 'M21 8 12 3 3 8v8l9 5 9-5zM12 12 3 8m9 4 9-4m-9 4v9',
  billing: 'M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5M12 7v5l3 3',
  parties: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  reports: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
}

const PAGES = [
  ['dashboard', 'Dashboard', Dashboard, 'dashboard'],
  ['inventory', 'Products & Stock', Products, 'products'],
  ['billing', 'Sale / Purchase', Billing, 'billing'],
  ['bills', 'Bills History', History, 'history'],
  ['customers', 'Customers & Suppliers', Parties, 'parties'],
  ['reports', 'Reports', Reports, 'reports'],
  ['settings', 'Settings', Settings, 'settings'],
]

const LOGO = import.meta.env.BASE_URL + 'the-raise-logo.png'

const route = () => location.hash.replace(/^#\/?/, '').split('?')[0] || 'dashboard'

export default function App() {
  const { db, user, logout } = useStore()
  const [page, setPage] = useState(route)
  useEffect(() => {
    const on = () => { setPage(route()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const allowed = user ? ROLES[user.role] || ROLES.Sales : []
  // redirect rules: not logged in -> login, logged in on login/unknown page -> dashboard
  useEffect(() => {
    if (!user && page !== 'login') location.replace('#/login')
    else if (user && (page === 'login' || !allowed.includes(page))) location.replace('#/dashboard')
  }, [user, page]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Login />
  const cur = PAGES.find((p) => p[0] === page && allowed.includes(p[0])) || PAGES[0]
  const Page = cur[2]
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="app">
      <aside>
        <a className="brand" href="#/dashboard">
          <div className="emblem">M</div>
          <div><b>{db.settings.bizName || 'Miras Carpets'}</b><small>Carpets · Shawls · Jewels</small></div>
        </a>
        <nav>
          {PAGES.filter((p) => allowed.includes(p[0])).map(([k, l, , ic]) => (
            <a key={k} href={'#/' + k} className={k === cur[0] ? 'active' : ''} title={l}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[ic]} /></svg>
              <span>{l}</span>
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <div className="avatar">{initials}</div>
            <div><b>{user.name}</b><span>{user.role}</span></div>
          </div>
          <button className="signout" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            <span>Sign Out</span>
          </button>
          <div className="powered">
            <div className="pl">POWERED BY</div>
            <img src={LOGO} alt="The Raise" />
            <div className="co">KEJ IT Solutions</div>
          </div>
        </div>
      </aside>
      <main>
        <Page key={cur[0]} />
        <div className="powered-mobile">
          <div className="pl">POWERED BY</div>
          <img src={LOGO} alt="The Raise" />
          <div className="co">KEJ IT Solutions</div>
        </div>
      </main>
    </div>
  )
}
