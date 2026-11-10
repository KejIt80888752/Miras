import { useState } from 'react'
import { useStore, sampleDb } from '../store'
import { daysAgo, num, qtyFmt, today } from '../utils'
import { Head, StockBadge } from '../components/ui'
import { BillTable } from './History'
import { InvoiceModal } from '../components/Invoice'

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
        <a className="btn" href="#products">+ Product</a>
        <a className="btn primary" href="#billing">+ New Bill</a>
      </Head>
      {empty && (
        <div className="card" style={{ marginBottom: 14 }}>
          <b>Welcome to Miras!</b> <span className="sub">Products add panni start pannunga, illa demo data load panni paarunga.</span>
          <div className="toolbar" style={{ margin: '10px 0 0' }}>
            <a className="btn primary" href="#products">Add first product</a>
            <button className="btn" onClick={() => { replace(sampleDb()); toast('Demo data loaded') }}>Load demo data</button>
          </div>
        </div>
      )}
      <div className="grid kpis">
        <Kpi l="Total Products" v={db.products.length} />
        <Kpi l="Stock Value (cost)" v={money(stockVal)} />
        <Kpi l="Low / Out of Stock" v={lowList.length} warn={lowList.length > 0} />
        <Kpi l="Today's Sales" v={money(sum('out', (b) => b.date === today()))} />
        <Kpi l="Sales this month" v={money(sum('out', (b) => b.date.startsWith(mon)))} />
        <Kpi l="Purchases this month" v={money(sum('in', (b) => b.date.startsWith(mon)))} />
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
                <tr key={p.id}><td>{p.name}</td><td className="n">{qtyFmt(p.qty)} {p.unit}</td><td><StockBadge p={p} /></td></tr>
              ))}
            </tbody></table></div>
          ) : <div className="empty">Ellaa products-um stock la irukku 👍</div>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h2>Recent bills</h2>
        {recent.length ? <BillTable list={recent} onView={setView} /> : <div className="empty">Innum bills illa</div>}
      </div>
      {view && <InvoiceModal bill={view} onClose={() => setView(null)} />}
    </>
  )
}

const Kpi = ({ l, v, warn }) => (
  <div className="card kpi"><div className="l">{l}</div><div className={'v' + (warn ? ' warn' : '')}>{v}</div></div>
)
