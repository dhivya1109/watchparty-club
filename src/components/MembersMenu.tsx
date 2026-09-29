import { useState } from 'react'
import { useClub } from '../store/ClubContext'
import { Avatar } from './Avatar'

/** Header button: shows who you are, and opens a panel to manage the club's members. */
export function MembersMenu() {
  const { data, me, setMe, addMember, renameMember, removeMember } = useClub()
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const submitNew = () => {
    if (!newName.trim()) return
    addMember(newName)
    setNewName('')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm transition hover:border-gold"
      >
        <Avatar member={me} size={28} />
        <span className="max-w-16 truncate font-medium sm:max-w-28">{me.name}</span>
        <span className="text-xs text-muted">▾</span>
      </button>

      {open && (
        <>
          {/* Clicking outside the panel closes it */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="animate-pop absolute right-0 z-30 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-line bg-surface p-5 shadow-2xl shadow-black/60">
            <h3 className="text-lg font-bold">👥 The club</h3>
            <p className="mt-0.5 text-xs text-muted">Tap “Be me” to choose who is using this device.</p>

            <ul className="mt-4 flex flex-col gap-2">
              {data.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2">
                  <Avatar member={m} size={28} />
                  <input
                    value={m.name}
                    onChange={(e) => renameMember(m.id, e.target.value)}
                    aria-label="Member name"
                    className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-2.5 py-1.5 text-sm outline-none focus:border-gold"
                  />
                  {m.id === me.id ? (
                    <span className="w-14 text-center text-xs font-bold text-gold">You</span>
                  ) : (
                    <button
                      onClick={() => setMe(m.id)}
                      className="w-14 rounded-full border border-line py-1 text-xs font-medium transition hover:border-gold hover:text-gold"
                    >
                      Be me
                    </button>
                  )}
                  <button
                    onClick={() =>
                      confirm(`Remove ${m.name}? Their ratings and progress will be deleted too.`) && removeMember(m.id)
                    }
                    disabled={data.members.length === 1}
                    title="Remove member"
                    aria-label={`Remove ${m.name}`}
                    className="rounded-full p-1 text-muted transition hover:text-coral disabled:opacity-30"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                submitNew()
              }}
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Friend’s name"
                className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-gold"
              />
              <button className="rounded-xl bg-gold px-4 text-sm font-bold text-night transition hover:brightness-110">
                + Add
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
