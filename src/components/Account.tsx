import { useEffect, useState } from 'react'
import { useClub } from '../store/ClubContext'
import { Poppy } from './home/Characters'
import { Portal } from './ui'

const inputClass =
  'mt-1 w-full rounded-xl border border-line bg-night/50 px-3 py-2.5 font-normal outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10'
const goldButton =
  'rounded-full bg-gradient-to-b from-gold to-gold-deep py-3 font-display text-lg font-bold text-on-gold shadow-lg shadow-gold/25 transition hover:brightness-110 disabled:opacity-40'
/** Digits in the emailed code (Supabase → Sign In / Providers → Email → Email OTP Length). */
const CODE_LENGTH = 6
/** Supabase only allows a new code once a minute. */
const RESEND_SECONDS = 60

/**
 * ✉️ Two steps: type your email → type the code we emailed you.
 * Used to log in (or create an account), and to save an older guest account.
 */
function EmailCodeForm({
  send,
  verify,
  submitLabel,
}: {
  send: (email: string) => Promise<void>
  verify: (email: string, code: string) => Promise<void>
  submitLabel: string
}) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wait, setWait] = useState(0)

  // Count down until another code can be sent
  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

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
  const sendCode = () =>
    run(async () => {
      await send(email)
      setStep('code')
      setCode('')
      setWait(RESEND_SECONDS)
    })

  return step === 'email' ? (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        void sendCode()
      }}
    >
      <label className="text-sm font-bold">
        Your email
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass}
        />
      </label>
      {error && <ErrorNote text={error} />}
      <button disabled={busy || !email.includes('@')} className={goldButton}>
        {busy ? 'Sending…' : 'Send me a code ✉️'}
      </button>
      <p className="text-center text-xs text-muted">We’ll email you a short code. No password needed.</p>
    </form>
  ) : (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        void run(() => verify(email, code))
      }}
    >
      <p className="text-sm text-soft">
        We emailed a code to <b className="text-cream">{email.trim()}</b>. Type it here — check spam if it’s not there in a minute.
      </p>
      <CodeBoxes
        value={code}
        onChange={(next) => {
          setCode(next)
          // The last digit checks the code straight away — no need to tap "Log in".
          if (next.length === CODE_LENGTH && !busy) void run(() => verify(email, next))
        }}
      />
      {error && <ErrorNote text={error} />}
      <button disabled={busy || code.length < CODE_LENGTH} className={goldButton}>
        {busy ? 'Checking…' : submitLabel}
      </button>
      <div className="flex justify-between text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setStep('email')
            setError(null)
          }}
          className="text-muted hover:text-cream"
        >
          ← Change email
        </button>
        <button type="button" disabled={busy || wait > 0} onClick={() => void sendCode()} className="text-accent hover:underline disabled:text-muted disabled:no-underline">
          {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
        </button>
      </div>
    </form>
  )
}

/**
 * Six boxes, one per digit. Underneath it's ONE invisible input stretched over the boxes,
 * so pasting, the keyboard's "code from Mail" suggestion and backspace all just work.
 */
function CodeBoxes({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [focused, setFocused] = useState(true)
  return (
    <label className="block text-sm font-bold">
      Code
      <span className="relative mt-1 grid grid-cols-6 gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const active = focused && (i === value.length || (i === CODE_LENGTH - 1 && value.length === CODE_LENGTH))
          return (
            <span
              key={i}
              className={`flex aspect-[4/5] items-center justify-center rounded-xl border bg-night/50 font-display text-2xl font-extrabold transition ${
                active ? 'border-gold ring-4 ring-gold/10' : value[i] ? 'border-muted' : 'border-line'
              }`}
            >
              {value[i] ?? (active ? <span className="h-6 w-0.5 animate-pulse bg-gold" /> : '')}
            </span>
          )
        })}
        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`${CODE_LENGTH}-digit code`}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none selection:bg-transparent"
        />
      </span>
    </label>
  )
}

function ErrorNote({ text }: { text: string }) {
  return <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">⚠️ {text}</p>
}

/**
 * 🔐 The first screen when you're not logged in. New and returning people do the same thing:
 * email → code. New people then set up their profile.
 * Invited friends see who invited them, then go straight into that club.
 */
export function AuthScreen() {
  const { sendLoginCode, verifyLoginCode, invitePreview, pendingInvite } = useClub()

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
              <p className="mt-1 text-sm text-soft">Log in with your email — you’ll go straight into the club.</p>
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
          <h2 className="mb-4 text-xl font-extrabold">Log in or sign up</h2>
          <EmailCodeForm send={sendLoginCode} verify={verifyLoginCode} submitLabel="Log in 🍿" />
        </div>
      </div>
    </main>
  )
}

/** 💾 Older guest accounts: add an email so the account is kept. */
export function AccountDialog({ onClose }: { onClose: () => void }) {
  const { sendSaveCode, confirmSaveCode } = useClub()
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="account-title">
        <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="account-title" className="text-2xl font-extrabold">
                💾 Save your account
              </h2>
              <p className="mt-1 text-sm text-soft">
                Right now your account only lives in this browser. Add your email to keep it and log in on any device.
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="rounded-full px-2 text-muted hover:text-cream">
              ✕
            </button>
          </div>
          <div className="mt-5">
            <EmailCodeForm
              send={sendSaveCode}
              verify={async (email, code) => {
                await confirmSaveCode(email, code)
                onClose()
              }}
              submitLabel="Save my account 💾"
            />
          </div>
        </div>
      </div>
    </Portal>
  )
}
