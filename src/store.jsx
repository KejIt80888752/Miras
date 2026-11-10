import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { calcBill, daysAgo, lowLimit, makeMoney, uid } from './utils'

const KEY = 'miras_db_v1'

export function freshDb() {
  return {
    settings: { bizName: 'Miras', address: '', phone: '', email: '', gstin: '', currency: '₹', lowStock: 5, defaultTax: 0, nextIn: 1, nextOut: 1 },
    products: [], parties: [], bills: [], adjustments: [],
  }
}

export function normalize(d) {
  const f = freshDb()
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
    ['A4-001', 'A4 Paper Ream (500)', 'Stationery', 'pack', 210, 260, 40, 10],
    ['PEN-BL', 'Ball Pen Blue', 'Stationery', 'box', 45, 60, 25, 5],
    ['NB-200', 'Notebook 200 pg', 'Stationery', 'pcs', 38, 55, 8, 15],
    ['INK-BK', 'Printer Ink Black', 'Printer', 'pcs', 420, 550, 3, 4],
    ['USB-32', 'USB Drive 32GB', 'Electronics', 'pcs', 260, 380, 14, 5],
    ['MSE-01', 'Wireless Mouse', 'Electronics', 'pcs', 310, 450, 0, 3],
    ['FIL-01', 'File Folder', 'Stationery', 'dozen', 90, 130, 12, 4],
    ['STP-01', 'Stapler Large', 'Office', 'pcs', 150, 220, 6, 3],
  ]
  P.forEach((r) => db.products.push({ id: uid(), sku: r[0], name: r[1], category: r[2], unit: r[3], cost: r[4], price: r[5], qty: r[6], reorder: r[7], created: Date.now() }))
  db.parties.push(
    { id: uid(), type: 'customer', name: 'Sri Ganesh Traders', phone: '94440 11111', address: 'T. Nagar' },
    { id: uid(), type: 'customer', name: 'Kavya School', phone: '', address: 'Adyar' },
    { id: uid(), type: 'supplier', name: 'Chennai Paper Mart', phone: '90030 22222', address: 'Parrys' },
  )
  const mk = (type, ago, pi, lines) => {
    const party = db.parties[pi]
    const items = lines.map(([i, q]) => { const p = db.products[i]; return { pid: p.id, name: p.name, unit: p.unit, qty: q, rate: type === 'out' ? p.price : p.cost } })
    const c = calcBill({ items, discount: 0, tax: 0 })
    const no = (type === 'out' ? 'INV-' : 'PUR-') + String(type === 'out' ? s.nextOut++ : s.nextIn++).padStart(4, '0')
    db.bills.push({ id: uid(), no, type, date: daysAgo(ago), partyId: party.id, partyName: party.name, items, discount: 0, tax: 0, sub: c.sub, taxAmt: 0, total: c.total, note: '', created: Date.now() - ago })
  }
  mk('in', 6, 2, [[0, 20], [2, 30]]); mk('out', 5, 0, [[0, 5], [1, 3]]); mk('out', 4, 1, [[2, 12], [6, 2]])
  mk('out', 2, 0, [[4, 3], [7, 1]]); mk('out', 1, 1, [[0, 4], [2, 6]]); mk('out', 0, 0, [[3, 1], [1, 2]])
  return db
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadDb)
  const [toastMsg, setToastMsg] = useState(null)
  const timer = useRef()

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(db)) }
    catch (e) { setToastMsg({ msg: 'Save aagala! Settings la backup download pannunga', err: true }) }
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

  const value = useMemo(() => ({
    db, update, replace: setDb, toast,
    money: makeMoney(db.settings.currency),
    low: (p) => lowLimit(p, db.settings),
    prod: (id) => db.products.find((p) => p.id === id),
  }), [db, update, toast])

  return (
    <StoreCtx.Provider value={value}>
      {children}
      <div className={'toast' + (toastMsg ? ' show' : '') + (toastMsg?.err ? ' err' : '')}>{toastMsg?.msg}</div>
    </StoreCtx.Provider>
  )
}

export const useStore = () => useContext(StoreCtx)
