import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { ProfileForm } from './ProfileForm'

/**
 * 👋 Right after creating an account: set up your profile (name, colour, emoji).
 * Invited friends then go straight into the club.
 */
export function WelcomeDialog() {
  const { setupProfile, pendingInvite, invitePreview } = useClub()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="animate-pop max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-line bg-surface p-6 shadow-2xl">
        {pendingInvite && (
          <p className="mb-4 rounded-2xl border border-gold/50 bg-gold/10 px-4 py-2.5 text-sm font-semibold">
            🎟️ Joining {invitePreview?.clubName ?? 'your friend’s club'} next
          </p>
        )}
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
      </div>
    </div>
  )
}
