// Wikimedia yêu cầu User-Agent mô tả rõ (chính sách API). Thiếu UA dễ bị chặn/
// throttle, nhất là khi tải song song nhiều thẻ → ảnh trả null ngẫu nhiên.
// Kèm timeout để không treo khi upstream chậm.
const UA = 'VivuTripPlanner/1.0 (demo; https://github.com/CongNguyen086/vivu-trip-planner)'

export async function wikiFetch(url, { timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, {
      headers: { 'User-Agent': UA, 'Api-User-Agent': UA, Accept: 'application/json' },
      signal: ctrl.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}
