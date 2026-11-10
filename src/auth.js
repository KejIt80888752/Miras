// Simple browser-side login. Passwords are stored as SHA-256 hashes, never as plain text.
export async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('miras:' + pw))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const ROLES = {
  Admin: ['dashboard', 'inventory', 'billing', 'bills', 'customers', 'reports', 'settings'],
  Manager: ['dashboard', 'inventory', 'billing', 'bills', 'customers', 'reports'],
  Sales: ['dashboard', 'inventory', 'billing', 'bills', 'customers'],
}

// default accounts (change passwords from Settings → Users)
export const DEFAULT_USERS = [
  { id: 'u_admin', name: 'Miras Admin', email: 'admin@mirascarpets.com', role: 'Admin', hash: '5a7c3ca90c7c629746968290bd99816cf04184dac5cd4f6dd1b85865378afa83' },
  { id: 'u_manager', name: 'Store Manager', email: 'manager@mirascarpets.com', role: 'Manager', hash: 'f7e0d83746ad3a805354ffc77346dea96af674f78e797b7b2d277ddfcd52b5a7' },
  { id: 'u_sales', name: 'Sales Staff', email: 'sales@mirascarpets.com', role: 'Sales', hash: 'a8a06fad7595c3940ba2b21092744c741fc5b96db545814198054626d534bd7f' },
]
export const DEMO_PASSWORDS = { Admin: 'admin123', Manager: 'manager123', Sales: 'sales123' }

const SKEY = 'miras_session'
export const getSession = () => { try { return localStorage.getItem(SKEY) } catch { return null } }
export const setSession = (id) => { try { id ? localStorage.setItem(SKEY, id) : localStorage.removeItem(SKEY) } catch { /* ignore */ } }
