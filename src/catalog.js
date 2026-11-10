// Miras Carpets — product categories and the extra details each one needs
export const CATALOG = {
  Carpets: {
    icon: '🧶',
    units: ['pcs', 'sqft', 'sqm'],
    fields: [
      { k: 'size', l: 'Size (L × W)', ph: 'eg. 6 × 9 ft' },
      { k: 'material', l: 'Material', list: ['Wool', 'Silk', 'Wool & Silk', 'Cotton', 'Jute', 'Viscose'] },
      { k: 'knots', l: 'Knots / sq inch', ph: 'eg. 400' },
      { k: 'origin', l: 'Origin', list: ['Kashmir', 'Persian', 'Bhadohi', 'Jaipur', 'Turkish', 'Afghan'] },
      { k: 'color', l: 'Colour / Design', ph: 'eg. Red, Floral' },
    ],
  },
  Shawls: {
    icon: '🧣',
    units: ['pcs'],
    fields: [
      { k: 'material', l: 'Material', list: ['Pashmina', 'Cashmere', 'Wool', 'Silk', 'Wool & Silk', 'Cotton'] },
      { k: 'work', l: 'Work / Embroidery', list: ['Plain', 'Sozni', 'Kani', 'Tilla', 'Aari', 'Printed'] },
      { k: 'size', l: 'Size', ph: 'eg. 40 × 80 in' },
      { k: 'color', l: 'Colour', ph: 'eg. Maroon' },
    ],
  },
  Jewels: {
    icon: '💍',
    units: ['pcs', 'g', 'set', 'pair'],
    fields: [
      { k: 'metal', l: 'Metal', list: ['Gold', 'Silver', 'Platinum', 'Oxidised Silver', 'Brass', 'Imitation'] },
      { k: 'purity', l: 'Purity', list: ['24K', '22K', '18K', '14K', '925 Sterling'] },
      { k: 'weight', l: 'Weight (g)', ph: 'eg. 12.5' },
      { k: 'stones', l: 'Stones', ph: 'eg. Ruby, Emerald' },
      { k: 'type', l: 'Type', list: ['Necklace', 'Earrings', 'Bangle', 'Ring', 'Pendant', 'Bracelet', 'Anklet', 'Set'] },
    ],
  },
  Other: { icon: '📦', units: ['pcs', 'kg', 'box', 'set'], fields: [] },
}

export const CATEGORY_NAMES = Object.keys(CATALOG)

export const catOf = (p) => CATALOG[p.category] || CATALOG.Other

// short one-line description, eg. "6 × 9 ft · Silk · Kashmir"
export function detailText(p) {
  const a = p.attrs || {}
  return catOf(p).fields
    .map((f) => (a[f.k] ? (f.k === 'weight' ? a[f.k] + ' g' : f.k === 'knots' ? a[f.k] + ' KPSI' : a[f.k]) : ''))
    .filter(Boolean)
    .join(' · ')
}
