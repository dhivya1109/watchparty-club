import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { Portal } from './ui'

/**
 * ✉️ Email codes: save a guest account, or sign in to a saved one on another device.
 * Step 1: your email → we send a code. Step 2: type the code.
 */
export function EmailCodeForm({ mode, onDone }: { mode: 'save' | 'signin'; onDone: () => void }) {
  const { sendSaveCode, confirmSaveCode, sendSignInCode, confirmSignInCode } = useClub()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

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
          ? 'We’ll email you a short code. No password needed — ever.'
          : 'Use the email you saved your account with. We’ll send you a code.'}
      </p>
      {error && <ErrorNote text={error} />}
      <button
        disabled={busy || !email.includes('@')}
        className="rounded-full bg-gradient-to-b from-gold to-gold-deep py-2.5 font-display font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-40"
      >
        {busy ? 'Sending…' : 'Send me a code ✉️'}
      </button>
    </form>
  ) : (
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
      <p className="text-sm text-soft">
        We sent a code to <b className="text-cream">{email.trim()}</b>. It can take a minute — check spam too.
      </p>
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
      {error && <ErrorNote text={error} />}
      <button
        disabled={busy || code.length < 6}
        className="rounded-full bg-gradient-to-b from-gold to-gold-deep py-2.5 font-display font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-40"
      >
        {busy ? 'Checking…' : mode === 'save' ? 'Save my account 💾' : 'Sign in 🍿'}
      </button>
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
          {resent ? 'New code sent ✓' : 'Send a new code'}
        </button>
      </div>
    </form>
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
