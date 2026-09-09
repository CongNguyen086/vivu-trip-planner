import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error('[Vivu] render error:', err?.message) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', fontFamily: 'var(--font-sans)', padding: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Có lỗi xảy ra</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Ứng dụng gặp sự cố hiển thị. Hãy tải lại trang.</p>
          <button onClick={() => location.reload()} style={{
            height: 44, padding: '0 20px', borderRadius: 'var(--radius-btn)', border: 'none',
            background: 'var(--color-primary)', color: 'var(--text-on-primary)', fontWeight: 700, cursor: 'pointer',
          }}>Tải lại trang</button>
        </div>
      )
    }
    return this.props.children
  }
}
