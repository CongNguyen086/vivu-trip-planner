import { Button, Icon } from '../design-system/index.js'

export function ErrorBanner({ message, onRetry }) {
  return (
    <div role="alert" style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: 'var(--color-error-bg)', border: '1px solid var(--color-error)',
      borderRadius: 'var(--radius-card)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
    }}>
      <Icon name="x" size={18} color="var(--color-error)" />
      <span style={{ flex: 1, fontSize: 14 }}>{message || 'Có lỗi xảy ra. Thử lại.'}</span>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>}
    </div>
  )
}
