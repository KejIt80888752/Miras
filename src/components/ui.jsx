import { useEffect } from 'react'
import { useStore } from '../store'
import { num } from '../utils'

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="modal-bg open" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'modal' + (wide ? ' wide' : '')}>
        <header><b>{title}</b><button className="x" onClick={onClose} aria-label="Close">×</button></header>
        <div className="body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  )
}

export function StockBadge({ p }) {
  const { low } = useStore()
  if (num(p.qty) <= 0) return <span className="badge b-bad">Out of stock</span>
  if (num(p.qty) <= low(p)) return <span className="badge b-warn">Low</span>
  return <span className="badge b-ok">In stock</span>
}

export function Field({ label, full, children }) {
  return <label className={full ? 'full' : ''}>{label}{children}</label>
}

export function Head({ title, sub, children }) {
  return (
    <div className="head">
      <div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
      {children && <div className="toolbar" style={{ margin: 0 }}>{children}</div>}
    </div>
  )
}

export function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  )
}
