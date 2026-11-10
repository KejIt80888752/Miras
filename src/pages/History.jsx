import { useState } from 'react'
import { useStore } from '../store'
import { download, fmtDate, num, r2, toCSV, today } from '../utils'
import { Head, Modal } from '../components/ui'
import { InvoiceModal } from '../components/Invoice'

export function BillTable({ list, onView, onDelete }) {
  const { money } = useStore()
  return (
    <div className="tw"><table>
      <thead><tr><th>Bill No</th><th>Date</th><th>Type</th><th>Party</th><th className="n">Items</th><th className="n">Total</th><th></th></tr></thead>
      <tbody>
        {list.map((b) => (
          <tr key={b.id}>
            <td><b>{b.no}</b></td><td>{fmtDate(b.date)}</td>
            <td>{b.type === 'out' ? <span className="badge b-ok">Sale</span> : <span className="badge b-in">Purchase</span>}</td>
            <td>{b.partyName}</td><td className="n">{b.items.length}</td><td className="n"><b>{money(b.total)}</b></td>
            <td>
              <button className="btn sm" onClick={() => onView(b)}>View</button>
              {onDelete && <> <button className="btn sm danger" onClick={() => onDelete(b)}>Delete</button></>}
            </td>
          </tr>
        ))}
      </tbody>
    </table></div>
  )
}

export default function History() {
  const { db, money, update, toast } = useStore()
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [view, setView] = useState(null)
  const [del, setDel] = useState(null)

  const ql = q.toLowerCase()
  const list = db.bills
    .filter((b) => (!type || b.type === type) && (!ql || (b.no + ' ' + b.partyName).toLowerCase().includes(ql)) && (!from || b.date >= from) && (!to || b.date <= to))
    .sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created))
  const sales = list.filter((b) => b.type === 'out').reduce((s, b) => s + b.total, 0)
  const purch = list.filter((b) => b.type === 'in').reduce((s, b) => s + b.total, 0)

  const exportCsv = () => {
    const rows = [['Bill No', 'Date', 'Type', 'Party', 'Item', 'Qty', 'Rate', 'Amount', 'Bill Subtotal', 'Discount', 'Tax %', 'Bill Total']]
    list.forEach((b) => b.items.forEach((l) => rows.push([b.no, b.date, b.type === 'out' ? 'Sale' : 'Purchase', b.partyName, l.name, l.qty, l.rate, r2(l.qty * l.rate), b.sub, b.discount, b.tax, b.total])))
    download(`miras-bills-${today()}.csv`, toCSV(rows), 'text/csv')
  }

  const doDelete = () => {
    update((d) => {
      del.items.forEach((l) => { const p = d.products.find((x) => x.id === l.pid); if (p) p.qty = r2(num(p.qty) + (del.type === 'out' ? l.qty : -l.qty)) })
      d.bills = d.bills.filter((x) => x.id !== del.id)
    })
    toast('Bill deleted, stock reverted')
    setDel(null)
  }

  return (
    <>
      <Head title="Bills History" sub="All sales and purchases"><button className="btn" onClick={exportCsv}>Export CSV</button></Head>
      <div className="toolbar">
        <input type="search" placeholder="Bill no / party name…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="">All</option><option value="out">Sales</option><option value="in">Purchases</option></select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
      </div>
      <p className="sub" style={{ margin: '0 0 10px' }}>{list.length} bills · Sales <b>{money(sales)}</b> · Purchases <b>{money(purch)}</b></p>
      {list.length ? <BillTable list={list} onView={setView} onDelete={setDel} /> : <div className="card empty">No bills found</div>}
      {view && <InvoiceModal bill={view} onClose={() => setView(null)} />}
      {del && (
        <Modal title="Delete bill?" onClose={() => setDel(null)}
          footer={<><button className="btn" onClick={() => setDel(null)}>Cancel</button><button className="btn primary" onClick={doDelete}>Delete</button></>}>
          <p style={{ margin: 0 }}><b>{del.no}</b> will be deleted and its stock will be {del.type === 'out' ? 'added back' : 'reduced'}.</p>
        </Modal>
      )}
    </>
  )
}
