export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
export const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0 }
export const r2 = (n) => Math.round(n * 100) / 100
export const qtyFmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })
export const makeMoney = (cur) => (n) =>
  (cur || '') + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const dateKey = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
export const today = () => dateKey(new Date())
export const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dateKey(d) }
export const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}-${m}-${y}` }

export const lowLimit = (p, settings) =>
  p.reorder !== '' && p.reorder != null ? num(p.reorder) : num(settings.lowStock)

export function calcBill(b) {
  const sub = r2(b.items.reduce((s, it) => s + num(it.qty) * num(it.rate), 0))
  const taxable = Math.max(0, sub - num(b.discount))
  const taxAmt = r2((taxable * num(b.tax)) / 100)
  return { sub, taxAmt, total: r2(taxable + taxAmt) }
}

export function download(name, text, type) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const toCSV = (rows) =>
  rows
    .map((r) => r.map((v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }).join(','))
    .join('\n')
