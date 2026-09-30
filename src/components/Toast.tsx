import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

/**
 * Toasts: short messages that slide up from the bottom, confirm what just happened,
 * and offer a next step — then disappear on their own.
 */

export interface ToastAction {
  label: string
  onClick: () => void
  primary?: boolean
}

export interface ToastMessage {
  title: string
  text?: string
  image?: string
  emoji?: string
  actions?: ToastAction[]
}

const TOAST_MS = 5000

const ToastContext = createContext<((toast: ToastMessage) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastMessage & { id: number }) | null>(null)
  const count = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback((message: ToastMessage) => {
    const id = ++count.current
    setToast({ ...message, id })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast((t) => (t?.id === id ? null : t)), TOAST_MS)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* role="status" makes screen readers announce the message */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4" role="status" aria-live="polite">
        {toast && (
          <div
            key={toast.id}
            className="animate-toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-gold/50 bg-surface p-2.5 pr-3 shadow-2xl shadow-black/50"
          >
            {toast.image ? (
              <img src={toast.image} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-raised text-2xl">{toast.emoji ?? '✨'}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold leading-tight">{toast.title}</p>
              {toast.text && <p className="line-clamp-2 text-xs text-soft">{toast.text}</p>}
            </div>
            {toast.actions?.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  a.onClick()
                  setToast(null)
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  a.primary ? 'bg-gold text-ink hover:brightness-110' : 'text-soft hover:text-cream'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast must be used inside <ToastProvider>')
  return show
}
