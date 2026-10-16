// Ngày tính theo "epoch day" (UTC) để tránh lệch múi giờ khi cộng trừ ngày.
const DAY = 86400000
export const MAX_DAYS = 7

export const ed = (y, m, d) => Math.floor(Date.UTC(y, m, d) / DAY)
export const isoToEd = (iso) => Math.floor(new Date(iso).getTime() / DAY)
export const edToIso = (n) => new Date(n * DAY).toISOString().slice(0, 10)
export function todayEd() {
  const t = new Date()
  return ed(t.getFullYear(), t.getMonth(), t.getDate())
}

const dm = (n) => { const d = new Date(n * DAY); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}` }

// 23/10, 23–25/10, 30/10 – 2/11
export function rangeLabel(a, b) {
  if (a === b) return dm(a)
  const da = new Date(a * DAY), db = new Date(b * DAY)
  if (da.getUTCMonth() === db.getUTCMonth()) return `${da.getUTCDate()}–${db.getUTCDate()}/${db.getUTCMonth() + 1}`
  return `${dm(a)} – ${dm(b)}`
}

export const dmLabel = dm
