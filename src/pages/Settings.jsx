import { useRef, useState } from 'react'
import { freshDb, normalize, sampleDb, useStore } from '../store'
import { download, num, today } from '../utils'
import { Field, Head, Modal } from '../components/ui'
import { hashPassword, ROLES } from '../auth'
import { uid } from '../utils'
import Icon from '../components/Icon'

function UsersCard() {
  const { db, update, users, setUsers, user, toast } = useStore()
  const [edit, setEdit] = useState(null)
  const [pw, setPw] = useState('')
  const save = async () => {
    const name = edit.name.trim(), email = edit.email.trim().toLowerCase()
    if (!name || !email) return toast('Name and email are required', true)
    if (users.some((u) => u.email.toLowerCase() === email && u.id !== edit.id)) return toast('This email is already in use', true)
    if (!edit.id && pw.length < 6) return toast('Password minimum 6 characters', true)
    if (pw && pw.length < 6) return toast('Password minimum 6 characters', true)
    const hash = pw ? await hashPassword(pw) : undefined
    setUsers((list) => edit.id
      ? list.map((u) => (u.id === edit.id ? { ...u, name, email, role: u.id === user.id ? u.role : edit.role, ...(hash ? { hash } : {}) } : u))
      : [...list, { id: uid(), name, email, role: edit.role, hash }])
    toast(edit.id ? 'User updated' : 'User added')
    setEdit(null); setPw('')
  }
  const remove = (u) => { if (u.id === user.id) return toast('You cannot remove your own account', true); setUsers((l) => l.filter((x) => x.id !== u.id)); toast('User removed') }

  return (
    <div className="card" style={{ maxWidth: 720, marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Users &amp; Login</h2>
        <button className="btn sm primary" onClick={() => { setEdit({ name: '', email: '', role: 'Sales' }); setPw('') }}>+ Add User</button>
      </div>
      <div className="tw"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id}><td><b>{u.name}</b>{u.id === user.id && <span className="badge b-in" style={{ marginLeft: 6 }}>You</span>}</td><td>{u.email}</td><td>{u.role}</td>
            <td><button className="btn sm" onClick={() => { setEdit({ ...u }); setPw('') }}>Edit</button> <button className="btn sm danger" onClick={() => remove(u)}>Remove</button></td></tr>
        ))}</tbody>
      </table></div>
      <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <input type="checkbox" checked={db.settings.showDemoLogins !== false} onChange={(e) => update((d) => { d.settings.showDemoLogins = e.target.checked })} />
        Show demo credentials on the login page
      </label>
      {edit && (
        <Modal title={edit.id ? 'Edit User' : 'Add User'} onClose={() => setEdit(null)}
          footer={<><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary" onClick={save}>Save</button></>}>
          <div className="form">
            <Field label="Name" full><input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Email (login ID)" full><input type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Role">
              <select value={edit.role} disabled={edit.id === user.id} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}</select>
            </Field>
            <Field label={edit.id ? 'New password (blank = no change)' : 'Password'}><input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          </div>
          <p className="sub" style={{ fontSize: 12, marginBottom: 0 }}>Admin: full access · Manager: everything except Settings · Sales: Dashboard, Products, Billing, Bills, Customers</p>
        </Modal>
      )}
    </div>
  )
}

export default function Settings() {
  const { db, update, replace, toast } = useStore()
  const [f, setF] = useState(db.settings)
  const [confirm, setConfirm] = useState(null) // {title, text, action, typed?}
  const [typed, setTyped] = useState('')
  const fileRef = useRef()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = () => {
    update((d) => {
      Object.assign(d.settings, {
        bizName: f.bizName.trim() || 'Miras Carpets', address: f.address.trim(), phone: f.phone.trim(), email: f.email.trim(),
        gstin: f.gstin.trim(), currency: f.currency.trim(), lowStock: num(f.lowStock), defaultTax: num(f.defaultTax),
      })
    })
    toast('Settings saved')
  }

  const backup = () => { download(`miras-backup-${today()}.json`, JSON.stringify(db, null, 1), 'application/json'); toast('Backup downloaded') }

  const onFile = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result)
        if (!d || !Array.isArray(d.products) || !Array.isArray(d.bills)) throw 0
        setConfirm({ title: 'Restore backup?', text: `This backup has ${d.products.length} products and ${d.bills.length} bills. Your current data will be replaced.`, action: () => { const n = normalize(d); replace(n); setF(n.settings); toast('Restored') } })
      } catch { toast('This is not a valid Miras backup file', true) }
    }
    rd.readAsText(file)
  }

  const run = () => { confirm.action(); setConfirm(null); setTyped('') }

  return (
    <>
      <Head title="Settings" sub="Business details shown on your invoices" />
      <div className="card" style={{ maxWidth: 720 }}>
        <h2>Business details</h2>
        <div className="form">
          <Field label="Business name" full><input value={f.bizName} onChange={set('bizName')} /></Field>
          <Field label="Address" full><textarea rows="2" value={f.address} onChange={set('address')} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input value={f.email} onChange={set('email')} /></Field>
          <Field label="GSTIN"><input value={f.gstin} onChange={set('gstin')} /></Field>
          <Field label="Currency symbol"><input value={f.currency} onChange={set('currency')} /></Field>
          <Field label="Default low-stock level"><input type="number" min="0" step="any" value={f.lowStock} onChange={set('lowStock')} /></Field>
          <Field label="Default tax / GST %"><input type="number" min="0" step="any" value={f.defaultTax} onChange={set('defaultTax')} /></Field>
        </div>
        <div className="toolbar" style={{ justifyContent: 'flex-end', margin: '14px 0 0' }}>
          <button className="btn primary" onClick={save}>Save settings</button>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720, marginTop: 14 }}>
        <h2>Backup & data</h2>
        <p className="sub" style={{ marginTop: -6 }}>Data is saved in this browser on this device only. Download a backup every week.</p>
        <div className="toolbar" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={backup}><Icon name="download" /> Download backup</button>
          <button className="btn" onClick={() => fileRef.current.click()}><Icon name="upload" /> Restore backup</button>
          <button className="btn" onClick={() => setConfirm({ title: 'Load demo data?', text: 'Demo data will replace your current data.', action: () => { const s = sampleDb(); replace(s); setF(s.settings); toast('Demo data loaded') } })}>Load demo data</button>
          <button className="btn danger" onClick={() => setConfirm({ title: 'Delete all data?', text: 'All products, bills and customers will be permanently deleted. This cannot be undone without a backup.', typed: true, action: () => { const n = freshDb(); replace(n); setF(n.settings); toast('All data cleared') } })}>Delete all data</button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
      </div>
      <UsersCard />
      {confirm && (
        <Modal title={confirm.title} onClose={() => { setConfirm(null); setTyped('') }}
          footer={<><button className="btn" onClick={() => { setConfirm(null); setTyped('') }}>Cancel</button>
            <button className="btn primary" disabled={confirm.typed && typed !== 'DELETE'} onClick={run}>Continue</button></>}>
          <p style={{ marginTop: 0 }}>{confirm.text}</p>
          {confirm.typed && <Field label='Type "DELETE" to confirm'><input value={typed} onChange={(e) => setTyped(e.target.value)} /></Field>}
        </Modal>
      )}
    </>
  )
}
