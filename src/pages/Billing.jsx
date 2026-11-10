import { useState } from 'react'
import { useStore } from '../store'
import { calcBill, num, qtyFmt, r2, today, uid } from '../utils'
import { Field, Head, Seg } from '../components/ui'
import { CATEGORY_NAMES, detailText } from '../catalog'
import { InvoiceModal } from '../components/Invoice'

const blankItem = () => ({ key: uid(), pid: '', qty: 1, rate: 0 })
const newBill = (type, tax) => ({ type, date: today(), party: '', items: [blankItem()], discount: 0, tax: num(tax), note: '' })

export default function Billing() {
  const { db, replace, toast, money, prod } = useStore()
  const [bill, setBill] = useState(() => newBill('out', db.settings.defaultTax))
  const [saved, setSaved] = useState(null)
  const isOut = bill.type === 'out'
  const set = (patch) => setBill((b) => ({ ...b, ...patch }))
  const setItem = (i, patch) => setBill((b) => ({ ...b, items: b.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) }))

  const switchType = (t) => {
    if (t === bill.type) return
    set({ type: t, party: '', items: bill.items.map((it) => { const p = prod(it.pid); return p ? { ...it, rate: num(t === 'out' ? p.price : p.cost) } : it }) })
  }
  const pick = (i, pid) => { const p = prod(pid); setItem(i, { pid, rate: p ? num(isOut ? p.price : p.cost) : 0 }) }
  const removeItem = (i) => setBill((b) => { const items = b.items.filter((_, j) => j !== i); return { ...b, items: items.length ? items : [blankItem()] } })

  const totals = calcBill(bill)
  const names = db.parties.filter((p) => p.type === (isOut ? 'customer' : 'supplier')).map((p) => p.name)
  const opts = [...db.products].sort((a, b) => a.name.localeCompare(b.name))

  const save = () => {
    const items = bill.items.filter((it) => it.pid && num(it.qty) > 0)
    if (!items.length) return toast('Kuraindhadhu oru product + qty venum', true)
    if (!bill.date) return toast('Date select pannunga', true)
    if (isOut) {
      const need = {}
      items.forEach((it) => (need[it.pid] = (need[it.pid] || 0) + num(it.qty)))
      for (const pid in need) { const p = prod(pid); if (need[pid] > num(p.qty) + 1e-9) return toast(`"${p.name}" stock pathala (irukkuradhu ${qtyFmt(p.qty)})`, true) }
    }
    const d = structuredClone(db)
    {
      const s = d.settings
      const no = (isOut ? 'INV-' : 'PUR-') + String(isOut ? s.nextOut++ : s.nextIn++).padStart(4, '0')
      const partyName = bill.party.trim() || (isOut ? 'Walk-in Customer' : 'Supplier')
      const ptype = isOut ? 'customer' : 'supplier'
      let party = d.parties.find((p) => p.type === ptype && p.name.toLowerCase() === partyName.toLowerCase())
      if (!party && bill.party.trim()) { party = { id: uid(), type: ptype, name: partyName, phone: '', address: '' }; d.parties.push(party) }
      const lines = items.map((it) => { const p = d.products.find((x) => x.id === it.pid); return { pid: it.pid, name: p.name, desc: detailText(p), unit: p.unit, qty: r2(num(it.qty)), rate: num(it.rate) } })
      lines.forEach((l) => { const p = d.products.find((x) => x.id === l.pid); p.qty = r2(num(p.qty) + (isOut ? -l.qty : l.qty)); if (!isOut && l.rate > 0) p.cost = l.rate })
      const c = calcBill({ items: lines, discount: bill.discount, tax: bill.tax })
      var created = { id: uid(), no, type: bill.type, date: bill.date, partyId: party ? party.id : '', partyName, items: lines, discount: num(bill.discount), tax: num(bill.tax), sub: c.sub, taxAmt: c.taxAmt, total: c.total, note: bill.note.trim(), created: Date.now() }
      d.bills.push(created)
    }
    replace(d)
    toast(created.no + ' saved')
    setSaved(created)
    setBill(newBill(bill.type, db.settings.defaultTax))
  }

  return (
    <>
      <Head title={isOut ? 'New Sale' : 'New Purchase'} sub={isOut ? 'Customer ku vikkura bill — stock kuraiyum' : 'Supplier kitta vaangura bill — stock koodum'}>
        <Seg value={bill.type} options={[['out', 'Sale'], ['in', 'Purchase']]} onChange={switchType} />
      </Head>
      {!db.products.length ? (
        <div className="card empty">Mudhalla products add pannunga. <a href="#/inventory">Products page →</a></div>
      ) : (
        <div className="card">
          <div className="form" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <Field label={isOut ? 'Customer name' : 'Supplier name'}>
              <input value={bill.party} list="partyList" placeholder={isOut ? 'Walk-in customer' : 'Supplier name'} onChange={(e) => set({ party: e.target.value })} />
              <datalist id="partyList">{names.map((n) => <option key={n} value={n} />)}</datalist>
            </Field>
            <Field label="Date"><input type="date" value={bill.date} onChange={(e) => set({ date: e.target.value })} /></Field>
          </div>
          <div className="tw" style={{ marginTop: 14 }}>
            <table className="items">
              <thead><tr><th style={{ width: '42%' }}>Product</th><th className="n">Stock</th><th>Qty</th><th>Rate</th><th className="n">Amount</th><th></th></tr></thead>
              <tbody>
                {bill.items.map((it, i) => {
                  const p = prod(it.pid)
                  return (
                    <tr key={it.key}>
                      <td>
                        <select value={it.pid} onChange={(e) => pick(i, e.target.value)}>
                          <option value="">— Select product —</option>
                          {CATEGORY_NAMES.map((c) => {
                            const group = opts.filter((o) => (CATEGORY_NAMES.includes(o.category) ? o.category : 'Other') === c)
                            return group.length ? (
                              <optgroup key={c} label={c}>
                                {group.map((o) => <option key={o.id} value={o.id}>{o.name}{o.sku ? ` (${o.sku})` : ''}</option>)}
                              </optgroup>
                            ) : null
                          })}
                        </select>
                        {p && detailText(p) && <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>{detailText(p)}</div>}
                      </td>
                      <td className="n">{p ? `${qtyFmt(p.qty)} ${p.unit}` : '—'}</td>
                      <td><input className="q" type="number" step="any" min="0" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} /></td>
                      <td><input className="r" type="number" step="any" min="0" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} /></td>
                      <td className="n">{money(num(it.qty) * num(it.rate))}</td>
                      <td><button className="btn icon danger" onClick={() => removeItem(i)} title="Remove">✕</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="toolbar" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => set({ items: [...bill.items, blankItem()] })}>+ Add item</button>
          </div>
          <div className="form" style={{ gridTemplateColumns: '1fr' }}>
            <Field label="Note"><input value={bill.note} onChange={(e) => set({ note: e.target.value })} placeholder="Optional" /></Field>
          </div>
          <div className="totals">
            <div><span>Subtotal</span><b>{money(totals.sub)}</b></div>
            <div><span>Discount ({db.settings.currency})</span><input type="number" step="any" min="0" value={bill.discount} onChange={(e) => set({ discount: e.target.value })} /></div>
            <div><span>Tax / GST (%)</span><input type="number" step="any" min="0" value={bill.tax} onChange={(e) => set({ tax: e.target.value })} /></div>
            <div><span>Tax amount</span><span>{money(totals.taxAmt)}</span></div>
            <div className="g"><span>Total</span><span>{money(totals.total)}</span></div>
          </div>
          <div className="toolbar" style={{ justifyContent: 'flex-end', margin: '16px 0 0' }}>
            <button className="btn" onClick={() => setBill(newBill(bill.type, db.settings.defaultTax))}>Clear</button>
            <button className="btn primary" onClick={save}>Save {isOut ? 'Sale' : 'Purchase'}</button>
          </div>
        </div>
      )}
      {saved && <InvoiceModal bill={saved} onClose={() => setSaved(null)} />}
    </>
  )
}
