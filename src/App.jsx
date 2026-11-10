import { useEffect, useState } from 'react'
import { useStore } from './store'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Billing from './pages/Billing'
import History from './pages/History'
import Parties from './pages/Parties'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

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
  ['dashboard', 'Dashboard', Dashboard, 'Overview'],
  ['products', 'Products & Stock', Products, 'Inventory'],
  ['billing', 'Sale / Purchase', Billing, 'Sales'],
  ['history', 'Bills History', History],
  ['parties', 'Customers & Suppliers', Parties],
  ['reports', 'Reports', Reports, 'Insights'],
  ['settings', 'Settings', Settings],
]

const LOGO = import.meta.env.BASE_URL + 'the-raise-logo.png'
const Powered = ({ className }) => (
  <div className={className}>
    <div className="pl">POWERED BY</div>
    <img src={LOGO} alt="The Raise" />
    <div className="co">KEJ IT Solutions</div>
  </div>
)

const getPage = () => { const h = location.hash.slice(1); return PAGES.some((p) => p[0] === h) ? h : 'dashboard' }

function toggleTheme() {
  const root = document.documentElement
  const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const next = cur === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  try { localStorage.setItem('miras_theme', next) } catch (e) { /* ignore */ }
}
try { const t = localStorage.getItem('miras_theme'); if (t) document.documentElement.dataset.theme = t } catch (e) { /* ignore */ }

export default function App() {
  const { db } = useStore()
  const [page, setPage] = useState(getPage)
  useEffect(() => {
    const on = () => { setPage(getPage()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const Page = PAGES.find((p) => p[0] === page)[2]

  return (
    <div className="app">
      <aside>
        <a className="brand" href="#dashboard" style={{ textDecoration: 'none' }}>
          <div className="emblem">M</div>
          <div><b>{db.settings.bizName || 'Miras Carpets'}</b><small>Carpets · Shawls · Jewels</small></div>
        </a>
        <nav>
          {PAGES.map(([k, l, , group]) => (
            <div key={k} style={{ display: 'contents' }}>
              {group && <div className="nav-label">{group}</div>}
              <a href={'#' + k} className={k === page ? 'active' : ''} title={l}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[k]} /></svg>
                <span>{l}</span>
              </a>
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-user">
            <div className="avatar">A</div>
            <div><b>Admin</b><span>{db.settings.bizName}</span></div>
            <button className="btn sm icon theme-btn" onClick={toggleTheme} title="Light / Dark theme">◐</button>
          </div>
          <Powered className="powered" />
        </div>
      </aside>
      <main>
        <Page key={page} />
        <Powered className="powered-mobile" />
      </main>
    </div>
  )
}
