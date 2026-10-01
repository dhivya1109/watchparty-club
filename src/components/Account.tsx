import { useState, type ReactNode } from 'react'
import { useClub } from '../store/ClubContext'
import { Poppy } from './home/Characters'
import { Portal } from './ui'

const HAS_ACCOUNT_KEY = 'watchparty-club:has-account'

const inputClass =
  'mt-1 w-full rounded-xl border border-line bg-night/50 px-3 py-2.5 font-normal outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10'
const goldButton =
  'rounded-full bg-gradient-to-b from-gold to-gold-deep py-3 font-display text-lg font-bold text-on-gold shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-40'

/** Runs a form action with a "busy" flag and a friendly error message. */
function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  return { busy, error, setError, run }
}

function EmailField({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="text-sm font-bold">
      Email
      <input
        autoFocus={autoFocus}
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="you@example.com"
        className={inputClass}
      />
    </label>
  )
}

function PasswordField({ value, onChange, isNew }: { value: string; onChange: (v: string) => void; isNew: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <label className="text-sm font-bold">
      Password
      <span className="relative block">
        <input
          type={show ? 'text' : 'password'}
          autoComplete={isNew ? 'new-password' : 'current-password'}
          required
          minLength={isNew ? 6 : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isNew ? 'At least 6 characters' : 'Your password'}
          className={`${inputClass} pr-16`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:text-cream"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </label>
  )
}

function ErrorNote({ text }: { text: string }) {
  return <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">⚠️ {text}</p>
}

/**
 * 🔐 The first screen when you're not logged in: create an account or log in.
 * Invited friends see who invited them, then go straight into that club.
 */
export function AuthScreen() {
  const { signUp, logIn, sendPasswordReset, invitePreview, pendingInvite } = useClub()
  const [mode, setMode] = useState<'signup' | 'login' | 'reset' | 'reset-sent'>(() => (read(HAS_ACCOUNT_KEY) ? 'login' : 'signup'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, error, setError, run } = useAction()

  const switchTo = (next: typeof mode) => {
    setMode(next)
    setError(null)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto h-24 w-20">
            <Poppy />
          </div>
          {pendingInvite ? (
            <>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">🎟️ You’re invited</p>
              <h1 className="mt-1 text-[clamp(1.5rem,7vw,2rem)] font-extrabold leading-tight">
                {invitePreview ? (
                  <>
                    {invitePreview.hostName ?? 'A friend'} invited you to <span className="text-marquee">{invitePreview.clubName}</span>
                  </>
                ) : (
                  <>
                    Join your friend’s <span className="text-marquee">club</span>
                  </>
                )}
              </h1>
              <p className="mt-1 text-sm text-soft">Log in or create an account — you’ll go straight into the club.</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">Welcome to</p>
              <h1 className="text-3xl font-extrabold">
                WatchParty <span className="text-marquee">Club</span>
              </h1>
              <p className="mt-1 text-sm text-soft">Movies, series, anime & books — tracked, rated and picked with friends.</p>
            </>
          )}
        </div>

        <div className="mt-6 rounded-[2rem] border border-line bg-surface p-5 shadow-2xl sm:p-6">
          {mode === 'signup' || mode === 'login' ? (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-night/60 p-1" role="tablist">
                {(
                  [
                    ['signup', 'Create account'],
                    ['login', 'Log in'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => switchTo(value)}
                    className={`rounded-xl py-2 font-display font-bold transition ${
                      mode === value ? 'bg-raised text-cream shadow' : 'text-muted hover:text-cream'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form
                className="mt-5 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void run(async () => {
                    await (mode === 'signup' ? signUp(email, password) : logIn(email, password))
                    write(HAS_ACCOUNT_KEY, 'yes')
                  })
                }}
              >
                <EmailField value={email} onChange={setEmail} />
                <PasswordField value={password} onChange={setPassword} isNew={mode === 'signup'} />
                {error && <ErrorNote text={error} />}
                <button disabled={busy || !email.includes('@') || password.length < (mode === 'signup' ? 6 : 1)} className={`mt-1 ${goldButton}`}>
                  {busy ? 'One moment…' : mode === 'signup' ? 'Create my account 🍿' : 'Log in 🍿'}
                </button>
              </form>
              {mode === 'login' ? (
                <button onClick={() => switchTo('reset')} className="mt-4 w-full text-center text-sm font-semibold text-muted hover:text-cream">
                  Forgot your password?
                </button>
              ) : (
                <p className="mt-4 text-center text-xs text-muted">Use it on any phone or laptop — your clubs and ratings come with you.</p>
              )}
            </>
          ) : mode === 'reset' ? (
            <>
              <h2 className="text-xl font-extrabold">🔑 Reset your password</h2>
              <p className="mt-1 text-sm text-soft">We’ll email you a link to choose a new one.</p>
              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void run(async () => {
                    await sendPasswordReset(email)
                    setMode('reset-sent')
                  })
                }}
              >
                <EmailField value={email} onChange={setEmail} autoFocus />
                {error && <ErrorNote text={error} />}
                <button disabled={busy || !email.includes('@')} className={goldButton}>
                  {busy ? 'Sending…' : 'Email me a link ✉️'}
                </button>
              </form>
              <button onClick={() => switchTo('login')} className="mt-4 text-sm font-semibold text-muted hover:text-cream">
                ← Back to log in
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="text-4xl">📬</div>
              <p className="mt-2 font-display text-lg font-bold">Check your email</p>
              <p className="mt-1 text-sm text-soft">
                Open the link we sent to <b className="text-cream">{email.trim()}</b> — on this device — to choose a new password. Check spam too.
              </p>
              <button onClick={() => switchTo('login')} className="mt-4 text-sm font-semibold text-muted hover:text-cream">
                ← Back to log in
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

/** A pop-up card with a title and a close button. */
function Dialog({ title, text, onClose, children }: { title: string; text: string; onClose?: () => void; children: ReactNode }) {
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="account-title" className="text-2xl font-extrabold">
                {title}
              </h2>
              <p className="mt-1 text-sm text-soft">{text}</p>
            </div>
            {onClose && (
              <button onClick={onClose} aria-label="Close" className="rounded-full px-2 text-muted hover:text-cream">
                ✕
              </button>
            )}
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </Portal>
  )
}

/** 💾 Older guest accounts: add an email + password so the account is kept. */
export function AccountDialog({ onClose }: { onClose: () => void }) {
  const { saveGuestAccount } = useClub()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { busy, error, run } = useAction()
  return (
    <Dialog
      title="💾 Save your account"
      text="Right now your account only lives in this browser. Add an email and password to keep it and log in on any device."
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => {
            await saveGuestAccount(email, password)
            write(HAS_ACCOUNT_KEY, 'yes')
            onClose()
          })
        }}
      >
        <EmailField value={email} onChange={setEmail} autoFocus />
        <PasswordField value={password} onChange={setPassword} isNew />
        {error && <ErrorNote text={error} />}
        <button disabled={busy || !email.includes('@') || password.length < 6} className={goldButton}>
          {busy ? 'Saving…' : 'Save my account 💾'}
        </button>
      </form>
    </Dialog>
  )
}

/** 🔑 Opened from a "reset your password" email. */
export function NewPasswordDialog() {
  const { setNewPassword } = useClub()
  const [password, setPassword] = useState('')
  const { busy, error, run } = useAction()
  return (
    <Dialog title="🔑 Choose a new password" text="You’re logged in from the email link. Pick a new password for next time.">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          void run(() => setNewPassword(password))
        }}
      >
        <PasswordField value={password} onChange={setPassword} isNew />
        {error && <ErrorNote text={error} />}
        <button disabled={busy || password.length < 6} className={goldButton}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </Dialog>
  )
}

// Browser storage can be blocked (e.g. private mode) — the app still works.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}
