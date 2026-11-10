import { useState } from 'react'
import { useStore } from '../store'
import { fmtDate, num, qtyFmt, today } from '../utils'
import { Head } from '../components/ui'

export default function Reports() {
  const { db, money, prod } = useStore()
  const [from, setFrom] = useState(today().slice(0, 7) + '-01')
  const [to, setTo] = useState(today())
  const inRange = (b) => b.date >= from && b.date <= to
  const sales = db.bills.filter((b) => b.type === 'out' && inRange(b))
  const purch = db.bills.filter((b) => b.type === 'in' && inRange(b))

  const agg = {}
  sales.forEach((b) => {
    const ratio = b.sub ? (b.sub - b.discount) / b.sub : 1
    b.items.forEach((l) => {
      const p = prod(l.pid)
      const a = agg[l.pid] || (agg[l.pid] = { name: l.name, cat: p ? p.category : '', qty: 0, rev: 0, cost: 0 })
      a.qty += l.qty; a.rev += l.qty * l.rate * ratio; a.cost += l.qty * (p ? num(p.cost) : 0)
    })
  })
  const rows = Object.values(agg).sort((a, b) => b.rev - a.rev)
  const rev = rows.reduce((s, r) => s + r.rev, 0)
  const cost = rows.reduce((s, r) => s + r.cost, 0)
  const adj = db.adjustments.filter((a) => a.date >= from && a.date <= to).slice().reverse()

  return (
    <>
      <Head title="Reports" sub="Selected period ku sales, purchase, profit">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="sub">to</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </Head>
      <div className="grid kpis">
        <div className="card kpi"><div className="l">Sales ({sales.length} bills)</div><div className="v">{money(sales.reduce((s, b) => s + b.total, 0))}</div></div>
        <div className="card kpi"><div className="l">Purchases ({purch.length} bills)</div><div className="v">{money(purch.reduce((s, b) => s + b.total, 0))}</div></div>
        <div className="card kpi"><div className="l">Tax collected</div><div className="v">{money(sales.reduce((s, b) => s + b.taxAmt, 0))}</div></div>
        <div className="card kpi"><div className="l">Est. gross profit</div><div className="v">{money(rev - cost)}</div></div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Product-wise sales</h2>
        <p className="sub" style={{ margin: '-6px 0 10px' }}>Profit = sales (discount kazhichu, tax illama) − current cost price</p>
        {rows.length ? (
          <div className="tw"><table>
            <thead><tr><th>Product</th><th>Category</th><th className="n">Qty sold</th><th className="n">Sales</th><th className="n">Cost</th><th className="n">Profit</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.name}><td>{r.name}</td><td>{r.cat}</td><td className="n">{qtyFmt(r.qty)}</td><td className="n">{money(r.rev)}</td><td className="n">{money(r.cost)}</td><td className="n"><b>{money(r.rev - r.cost)}</b></td></tr>
            ))}</tbody>
          </table></div>
        ) : <div className="empty">Indha period la sales illa</div>}
      </div>
      {adj.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <h2>Stock adjustments</h2>
          <div className="tw"><table>
            <thead><tr><th>Date</th><th>Product</th><th className="n">Before</th><th className="n">After</th><th>Reason</th></tr></thead>
            <tbody>{adj.map((a) => (
              <tr key={a.id}><td>{fmtDate(a.date)}</td><td>{a.name}</td><td className="n">{qtyFmt(a.before)}</td><td className="n">{qtyFmt(a.after)}</td><td>{a.note}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}
    </>
  )
}
