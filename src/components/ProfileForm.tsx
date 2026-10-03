import { useState } from 'react'
import { BIO_MAX_LENGTH, MEMBER_COLORS, MEMBER_EMOJIS, type Member, type MemberChange } from '../lib/club'
import { Avatar } from './Avatar'

/** Name, avatar and a short bio. Used by the welcome screen and "Edit profile". */
export function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Member
  submitLabel: string
  onSubmit: (change: MemberChange) => void
  onCancel?: () => void
}) {
  // "Me" is the placeholder name the app starts with — don't make people delete it.
  const [name, setName] = useState(initial.name === 'Me' ? '' : initial.name)
  const [emoji, setEmoji] = useState(initial.emoji ?? '')
  const [color, setColor] = useState(initial.color)
  const [bio, setBio] = useState(initial.bio ?? '')
  const preview: Member = { ...initial, name: name || '?', emoji: emoji || undefined, color }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSubmit({ name, emoji: emoji || undefined, color, bio })
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar member={preview} size={64} />
        <label className="flex-1 text-sm font-bold">
          Your name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="e.g. Dhivya"
            className="mt-1 w-full rounded-xl border border-line bg-night/50 px-3 py-2.5 font-normal outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10"
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-bold">Pick an avatar</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <ChoiceButton selected={!emoji} onClick={() => setEmoji('')} label="Use my first letter">
            <span className="text-sm font-bold">{name.trim().charAt(0).toUpperCase() || 'A'}</span>
          </ChoiceButton>
          {MEMBER_EMOJIS.map((e) => (
            <ChoiceButton key={e} selected={emoji === e} onClick={() => setEmoji(e)} label={e}>
              {e}
            </ChoiceButton>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Colour ${c}`}
              aria-pressed={color === c}
              className={`h-8 w-8 rounded-full transition ${color === c ? 'scale-110 ring-2 ring-cream ring-offset-2 ring-offset-surface' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-bold">
        About your taste <span className="font-normal text-muted">(optional)</span>
        <input
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX_LENGTH}
          placeholder="e.g. Horror fan who cries at every anime"
          className="mt-1 w-full rounded-xl border border-line bg-night/50 px-3 py-2.5 font-normal outline-none placeholder:text-muted focus:border-gold focus:ring-4 focus:ring-gold/10"
        />
      </label>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-soft hover:text-cream">
            Cancel
          </button>
        )}
        <button
          disabled={!name.trim()}
          className="rounded-full bg-gold px-6 py-2.5 font-display font-bold text-on-gold transition hover:brightness-110 disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function ChoiceButton({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition ${
        selected ? 'border-gold bg-gold/15' : 'border-line bg-night/40 hover:border-muted'
      }`}
    >
      {children}
    </button>
  )
}
