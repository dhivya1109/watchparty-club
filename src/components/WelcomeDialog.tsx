import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { EmailCodeForm } from './Account'
import { Poppy } from './home/Characters'
import { ProfileForm } from './ProfileForm'

/**
 * 👋 First visit on a device: explain the app, then set up your profile.
 * Your account is created quietly in the background — no email or password.
 */
export function WelcomeDialog() {
  const { setupProfile, pendingInvite, invitePreview } = useClub()
  // Invited friends skip the tour: straight to "you're invited", then sign in, then into the club.
  const [step, setStep] = useState<'invite' | 'hello' | 'profile' | 'signin'>(pendingInvite ? 'invite' : 'hello')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
        {pendingInvite && step !== 'invite' && (
          <p className="mb-4 rounded-2xl border border-gold/50 bg-gold/10 px-4 py-2.5 text-sm font-semibold">
            🎟️ Joining {invitePreview?.clubName ?? 'your friend’s club'} next
          </p>
        )}
        {step === 'invite' ? (
          <div className="text-center">
            <div className="mx-auto h-24 w-20">
              <Poppy />
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">🎟️ You’re invited</p>
            <h2 id="welcome-title" className="mt-2 text-[clamp(1.5rem,7vw,2rem)] font-extrabold leading-tight">
              {invitePreview ? (
                <>
                  {invitePreview.hostName ?? 'A friend'} invited you to <span className="text-marquee">{invitePreview.clubName}</span>
                </>
              ) : (
                <>
                  Join your friend’s <span className="text-marquee">club</span>
                </>
              )}
            </h2>
            <p className="mt-2 text-sm text-soft">
              {invitePreview
                ? `${invitePreview.memberCount} ${invitePreview.memberCount === 1 ? 'member' : 'members'} · a shared shelf of movies, series, anime & books`
                : 'A shared shelf of movies, series, anime & books — with ratings and reviews.'}
            </p>
            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => setStep('profile')}
                className="rounded-full bg-gradient-to-b from-gold to-gold-deep py-3 font-display text-lg font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110"
              >
                I’m new here →
              </button>
              <button
                onClick={() => setStep('signin')}
                className="rounded-full border-2 border-gold/60 py-2.5 font-display font-bold text-accent transition hover:bg-gold/10"
              >
                I already have an account →
              </button>
            </div>
            <p className="mt-4 text-xs text-muted">You’ll go straight into the club after this.</p>
          </div>
        ) : step === 'hello' ? (
          <>
            <div className="mx-auto h-28 w-24">
              <Poppy />
            </div>
            <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-accent">Welcome to</p>
            <h2 id="welcome-title" className="text-center text-3xl font-extrabold">
              WatchParty <span className="text-marquee">Club</span>
            </h2>
            <p className="mt-2 text-center text-soft">Your friend group’s own little cinema.</p>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {[
                ['🎬', 'Clubs', 'for each group — friends, college, family. Be in as many as you like.'],
                ['🔍', 'Find', 'movies, series, anime and books, and add them to your club.'],
                ['✍️', 'Rate & review', 'so your friends know what’s worth their time.'],
                ['🎡', 'Spin the wheel', 'when nobody can decide what to watch tonight.'],
              ].map(([emoji, bold, text]) => (
                <li key={bold} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised text-lg">{emoji}</span>
                  <span className="pt-1.5 text-soft">
                    <b className="text-cream">{bold}</b> {text}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setStep('profile')}
              className="mt-6 w-full rounded-full bg-gradient-to-b from-gold to-gold-deep py-3 font-display text-lg font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110"
            >
              Let’s set you up →
            </button>
            <p className="mt-4 text-center text-sm text-soft">
              Already have an account?{' '}
              <button onClick={() => setStep('signin')} className="font-bold text-accent hover:underline">
                Sign in with email
              </button>
            </p>
          </>
        ) : step === 'signin' ? (
          <>
            <h2 id="welcome-title" className="text-2xl font-extrabold">
              ✉️ Welcome back
            </h2>
            <p className="mt-1 text-sm text-soft">Sign in to get your profile, clubs and ratings on this device.</p>
            <div className="mt-5">
              {/* When sign-in succeeds, the app loads your account and this screen closes by itself */}
              <EmailCodeForm mode="signin" onDone={() => {}} />
            </div>
            <button onClick={() => setStep(pendingInvite ? 'invite' : 'hello')} className="mt-4 text-sm font-semibold text-muted hover:text-cream">
              ← Back
            </button>
          </>
        ) : (
          <>
            <h2 id="welcome-title" className="text-2xl font-extrabold">
              👋 Who are you?
            </h2>
            <p className="mt-1 text-sm text-soft">This is how your friends will see you, in every club you join.</p>
            <div className="mt-5">
              <ProfileForm
                initial={{ id: 'new', name: '', color: '#8b5cf6' }}
                submitLabel={saving ? 'Saving…' : 'That’s me 🍿'}
                onSubmit={async (change) => {
                  setSaving(true)
                  setError(null)
                  try {
                    await setupProfile({ name: change.name!.trim(), color: change.color!, emoji: change.emoji, bio: change.bio?.trim() || undefined })
                  } catch (err) {
                    setError(err instanceof Error ? err.message : String(err))
                    setSaving(false)
                  }
                }}
              />
            </div>
            {error && <p className="mt-3 rounded-xl bg-coral/10 px-3 py-2 text-sm text-coral">⚠️ {error}</p>}
            <p className="mt-4 text-xs text-muted">
              🔒 No password needed. Later you can save your account with your email to use it on any device.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
