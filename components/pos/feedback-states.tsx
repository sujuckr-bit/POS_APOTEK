import type { ReactNode } from 'react'

export function FeedbackBanner({ tone = 'info', title, message, action }: { tone?: 'info' | 'error' | 'success'; title: string; message: string; action?: ReactNode }) {
  return <div className={`feedback-banner feedback-${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite"><div><strong>{title}</strong><span>{message}</span></div>{action}</div>
}

export function PermissionGate({ allowed, permission, children }: { allowed: boolean; permission: string; children: ReactNode }) {
  if (allowed) return <>{children}</>
  return <span className="permission-denied" role="status">Perlu akses {permission}</span>
}

export function ConfirmAction({ title, description, confirmLabel, onConfirm }: { title: string; description: string; confirmLabel: string; onConfirm: () => void }) {
  return <details className="confirm-action"><summary>{title}</summary><p>{description}</p><button type="button" className="button-danger" onClick={onConfirm}>{confirmLabel}</button></details>
}
