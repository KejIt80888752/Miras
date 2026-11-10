import { useRef, useState } from 'react'
import { freshDb, normalize, sampleDb, useStore } from '../store'
import { download, num, today } from '../utils'
import { Field, Head, Modal } from '../components/ui'

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
        setConfirm({ title: 'Restore backup?', text: `Backup la ${d.products.length} products, ${d.bills.length} bills irukku. Ippo irukkura data replace aagum.`, action: () => { const n = normalize(d); replace(n); setF(n.settings); toast('Restored') } })
      } catch { toast('Idhu valid Miras backup file illa', true) }
    }
    rd.readAsText(file)
  }

  const run = () => { confirm.action(); setConfirm(null); setTyped('') }

  return (
    <>
      <Head title="Settings" sub="Business details invoice la varum" />
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
        <p className="sub" style={{ marginTop: -6 }}>Data indha device browser la mattum save aagum. Weekly oru thadava backup download pannunga.</p>
        <div className="toolbar" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={backup}>⬇ Download backup</button>
          <button className="btn" onClick={() => fileRef.current.click()}>⬆ Restore backup</button>
          <button className="btn" onClick={() => setConfirm({ title: 'Load demo data?', text: 'Demo data ippo irukkura data-vai replace pannum.', action: () => { const s = sampleDb(); replace(s); setF(s.settings); toast('Demo data loaded') } })}>Load demo data</button>
          <button className="btn danger" onClick={() => setConfirm({ title: 'Delete all data?', text: 'Ellaa products, bills, customers delete aagum. Thirumba kondu vara mudiyaadhu (backup illana).', typed: true, action: () => { const n = freshDb(); replace(n); setF(n.settings); toast('All data cleared') } })}>Delete all data</button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
      </div>
      {confirm && (
        <Modal title={confirm.title} onClose={() => { setConfirm(null); setTyped('') }}
          footer={<><button className="btn" onClick={() => { setConfirm(null); setTyped('') }}>Cancel</button>
            <button className="btn primary" disabled={confirm.typed && typed !== 'DELETE'} onClick={run}>Continue</button></>}>
          <p style={{ marginTop: 0 }}>{confirm.text}</p>
          {confirm.typed && <Field label='Confirm panna "DELETE" nu type pannunga'><input value={typed} onChange={(e) => setTyped(e.target.value)} /></Field>}
        </Modal>
      )}
    </>
  )
}
