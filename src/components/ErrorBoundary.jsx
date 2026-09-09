import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error?.message, info?.componentStack)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'var(--font-sans, system-ui)', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--color-primary, #F75940)' }}>Có lỗi xảy ra</h2>
          <p style={{ color: 'var(--text-secondary, #666)' }}>Vui lòng tải lại trang.</p>
          <button
            type="button"
            onClick={() => location.reload()}
            style={{ marginTop: 12, padding: '10px 20px', borderRadius: 20, border: 'none', background: 'var(--color-primary, #F75940)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          >
            Tải lại
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
