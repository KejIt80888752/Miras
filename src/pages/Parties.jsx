import { useState } from 'react'
import { useStore } from '../store'
import { uid } from '../utils'
import { Field, Head, Modal, Seg } from '../components/ui'

export default function Parties() {
  const { db, money, update, toast } = useStore()
  const [tab, setTab] = useState('customer')
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const label = tab === 'customer' ? 'Customer' : 'Supplier'
  const list = db.parties.filter((p) => p.type === tab).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <Head title="Customers & Suppliers" sub="Bill podumbodhu pudhu name type panna auto-va inga save aagum">
        <button className="btn primary" onClick={() => setEdit({ type: tab })}>+ Add {label}</button>
      </Head>
      <div className="toolbar"><Seg value={tab} options={[['customer', 'Customers'], ['supplier', 'Suppliers']]} onChange={setTab} /></div>
      {list.length ? (
        <div className="tw"><table>
          <thead><tr><th>Name</th><th>Phone</th><th>Address</th><th className="n">Bills</th><th className="n">Total business</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => {
              const bs = db.bills.filter((b) => b.partyId === p.id)
              return (
                <tr key={p.id}>
                  <td><b>{p.name}</b></td><td>{p.phone}</td><td>{p.address}</td>
                  <td className="n">{bs.length}</td><td className="n">{money(bs.reduce((s, b) => s + b.total, 0))}</td>
                  <td><button className="btn sm" onClick={() => setEdit(p)}>Edit</button> <button className="btn sm danger" onClick={() => setDel(p)}>Delete</button></td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      ) : <div className="card empty">Innum yarum illa</div>}
      {edit && <PartyForm p={edit} label={label} onClose={() => setEdit(null)} />}
      {del && (
        <Modal title="Delete?" onClose={() => setDel(null)}
          footer={<><button className="btn" onClick={() => setDel(null)}>Cancel</button>
            <button className="btn primary" onClick={() => { update((d) => { d.parties = d.parties.filter((x) => x.id !== del.id) }); toast('Deleted'); setDel(null) }}>Delete</button></>}>
          <p style={{ margin: 0 }}><b>{del.name}</b> delete aagum. Bills delete aagaadhu.</p>
        </Modal>
      )}
    </>
  )
}

function PartyForm({ p, label, onClose }) {
  const { update, toast } = useStore()
  const [f, setF] = useState({ name: '', phone: '', address: '', ...p })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    const name = f.name.trim()
    if (!name) return toast('Name venum', true)
    const data = { name, phone: f.phone.trim(), address: f.address.trim() }
    update((d) => {
      if (p.id) {
        Object.assign(d.parties.find((x) => x.id === p.id), data)
        d.bills.forEach((b) => { if (b.partyId === p.id) b.partyName = name })
      } else d.parties.push({ id: uid(), type: p.type, ...data })
    })
    toast('Saved')
    onClose()
  }
  return (
    <Modal title={p.id ? 'Edit ' + label : 'Add ' + label} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>Save</button></>}>
      <div className="form">
        <Field label="Name *" full><input autoFocus value={f.name} onChange={set('name')} /></Field>
        <Field label="Phone" full><input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Address" full><textarea rows="2" value={f.address} onChange={set('address')} /></Field>
      </div>
    </Modal>
  )
}
