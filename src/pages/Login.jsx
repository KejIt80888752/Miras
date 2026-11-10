import { useState } from 'react'
import { useStore } from '../store'
import { DEMO_PASSWORDS, DEFAULT_USERS } from '../auth'

const LOGO = import.meta.env.BASE_URL + 'the-raise-logo.png'

export default function Login() {
  const { db, login } = useStore()
  const s = db.settings
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const count = (c) => db.products.filter((p) => p.category === c).length

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!email || !pw) return setErr('Email and password are required')
    setBusy(true)
    const u = await login(email, pw)
    setBusy(false)
    if (!u) setErr('Invalid email or password')
    else location.hash = '#/dashboard'
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-left">
          <div className="login-logo"><span className="emblem sm">M</span><span>Miras Carpets</span></div>
          <div className="login-kicker">Inventory &amp; Billing</div>
          <h1 className="login-title">Handwoven Carpets, Pashmina Shawls &amp; Fine Jewels</h1>
          <p className="login-text">Manage stock, billing and customers for every carpet, shawl and jewel, all in one place.</p>
          <div className="login-stats">
            <div><b>{db.products.length}</b><span>Products</span></div>
            <div><b>{count('Carpets')}</b><span>Carpets</span></div>
            <div><b>{count('Shawls')}</b><span>Shawls</span></div>
            <div><b>{count('Jewels')}</b><span>Jewels</span></div>
          </div>
          {(s.address || s.phone) && (
            <div className="login-contact">
              {s.address && <div>📍 {s.address}</div>}
              {s.phone && <div>📞 {s.phone}</div>}
            </div>
          )}
          <div className="login-powered">
            <img src={LOGO} alt="The Raise" />
            <span>POWERED BY KEJ IT SOLUTIONS</span>
          </div>
        </div>

        <form className="login-right" onSubmit={submit}>
          <h2 className="login-h">Sign In</h2>
          <p className="sub" style={{ margin: '4px 0 26px' }}>Access your business dashboard</p>
          <label>Email Address
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mirascarpets.com" />
          </label>
          <label style={{ marginTop: 16 }}>Password
            <div className="pw">
              <input type={show ? 'text' : 'password'} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={show ? 'M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22' : 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'} /></svg>
              </button>
            </div>
          </label>
          {err && <div className="login-err">{err}</div>}
          <button className="btn primary login-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>

          {s.showDemoLogins !== false && (
            <>
              <div className="demo-label">DEMO CREDENTIALS — CLICK TO FILL</div>
              {DEFAULT_USERS.map((u) => (
                <button type="button" key={u.id} className="demo-row" onClick={() => { setEmail(u.email); setPw(DEMO_PASSWORDS[u.role]); setErr('') }}>
                  <b>{u.role}</b><span>{u.email}</span>
                </button>
              ))}
            </>
          )}
        </form>
      </div>
    </div>
  )
}
