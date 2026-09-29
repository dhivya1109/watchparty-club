import { useState } from 'react'
import { MEMBER_COLORS } from '../lib/club'
import { useClub } from '../store/ClubContext'
import { Avatar } from './Avatar'
import { Poppy } from './home/Characters'
import { ProfileForm } from './ProfileForm'

/**
 * 👋 First visit on a device: explain the app, then "who are you?".
 * If the club already has people, you can pick yourself instead of creating a new profile.
 */
export function WelcomeDialog() {
  const { data, me, setMe, addMember, updateMember, finishWelcome } = useClub()
  const [step, setStep] = useState<'hello' | 'who'>('hello')
  // "Me" is the placeholder the app starts with, not a real person.
  const people = data.members.filter((m) => m.name !== 'Me')
  const isNewClub = people.length === 0

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
        {step === 'hello' ? (
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
                ['🔍', 'Find', 'movies, series, anime and books — and add them to the club.'],
                ['🎟️', 'Track', 'what you want to watch, what’s playing, and what you finished.'],
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
              onClick={() => setStep('who')}
              className="mt-6 w-full rounded-full bg-gradient-to-b from-gold to-gold-deep py-3 font-display text-lg font-bold text-ink shadow-lg shadow-gold/25 transition hover:brightness-110"
            >
              Let’s set you up →
            </button>
          </>
        ) : (
          <>
            <h2 id="welcome-title" className="text-2xl font-extrabold">
              {isNewClub ? '👑 You’re starting a new club!' : '👋 Who are you?'}
            </h2>
            <p className="mt-1 text-sm text-soft">
              {isNewClub
                ? 'As the host, you can invite friends and manage the club later from the 👥 Friends tab.'
                : 'Pick yourself if you’re already in this club — or create your profile.'}
            </p>

            {!isNewClub && (
              <div className="mt-4 flex flex-wrap gap-2">
                {people.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMe(m.id)
                      finishWelcome()
                    }}
                    className="flex items-center gap-2 rounded-full border border-line bg-night/40 py-1 pl-1 pr-3.5 text-sm font-medium transition hover:border-gold"
                  >
                    <Avatar member={m} size={28} />
                    I’m {m.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 border-t border-dashed border-line pt-5">
              {!isNewClub && <p className="mb-3 text-sm font-bold">…or set up your profile:</p>}
              <ProfileForm
                // A new person starts with a blank form — never someone else's name and colour.
                initial={me.name === 'Me' ? me : { id: 'new', name: '', color: MEMBER_COLORS[data.members.length % MEMBER_COLORS.length] }}
                submitLabel={isNewClub ? 'Create my club 🍿' : 'That’s me 🍿'}
                onSubmit={(change) => {
                  if (me.name === 'Me') {
                    // Fill in the placeholder profile (for a new club, that's the host).
                    updateMember(me.id, change)
                  } else {
                    // Someone new on this device: add them as a new member — never overwrite another profile.
                    const id = addMember(change.name!)
                    updateMember(id, change)
                    setMe(id)
                  }
                  finishWelcome()
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
