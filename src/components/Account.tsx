import { useEffect, useState } from 'react'
import { useClub } from '../store/ClubContext'
import { useToast } from './Toast'
import { Portal } from './ui'

/**
 * ✉️ Save a guest account with your email, or sign in to a saved one on another device.
 * Step 1: your email → Supabase sends an email.
 * Step 2: tap the link in it — this screen notices by itself (or type a code, if the email has one).
 */
export function EmailCodeForm({ mode, onDone }: { mode: 'save' | 'signin'; onDone: () => void }) {
  const { sendSaveCode, confirmSaveCode, sendSignInCode, confirmSignInCode, refreshAccount } = useClub()
  const toast = useToast()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [showCode, setShowCode] = useState(false)

  // While waiting: every few seconds, check whether the email's link has been used.
  useEffect(() => {
    if (step !== 'code') return
    const timer = setInterval(async () => {
      const result = await refreshAccount().catch(() => 'guest' as const)
      if (mode === 'save' && result === 'saved') {
        toast({ title: 'Account saved ✉️', text: `Sign in with ${email.trim()} on any device to get your clubs back.`, emoji: '💾' })
        onDone()
      } else if (mode === 'signin' && result === 'switched') {
        toast({ title: 'Welcome back! 🍿', text: 'Your clubs and ratings are here.', emoji: '👋' })
        onDone()
      }
    }, 4000)
    return () => clearInterval(timer)
  }, [step, mode, email, refreshAccount, toast, onDone])

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }
  const send = () => (mode === 'save' ? sendSaveCode(email) : sendSignInCode(email))

  return step === 'email' ? (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        void run(async () => {
          await send()
          setStep('code')
        })
      }}
    >
      <label className="text-sm font-bold">
        Your email
        <input
          autoFocus
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-xl border border-line bg-night/50 px-3 py-2.5 font-normal outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10"
        />
      </label>
      <p className="text-xs text-muted">
        {mode === 'save'
          ? 'We’ll email you a link to confirm. No password needed — ever.'
          : 'Use the email you saved your account with. We’ll email you a sign-in link.'}
      </p>
      {error && <ErrorNote text={error} />}
      <button
        disabled={busy || !email.includes('@')}
        className="rounded-full bg-gradient-to-b from-gold to-gold-deep py-2.5 font-display font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-40"
      >
        {busy ? 'Sending…' : 'Email me a link ✉️'}
      </button>
    </form>
  ) : (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4 text-center">
        <div className="text-4xl">📬</div>
        <p className="mt-2 font-display text-lg font-bold">Check your email</p>
        <p className="mt-1 text-sm text-soft">
          We sent an email to <b className="text-cream">{email.trim()}</b>. Open it and tap{' '}
          <b className="text-cream">{mode === 'save' ? '“Confirm”' : '“Sign in”'}</b>
          {mode === 'signin' ? ' — ideally on this phone.' : '.'}
        </p>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
          Waiting for you to tap the link… this screen updates by itself.
        </p>
      </div>
      <p className="text-xs text-muted">It can take a minute. Check your spam folder too.</p>

      {error && <ErrorNote text={error} />}

      {/* Backup: some emails (with a custom email service) include a code instead */}
      {showCode ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await (mode === 'save' ? confirmSaveCode(email, code) : confirmSignInCode(email, code))
              onDone()
            })
          }}
        >
          <label className="text-sm font-bold">
            Code from the email
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="123456"
              className="mt-1 w-full rounded-xl border border-line bg-night/50 px-3 py-3 text-center font-display text-2xl font-extrabold tracking-[0.4em] outline-none placeholder:text-muted/50 focus:border-gold focus:ring-4 focus:ring-gold/10"
            />
          </label>
          <button
            disabled={busy || code.length < 6}
            className="rounded-full bg-gradient-to-b from-gold to-gold-deep py-2.5 font-display font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? 'Checking…' : mode === 'save' ? 'Save my account 💾' : 'Sign in 🍿'}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setShowCode(true)} className="text-left text-xs font-semibold text-muted hover:text-cream">
          Got a code instead? Type it here →
        </button>
      )}

      <div className="flex justify-between text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setCode('')
            setError(null)
          }}
          className="text-muted hover:text-cream"
        >
          ← Use a different email
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await send()
              setResent(true)
            })
          }
          className="text-accent hover:underline disabled:opacity-40"
        >
          {resent ? 'Sent again ✓' : 'Send the email again'}
        </button>
      </div>
    </div>
  )
}

function ErrorNote({ text }: { text: string }) {
  return <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">⚠️ {text}</p>
}

/** A pop-up around the form, with a title. */
export function AccountDialog({ mode, onClose }: { mode: 'save' | 'signin'; onClose: () => void }) {
  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="account-title">
      <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="account-title" className="text-2xl font-extrabold">
              {mode === 'save' ? '💾 Save your account' : '✉️ Sign in with email'}
            </h2>
            <p className="mt-1 text-sm text-soft">
              {mode === 'save'
                ? 'Right now your account only lives in this browser. Add your email to keep it safe and use it on any device.'
                : 'Get your profile, clubs and ratings back on this device.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full px-2 text-muted hover:text-cream">
            ✕
          </button>
        </div>
        <div className="mt-5">
          <EmailCodeForm mode={mode} onDone={onClose} />
        </div>
      </div>
    </div>
    </Portal>
  )
}
