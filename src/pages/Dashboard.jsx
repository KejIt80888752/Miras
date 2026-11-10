import { useState } from 'react'
import { useStore, sampleDb } from '../store'
import { daysAgo, num, qtyFmt, today } from '../utils'
import { Head, StockBadge } from '../components/ui'
import { BillTable } from './History'
import { InvoiceModal } from '../components/Invoice'
import { CATALOG, CATEGORY_NAMES } from '../catalog'
import Icon from '../components/Icon'

export default function Dashboard() {
  const { db, money, low, replace, toast } = useStore()
  const [view, setView] = useState(null)
  const mon = today().slice(0, 7)
  const sum = (type, pred) => db.bills.filter((b) => b.type === type && pred(b)).reduce((s, b) => s + num(b.total), 0)
  const stockVal = db.products.reduce((s, p) => s + num(p.qty) * num(p.cost), 0)
  const lowList = db.products.filter((p) => num(p.qty) <= low(p))
  const days = Array.from({ length: 7 }, (_, i) => {
    const k = daysAgo(6 - i)
    const [y, m, d] = k.split('-')
    return { k, l: new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short' }), v: sum('out', (b) => b.date === k) }
  })
  const max = Math.max(1, ...days.map((d) => d.v))
  const recent = [...db.bills].sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created)).slice(0, 6)
  const empty = !db.products.length && !db.bills.length

  return (
    <>
      <Head title="Dashboard" sub={`${db.settings.bizName} · ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`}>
        <a className="btn" href="#/inventory">+ Product</a>
        <a className="btn primary" href="#/billing">+ New Bill</a>
      </Head>
      {empty && (
        <div className="card" style={{ marginBottom: 14 }}>
          <b>Welcome to Miras Carpets!</b> <span className="sub">Add your products to get started, or load demo data to explore.</span>
          <div className="toolbar" style={{ margin: '10px 0 0' }}>
            <a className="btn primary" href="#/inventory">Add first product</a>
            <button className="btn" onClick={() => { replace(sampleDb()); toast('Demo data loaded') }}>Load demo data</button>
          </div>
        </div>
      )}
      <div className="grid kpis k3">
        <Kpi l="Total Products" v={db.products.length} ic="box" c="c1" />
        <Kpi l="Stock Value (cost)" v={money(stockVal)} ic="value" c="c2" />
        <Kpi l="Low / Out of Stock" v={lowList.length} warn={lowList.length > 0} ic="alert" c="c3" />
        <Kpi l="Today's Sales" v={money(sum('out', (b) => b.date === today()))} ic="today" c="c4" />
        <Kpi l="Sales this month" v={money(sum('out', (b) => b.date.startsWith(mon)))} ic="up" c="c1" />
        <Kpi l="Purchases this month" v={money(sum('in', (b) => b.date.startsWith(mon)))} ic="cart" c="c5" />
      </div>
      <div className="grid kpis k3" style={{ marginTop: 16 }}>
        {CATEGORY_NAMES.filter((c) => c !== 'Other' || db.products.some((p) => p.category === 'Other')).map((c) => {
          const ps = db.products.filter((p) => p.category === c)
          return (
            <a key={c} href="#/inventory" className="card kpi cat-card">
              <div className="ic c2"><Icon name={CATALOG[c].icon} size={20} /></div>
              <div className="l">{c}</div>
              <div className="v">{qtyFmt(ps.reduce((s, p) => s + num(p.qty), 0))} <span className="sub" style={{ fontSize: 13, fontWeight: 400 }}>in stock · {ps.length} items</span></div>
              <div className="sub" style={{ fontSize: 12 }}>Value {money(ps.reduce((s, p) => s + num(p.qty) * num(p.cost), 0))}</div>
            </a>
          )
        })}
      </div>
      <div className="grid two">
        <div className="card">
          <h2>Sales — last 7 days</h2>
          <div className="bars">
            {days.map((d) => (
              <div className="bar" key={d.k} title={`${d.k}: ${money(d.v)}`}>
                <em>{d.v ? Math.round(d.v).toLocaleString('en-IN') : ''}</em>
                <i style={{ height: (d.v / max) * 100 + '%' }} />
                <span>{d.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Low stock alerts</h2>
          {lowList.length ? (
            <div className="tw"><table><tbody>
              <tr><th>Product</th><th className="n">Qty</th><th></th></tr>
              {lowList.slice(0, 8).map((p) => (
                <tr key={p.id}><td><span className="cat-name"><Icon name={(CATALOG[p.category] || CATALOG.Other).icon} style={{ color: 'var(--muted)' }} />{p.name}</span></td><td className="n">{qtyFmt(p.qty)} {p.unit}</td><td><StockBadge p={p} /></td></tr>
              ))}
            </tbody></table></div>
          ) : <div className="empty"><Icon name="check" size={22} style={{ color: 'var(--ok)', display: 'block', margin: '0 auto 6px' }} />All products are well stocked</div>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Recent bills</h2>
        {recent.length ? <BillTable list={recent} onView={setView} /> : <div className="empty">No bills yet</div>}
      </div>
      {view && <InvoiceModal bill={view} onClose={() => setView(null)} />}
    </>
  )
}

const IC = {
  box: 'M21 8 12 3 3 8v8l9 5 9-5zM12 12 3 8m9 4 9-4m-9 4v9',
  value: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4m0 4h.01',
  today: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  up: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  cart: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
}
const Kpi = ({ l, v, warn, ic, c }) => (
  <div className="card kpi">
    <div className={'ic ' + c}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={IC[ic]} /></svg></div>
    <div className="l">{l}</div><div className={'v' + (warn ? ' warn' : '')}>{v}</div>
  </div>
)
