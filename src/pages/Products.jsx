import { useState } from 'react'
import { useStore } from '../store'
import { download, num, qtyFmt, r2, toCSV, today, uid } from '../utils'
import { Field, Head, Modal, StockBadge } from '../components/ui'

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'mtr', 'set', 'dozen', 'bag']

export default function Products() {
  const { db, money, low } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [stock, setStock] = useState('')
  const [edit, setEdit] = useState(null) // product object or {} for new
  const [adjust, setAdjust] = useState(null)
  const [del, setDel] = useState(null)

  const cats = [...new Set(db.products.map((p) => p.category).filter(Boolean))].sort()
  const ql = q.toLowerCase()
  const list = db.products
    .filter((p) => (!ql || (p.name + ' ' + p.sku + ' ' + p.category).toLowerCase().includes(ql)) &&
      (!cat || p.category === cat) &&
      (!stock || (stock === 'low' ? num(p.qty) <= low(p) : num(p.qty) > low(p))))
    .sort((a, b) => a.name.localeCompare(b.name))
  const value = db.products.reduce((s, p) => s + num(p.qty) * num(p.cost), 0)

  const exportCsv = () => {
    const rows = [['SKU', 'Name', 'Category', 'Unit', 'Qty', 'Cost', 'Price', 'Stock Value', 'Low Stock Level']]
    db.products.forEach((p) => rows.push([p.sku, p.name, p.category, p.unit, p.qty, p.cost, p.price, r2(num(p.qty) * num(p.cost)), low(p)]))
    download(`miras-products-${today()}.csv`, toCSV(rows), 'text/csv')
  }

  return (
    <>
      <Head title="Products" sub={`${db.products.length} items · Stock value ${money(value)}`}>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
        <button className="btn primary" onClick={() => setEdit({})}>+ Add Product</button>
      </Head>
      <div className="toolbar">
        <input type="search" placeholder="Search name, SKU, category…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={stock} onChange={(e) => setStock(e.target.value)}>
          <option value="">All stock</option><option value="low">Low / Out</option><option value="ok">In stock</option>
        </select>
      </div>
      {!list.length ? (
        <div className="card empty">{db.products.length ? 'Match aagura product illa' : <>Innum products illa. <b>+ Add Product</b> click pannunga.</>}</div>
      ) : (
        <div className="tw"><table>
          <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th className="n">Qty</th><th>Status</th><th className="n">Cost</th><th className="n">Price</th><th className="n">Value</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>{p.sku || <span className="sub">—</span>}</td><td><b>{p.name}</b></td><td>{p.category}</td>
                <td className="n">{qtyFmt(p.qty)} {p.unit}</td><td><StockBadge p={p} /></td>
                <td className="n">{money(p.cost)}</td><td className="n">{money(p.price)}</td><td className="n">{money(num(p.qty) * num(p.cost))}</td>
                <td>
                  <button className="btn sm" onClick={() => setAdjust(p)}>± Stock</button>{' '}
                  <button className="btn sm" onClick={() => setEdit(p)}>Edit</button>{' '}
                  <button className="btn sm danger" onClick={() => setDel(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {edit && <ProductForm p={edit} cats={cats} onClose={() => setEdit(null)} />}
      {adjust && <AdjustForm p={adjust} onClose={() => setAdjust(null)} />}
      {del && <DeleteProduct p={del} onClose={() => setDel(null)} />}
    </>
  )
}

function ProductForm({ p, cats, onClose }) {
  const { db, update, toast } = useStore()
  const isNew = !p.id
  const [f, setF] = useState({ sku: '', name: '', category: '', unit: 'pcs', cost: '', price: '', qty: '', reorder: '', ...p })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const units = UNITS.includes(f.unit) ? UNITS : [...UNITS, f.unit]

  const save = () => {
    const name = f.name.trim(), sku = String(f.sku).trim()
    if (!name) return toast('Product name venum', true)
    if (sku && db.products.some((x) => x.sku.toLowerCase() === sku.toLowerCase() && x.id !== p.id)) return toast('Indha SKU already irukku', true)
    const data = { name, sku, category: String(f.category).trim(), unit: f.unit, qty: r2(num(f.qty)), cost: num(f.cost), price: num(f.price), reorder: f.reorder === '' ? '' : num(f.reorder) }
    update((d) => {
      if (isNew) d.products.push({ id: uid(), created: Date.now(), ...data })
      else Object.assign(d.products.find((x) => x.id === p.id), data)
    })
    toast(isNew ? 'Product added' : 'Product updated')
    onClose()
  }

  return (
    <Modal title={isNew ? 'Add Product' : 'Edit Product'} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>Save</button></>}>
      <div className="form">
        <Field label="Product name *" full><input autoFocus value={f.name} onChange={set('name')} /></Field>
        <Field label="SKU / Code"><input value={f.sku} onChange={set('sku')} placeholder="Optional" /></Field>
        <Field label="Category">
          <input value={f.category} onChange={set('category')} list="catList" />
          <datalist id="catList">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Unit"><select value={f.unit} onChange={set('unit')}>{units.map((u) => <option key={u}>{u}</option>)}</select></Field>
        <Field label={isNew ? 'Opening stock qty' : 'Current stock qty'}><input type="number" step="any" min="0" value={f.qty} onChange={set('qty')} /></Field>
        <Field label="Cost price (purchase)"><input type="number" step="any" min="0" value={f.cost} onChange={set('cost')} /></Field>
        <Field label="Selling price"><input type="number" step="any" min="0" value={f.price} onChange={set('price')} /></Field>
        <Field label="Low-stock alert level" full><input type="number" step="any" min="0" value={f.reorder} onChange={set('reorder')} placeholder={`Default: ${db.settings.lowStock}`} /></Field>
      </div>
    </Modal>
  )
}

function AdjustForm({ p, onClose }) {
  const { update, toast } = useStore()
  const [type, setType] = useState('add')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const apply = () => {
    if (qty === '') return toast('Quantity type pannunga', true)
    const before = num(p.qty), q = num(qty)
    const after = r2(type === 'add' ? before + q : type === 'sub' ? before - q : q)
    if (after < 0) return toast('Stock minus la poga koodathu', true)
    update((d) => {
      d.products.find((x) => x.id === p.id).qty = after
      d.adjustments.push({ id: uid(), pid: p.id, name: p.name, before, after, note: note.trim(), date: today(), created: Date.now() })
    })
    toast('Stock updated')
    onClose()
  }
  return (
    <Modal title={'Stock Adjustment — ' + p.name} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={apply}>Apply</button></>}>
      <p className="sub" style={{ marginTop: 0 }}>Current stock: <b>{qtyFmt(p.qty)} {p.unit}</b>. Damage, return, count correction maadhiri changes ku use pannunga.</p>
      <div className="form">
        <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)}><option value="add">Add (+)</option><option value="sub">Remove (−)</option><option value="set">Set exact qty</option></select></Field>
        <Field label="Quantity"><input autoFocus type="number" step="any" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Reason" full><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="eg. Damaged, Stock count" /></Field>
      </div>
    </Modal>
  )
}

function DeleteProduct({ p, onClose }) {
  const { update, toast } = useStore()
  const go = () => { update((d) => { d.products = d.products.filter((x) => x.id !== p.id) }); toast('Deleted'); onClose() }
  return (
    <Modal title="Delete product?" onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={go}>Delete</button></>}>
      <p style={{ margin: 0 }}><b>{p.name}</b> delete aagum. Old bills la indha name apdiye irukkum.</p>
    </Modal>
  )
}
