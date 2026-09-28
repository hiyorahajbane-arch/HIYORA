import { useI18n } from '../lib/i18n.jsx'

export function Loading({ label }) {
  const { t } = useI18n()
  return (
    <div className="state">
      <div className="spinner" aria-hidden="true" />
      <p>{label || t('common.loading')}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  const { t } = useI18n()
  return (
    <div className="state error">
      <p className="big">⚠️</p>
      <p>{error?.message || t('common.loadingError')}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function Empty({ children }) {
  const { t } = useI18n()
  return <div className="state"><p>{children || t('common.loadingError')}</p></div>
}
