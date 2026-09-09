export function createCache({ max = 200, ttlMs = 30 * 60 * 1000 } = {}) {
  const store = new Map() // key -> { value, expires }
  return {
    get(key) {
      const e = store.get(key)
      if (!e) return undefined
      if (Date.now() > e.expires) { store.delete(key); return undefined }
      store.delete(key); store.set(key, e)
      return e.value
    },
    set(key, value) {
      if (store.has(key)) store.delete(key)
      store.set(key, { value, expires: Date.now() + ttlMs })
      while (store.size > max) {
        const oldest = store.keys().next().value
        store.delete(oldest)
      }
    },
    get size() { return store.size },
  }
}
