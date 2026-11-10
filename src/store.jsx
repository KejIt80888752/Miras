import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { calcBill, daysAgo, lowLimit, makeMoney, uid } from './utils'
import { detailText } from './catalog'
import { DEFAULT_USERS, getSession, hashPassword, setSession } from './auth'

const KEY = 'miras_db_v1'
const UKEY = 'miras_users_v1'

export function freshDb() {
  return {
    settings: { bizName: 'Miras Carpets', address: '', phone: '', email: '', gstin: '', currency: '₹', lowStock: 5, defaultTax: 0, nextIn: 1, nextOut: 1, showDemoLogins: true },
    products: [], parties: [], bills: [], adjustments: [],
  }
}

export function normalize(d) {
  const f = freshDb()
  if (d.settings && d.settings.bizName === 'Miras') d.settings.bizName = 'Miras Carpets'
  return {
    ...f, ...d,
    settings: { ...f.settings, ...(d.settings || {}) },
    parties: d.parties || [], bills: d.bills || [], adjustments: d.adjustments || [],
  }
}

function loadDb() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY))
    if (d && Array.isArray(d.products)) return normalize(d)
  } catch (e) { /* ignore */ }
  return freshDb()
}

export function sampleDb() {
  const db = freshDb()
  const s = db.settings
  s.address = '12, Main Road, Chennai'
  s.phone = '98400 00000'
  const P = [
    ['CR-101', 'Kashmiri Silk Carpet', 'Carpets', 'pcs', 85000, 125000, 4, 2, { size: '6 × 9 ft', material: 'Silk', knots: '400', origin: 'Kashmir', color: 'Red, Floral' }],
    ['CR-102', 'Persian Wool Carpet', 'Carpets', 'pcs', 42000, 65000, 6, 2, { size: '5 × 8 ft', material: 'Wool', origin: 'Persian', color: 'Navy, Medallion' }],
    ['CR-103', 'Hand-tufted Runner', 'Carpets', 'pcs', 6500, 11000, 1, 2, { size: '2.5 × 10 ft', material: 'Wool', origin: 'Bhadohi', color: 'Beige' }],
    ['SH-201', 'Pashmina Sozni Shawl', 'Shawls', 'pcs', 9500, 16000, 12, 4, { material: 'Pashmina', work: 'Sozni', size: '40 × 80 in', color: 'Maroon' }],
    ['SH-202', 'Kani Wool Shawl', 'Shawls', 'pcs', 14000, 24000, 5, 3, { material: 'Wool', work: 'Kani', size: '40 × 80 in', color: 'Ivory' }],
    ['SH-203', 'Silk Stole', 'Shawls', 'pcs', 1800, 3200, 20, 6, { material: 'Silk', work: 'Printed', size: '28 × 72 in', color: 'Teal' }],
    ['JW-301', 'Kundan Necklace Set', 'Jewels', 'set', 28000, 42000, 3, 2, { metal: 'Gold', purity: '22K', weight: '18.5', stones: 'Kundan, Pearl', type: 'Set' }],
    ['JW-302', 'Silver Jhumka Earrings', 'Jewels', 'pair', 1600, 2800, 15, 5, { metal: 'Silver', purity: '925 Sterling', weight: '14', type: 'Earrings' }],
    ['JW-303', 'Ruby Gold Ring', 'Jewels', 'pcs', 19500, 27500, 0, 2, { metal: 'Gold', purity: '18K', weight: '4.2', stones: 'Ruby', type: 'Ring' }],
  ]
  P.forEach((r) => db.products.push({ id: uid(), sku: r[0], name: r[1], category: r[2], unit: r[3], cost: r[4], price: r[5], qty: r[6], reorder: r[7], attrs: r[8], created: Date.now() }))
  db.parties.push(
    { id: uid(), type: 'customer', name: 'Mrs. Lakshmi Raman', phone: '94440 11111', address: 'Besant Nagar' },
    { id: uid(), type: 'customer', name: 'Hotel Grand Residency', phone: '044 2345 6789', address: 'Nungambakkam' },
    { id: uid(), type: 'supplier', name: 'Srinagar Handloom House', phone: '90030 22222', address: 'Srinagar, J&K' },
  )
  const mk = (type, ago, pi, lines) => {
    const party = db.parties[pi]
    const items = lines.map(([i, q]) => { const p = db.products[i]; return { pid: p.id, name: p.name, desc: detailText(p), unit: p.unit, qty: q, rate: type === 'out' ? p.price : p.cost } })
    const c = calcBill({ items, discount: 0, tax: 0 })
    const no = (type === 'out' ? 'INV-' : 'PUR-') + String(type === 'out' ? s.nextOut++ : s.nextIn++).padStart(4, '0')
    db.bills.push({ id: uid(), no, type, date: daysAgo(ago), partyId: party.id, partyName: party.name, items, discount: 0, tax: 0, sub: c.sub, taxAmt: 0, total: c.total, note: '', created: Date.now() - ago })
  }
  mk('in', 6, 2, [[3, 10], [4, 4]]); mk('out', 5, 0, [[3, 1], [7, 2]]); mk('out', 4, 1, [[1, 2]])
  mk('out', 2, 0, [[6, 1]]); mk('out', 1, 1, [[0, 1], [5, 4]]); mk('out', 0, 0, [[4, 1], [7, 1]])
  return db
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadDb)
  const [toastMsg, setToastMsg] = useState(null)
  const timer = useRef()

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) }
    catch (e) { setToastMsg({ msg: 'Could not save data. Please download a backup from Settings.', err: true }) }
  }, [db])

  const toast = useCallback((msg, err = false) => {
    setToastMsg({ msg, err })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToastMsg(null), 2400)
  }, [])

  // update(draft => { ...mutate... }) — works on a deep copy
  const update = useCallback((fn) => {
    setDb((prev) => { const draft = structuredClone(prev); const r = fn(draft); return r || draft })
  }, [])

  // ---- users & login (kept apart from business data, so demo/reset never touches accounts)
  const [users, setUsers] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem(UKEY)); if (Array.isArray(u) && u.length) return u } catch { /* ignore */ }
    return DEFAULT_USERS
  })
  useEffect(() => { try { localStorage.setItem(UKEY, JSON.stringify(users)) } catch { /* ignore */ } }, [users])
  const [sessionId, setSessionId] = useState(getSession)
  const user = users.find((u) => u.id === sessionId) || null
  const login = useCallback(async (email, pw) => {
    const h = await hashPassword(pw)
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.hash === h)
    if (u) { setSession(u.id); setSessionId(u.id) }
    return u
  }, [users])
  const logout = useCallback(() => { setSession(null); setSessionId(null) }, [])

  const value = useMemo(() => ({
    db, update, replace: setDb, toast,
    money: makeMoney(db.settings.currency),
    low: (p) => lowLimit(p, db.settings),
    prod: (id) => db.products.find((p) => p.id === id),
    users, setUsers, user, login, logout,
  }), [db, update, toast, users, user, login, logout])

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className={'toast' + (toastMsg ? ' show' : '') + (toastMsg?.err ? ' err' : '')}>{toastMsg?.msg}</div>
    </StoreCtx.Provider>
  )
}

export const useStore = () => useContext(StoreCtx)
